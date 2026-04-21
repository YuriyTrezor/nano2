import { MessageSquare, Send, RefreshCw, Trash2, Paperclip, FileText, Download, ArrowUpDown, User, ShieldCheck } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { playNotificationSound } from "@/utils/notificationSound";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  display_name?: string;
  last_activity_at: string;
}

interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: string;
  text: string;
  is_read: boolean;
  created_at: string;
}

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const formatTime = (value: string) =>
  new Date(value).toLocaleString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

const getDateLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

  if (isSameDay(date, today)) return "Сегодня";
  if (isSameDay(date, yesterday)) return "Вчера";
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
};

const getInitials = (name?: string) => {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
};

const SupportTab = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState(false);
  const [dateAsc, setDateAsc] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTickets = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const { data: ticketsData } = await supabase
        .from("support_tickets")
        .select("*")
        .order("updated_at", { ascending: false });

      if (!ticketsData || ticketsData.length === 0) {
        setTickets([]);
        setUnreadCounts({});
        return;
      }

      const userIds = [...new Set(ticketsData.map((t) => t.user_id))];
      const ticketIds = ticketsData.map((t) => t.id);

      const profilesPromise = userIds.length
        ? supabase.from("profiles").select("user_id, display_name").in("user_id", userIds)
        : Promise.resolve({ data: [] as Array<{ user_id: string; display_name: string | null }> });

      const unreadPromise = supabase
        .from("support_messages")
        .select("ticket_id")
        .eq("sender_role", "user")
        .eq("is_read", false);

      const latestMessagesPromise = ticketIds.length
        ? supabase
            .from("support_messages")
            .select("ticket_id, created_at")
            .in("ticket_id", ticketIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] as Array<{ ticket_id: string; created_at: string }> });

      const [{ data: profilesData }, { data: unreadData }, { data: latestMessagesData }] = await Promise.all([
        profilesPromise,
        unreadPromise,
        latestMessagesPromise,
      ]);

      const profileMap: Record<string, string> = {};
      profilesData?.forEach((p) => {
        profileMap[p.user_id] = p.display_name || "Пользователь";
      });

      const counts: Record<string, number> = {};
      unreadData?.forEach((m) => {
        counts[m.ticket_id] = (counts[m.ticket_id] || 0) + 1;
      });
      setUnreadCounts(counts);

      const latestByTicket: Record<string, string> = {};
      latestMessagesData?.forEach((m) => {
        if (!latestByTicket[m.ticket_id]) {
          latestByTicket[m.ticket_id] = m.created_at;
        }
      });

      setTickets(
        ticketsData.map((t) => ({
          ...t,
          display_name: profileMap[t.user_id] || "Пользователь",
          last_activity_at: latestByTicket[t.id] || t.updated_at || t.created_at,
        }))
      );
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (ticketId: string, markUserMessagesRead = false) => {
    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data);
    }

    if (markUserMessagesRead) {
      await supabase
        .from("support_messages")
        .update({ is_read: true })
        .eq("ticket_id", ticketId)
        .eq("sender_role", "user")
        .eq("is_read", false);

      setUnreadCounts((prev) => ({ ...prev, [ticketId]: 0 }));
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (selectedTicket) {
      void fetchMessages(selectedTicket, true);
    }
  }, [selectedTicket, fetchMessages]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-support-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
        },
        (payload) => {
          const newMsg = payload.new as Message;
          const isCurrentTicket = newMsg.ticket_id === selectedTicket;
          const isUserMessage = newMsg.sender_role === "user";

          let ticketFound = false;
          setTickets((prev) => {
            const hasTicket = prev.some((t) => t.id === newMsg.ticket_id);
            ticketFound = hasTicket;
            if (!hasTicket) return prev;

            return prev.map((t) =>
              t.id === newMsg.ticket_id
                ? {
                    ...t,
                    updated_at: newMsg.created_at,
                    last_activity_at: newMsg.created_at,
                  }
                : t
            );
          });

          if (!ticketFound) {
            void fetchTickets(true);
          }

          if (isCurrentTicket) {
            setMessages((prev) => {
              if (prev.find((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });

            if (isUserMessage) {
              setUnreadCounts((prev) => ({ ...prev, [newMsg.ticket_id]: 0 }));
              supabase.from("support_messages").update({ is_read: true }).eq("id", newMsg.id).then();
            }
          } else if (isUserMessage) {
            setUnreadCounts((prev) => ({
              ...prev,
              [newMsg.ticket_id]: (prev[newMsg.ticket_id] || 0) + 1,
            }));
          }

          if (isUserMessage && newMsg.sender_id !== user?.id) {
            playNotificationSound();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_tickets",
        },
        () => {
          playNotificationSound();
          void fetchTickets(true);
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          void fetchTickets(true);
          if (selectedTicket) {
            void fetchMessages(selectedTicket, false);
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedTicket, user?.id, fetchTickets, fetchMessages]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void fetchTickets(true);
      if (selectedTicket) {
        void fetchMessages(selectedTicket, false);
      }
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [selectedTicket, fetchTickets, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    const trimmedText = messageText.trim();
    if (!trimmedText || !selectedTicket || !user) return;

    const { error } = await supabase.from("support_messages").insert({
      ticket_id: selectedTicket,
      sender_id: user.id,
      sender_role: "support",
      text: trimmedText,
    });

    if (error) {
      toast({ title: "Ошибка отправки сообщения", variant: "destructive" });
      return;
    }

    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === selectedTicket
          ? {
              ...ticket,
              last_activity_at: new Date().toISOString(),
            }
          : ticket
      )
    );
    setMessageText("");
  };

  const handleDeleteMessage = async (msgId: string) => {
    await supabase.from("support_messages").delete().eq("id", msgId);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    toast({ title: "Сообщение удалено" });
  };

  const handleDeleteConversation = async (ticketId: string) => {
    await supabase.from("support_messages").delete().eq("ticket_id", ticketId);
    await supabase.from("support_tickets").delete().eq("id", ticketId);
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    if (selectedTicket === ticketId) {
      setSelectedTicket(null);
      setMessages([]);
    }
    toast({ title: "Переписка удалена" });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTicket || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Файл слишком большой (макс. 5 МБ)", variant: "destructive" });
      return;
    }

    setUploading(true);
    const filePath = `${selectedTicket}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from("support-attachments").upload(filePath, file);

    if (uploadError) {
      toast({ title: "Ошибка загрузки файла", variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("support-attachments").getPublicUrl(filePath);

    const { error: messageError } = await supabase.from("support_messages").insert({
      ticket_id: selectedTicket,
      sender_id: user.id,
      sender_role: "support",
      text: `📎 [${file.name}](${urlData.publicUrl})`,
    });

    if (messageError) {
      toast({ title: "Ошибка отправки файла", variant: "destructive" });
      setUploading(false);
      return;
    }

    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === selectedTicket
          ? {
              ...ticket,
              last_activity_at: new Date().toISOString(),
            }
          : ticket
      )
    );

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const renderMessageText = (text: string) => {
    const linkMatch = text.match(/^📎 \[(.+?)\]\((.+?)\)$/);
    if (linkMatch) {
      return (
        <a href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 underline text-sm">
          <FileText className="w-4 h-4" />
          {linkMatch[1]}
          <Download className="w-3 h-3" />
        </a>
      );
    }
    return <p className="text-sm">{text}</p>;
  };

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
  const currentTicket = tickets.find((t) => t.id === selectedTicket);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <MessageSquare className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">
          {t("Обращения клиентов")}
          {totalUnread > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
              {totalUnread}
            </span>
          )}
        </h1>
        <Button variant="ghost" size="icon" onClick={() => fetchTickets()} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>
      <div className="flex items-center gap-3 mb-6">
        <p className="text-muted-foreground text-sm">{t("Сообщения из чата поддержки")}</p>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setDateAsc((prev) => !prev)}>
          <ArrowUpDown className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex gap-4 h-[500px]">
        <div className="w-80 bg-card border border-border rounded-2xl p-4 flex flex-col">
          <h3 className="text-foreground font-semibold mb-3">
            {t("Диалоги")} ({tickets.length})
          </h3>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {tickets.length === 0 && <p className="text-muted-foreground text-xs text-center mt-4">Нет обращений</p>}
            {[...tickets]
              .sort((a, b) => {
                const aHasUnread = (unreadCounts[a.id] || 0) > 0;
                const bHasUnread = (unreadCounts[b.id] || 0) > 0;

                if (aHasUnread && !bHasUnread) return -1;
                if (bHasUnread && !aHasUnread) return 1;

                const diff = new Date(a.last_activity_at).getTime() - new Date(b.last_activity_at).getTime();
                return dateAsc ? diff : -diff;
              })
              .map((ticket) => {
                const hasUnread = (unreadCounts[ticket.id] || 0) > 0;
                const isSelected = selectedTicket === ticket.id;
                return (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all relative ${
                      isSelected
                        ? "bg-secondary ring-1 ring-primary/30"
                        : hasUnread
                        ? "bg-primary/5 border border-primary/20 hover:bg-primary/10"
                        : "hover:bg-secondary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar className={`w-8 h-8 shrink-0 ${hasUnread ? "ring-2 ring-primary" : ""}`}>
                        <AvatarFallback className={`text-[10px] font-bold ${hasUnread ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          {getInitials(ticket.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${hasUnread ? "font-bold text-foreground" : "font-semibold text-foreground"}`}>
                          {ticket.display_name}
                        </p>
                        <p className={`text-xs truncate ${hasUnread ? "text-foreground/70" : "text-muted-foreground"}`}>
                          {ticket.subject}
                        </p>
                      </div>
                    </div>
                    <p className="text-muted-foreground text-[10px] mt-1.5 ml-[42px]">{formatDateTime(ticket.last_activity_at)}</p>
                    {hasUnread && (
                      <span className="absolute top-3 right-3 min-w-5 h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center animate-pulse">
                        {unreadCounts[ticket.id]}
                      </span>
                    )}
                  </button>
                );
              })}

          </div>
        </div>

        <div className="flex-1 bg-card border border-border rounded-2xl flex flex-col">
          {currentTicket ? (
            <>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                      {getInitials(currentTicket.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-foreground font-semibold">{currentTicket.display_name}</p>
                      <Badge variant="secondary" className="text-[10px] gap-1 px-1.5 py-0">
                        <User className="w-2.5 h-2.5" />
                        Клиент
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">{currentTicket.subject}</p>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Удалить переписку?</AlertDialogTitle>
                      <AlertDialogDescription>Все сообщения в этом диалоге будут удалены безвозвратно.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteConversation(currentTicket.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Удалить
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.map((msg, idx) => {
                  const prevMsg = messages[idx - 1];
                  const currentDate = getDateLabel(msg.created_at);
                  const prevDate = prevMsg ? getDateLabel(prevMsg.created_at) : null;
                  const showDateSeparator = currentDate !== prevDate;
                  const isSupport = msg.sender_role !== "user";

                  return (
                    <div key={msg.id}>
                      {showDateSeparator && (
                        <div className="flex items-center gap-3 my-4">
                          <div className="flex-1 h-px bg-border" />
                          <span className="text-[11px] font-medium text-muted-foreground px-2">{currentDate}</span>
                          <div className="flex-1 h-px bg-border" />
                        </div>
                      )}
                      <div className={`flex ${isSupport ? "justify-end" : "justify-start"} group`}>
                        {!isSupport && (
                          <Avatar className="w-6 h-6 mr-2 mt-1 shrink-0">
                            <AvatarFallback className="text-[8px] bg-muted text-muted-foreground">
                              {getInitials(currentTicket.display_name)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={`max-w-[70%] rounded-xl px-4 py-2 relative ${
                            isSupport ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                          }`}
                        >
                          {!isSupport && (
                            <p className="text-[10px] font-semibold opacity-70 mb-0.5">{currentTicket.display_name}</p>
                          )}
                          {isSupport && (
                            <p className="text-[10px] font-semibold opacity-70 mb-0.5 flex items-center gap-1">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              Поддержка
                            </p>
                          )}
                          {renderMessageText(msg.text)}
                          <p className="text-[10px] opacity-70 mt-1">{formatTime(msg.created_at)}</p>
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                        {isSupport && (
                          <Avatar className="w-6 h-6 ml-2 mt-1 shrink-0">
                            <AvatarFallback className="text-[8px] bg-primary/20 text-primary">
                              <ShieldCheck className="w-3 h-3" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-border flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="*/*"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="shrink-0"
                >
                  <Paperclip className={`w-4 h-4 ${uploading ? "animate-spin" : ""}`} />
                </Button>
                <Input
                  placeholder={t("Введите ответ...")}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className="bg-secondary border-border text-foreground"
                />
                <Button onClick={handleSendMessage} size="icon">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground text-sm">{t("Выберите диалог")}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportTab;
