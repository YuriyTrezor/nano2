import { MessageSquare, Send, RefreshCw, Trash2, Paperclip, FileText, Download, ArrowUpDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { playNotificationSound } from "@/utils/notificationSound";
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
  display_name?: string;
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
  const prevMessagesCount = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchTickets = async () => {
    setLoading(true);
    const { data: ticketsData } = await supabase
      .from("support_tickets")
      .select("*")
      .order("updated_at", { ascending: false });

    if (ticketsData) {
      // Get display names for each ticket owner
      const userIds = [...new Set(ticketsData.map(t => t.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const profileMap: Record<string, string> = {};
      profiles?.forEach(p => { profileMap[p.user_id] = p.display_name || "Пользователь"; });

      setTickets(ticketsData.map(t => ({
        ...t,
        display_name: profileMap[t.user_id] || "Пользователь",
      })));

      // Fetch unread counts per ticket (messages from users, not read by admin)
      const { data: unreadData } = await supabase
        .from("support_messages")
        .select("ticket_id")
        .eq("sender_role", "user")
        .eq("is_read", false);

      const counts: Record<string, number> = {};
      unreadData?.forEach(m => {
        counts[m.ticket_id] = (counts[m.ticket_id] || 0) + 1;
      });
      setUnreadCounts(counts);
    }
    setLoading(false);
  };

  const fetchMessages = async (ticketId: string) => {
    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data);
      prevMessagesCount.current = data.length;
    }

    // Mark user messages as read
    await supabase
      .from("support_messages")
      .update({ is_read: true })
      .eq("ticket_id", ticketId)
      .eq("sender_role", "user")
      .eq("is_read", false);

    setUnreadCounts(prev => ({ ...prev, [ticketId]: 0 }));
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) fetchMessages(selectedTicket);
  }, [selectedTicket]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("admin-support-messages")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "support_messages",
      }, (payload) => {
        const newMsg = payload.new as Message;
        
        // If in current ticket, add message
        if (newMsg.ticket_id === selectedTicket) {
          setMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Mark as read if from user
          if (newMsg.sender_role === "user") {
            supabase.from("support_messages").update({ is_read: true }).eq("id", newMsg.id).then();
          }
        }
        
        // Play sound and update unread if from user
        if (newMsg.sender_role === "user" && newMsg.sender_id !== user?.id) {
          playNotificationSound();
          if (newMsg.ticket_id !== selectedTicket) {
            setUnreadCounts(prev => ({
              ...prev,
              [newMsg.ticket_id]: (prev[newMsg.ticket_id] || 0) + 1,
            }));
          }
          fetchTickets();
        }
      })
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "support_tickets",
      }, () => {
        playNotificationSound();
        fetchTickets();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedTicket, user?.id]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedTicket || !user) return;
    await supabase.from("support_messages").insert({
      ticket_id: selectedTicket,
      sender_id: user.id,
      sender_role: "support",
      text: messageText.trim(),
    });
    setMessageText("");
  };

  const handleDeleteMessage = async (msgId: string) => {
    await supabase.from("support_messages").delete().eq("id", msgId);
    setMessages(prev => prev.filter(m => m.id !== msgId));
    toast({ title: "Сообщение удалено" });
  };

  const handleDeleteConversation = async (ticketId: string) => {
    await supabase.from("support_messages").delete().eq("ticket_id", ticketId);
    await supabase.from("support_tickets").delete().eq("id", ticketId);
    setTickets(prev => prev.filter(t => t.id !== ticketId));
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
    const { error: uploadError } = await supabase.storage
      .from("support-attachments")
      .upload(filePath, file);

    if (uploadError) {
      toast({ title: "Ошибка загрузки файла", variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("support-attachments")
      .getPublicUrl(filePath);

    await supabase.from("support_messages").insert({
      ticket_id: selectedTicket,
      sender_id: user.id,
      sender_role: "support",
      text: `📎 [${file.name}](${urlData.publicUrl})`,
    });

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
  const currentTicket = tickets.find(t => t.id === selectedTicket);

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
        <Button variant="ghost" size="icon" onClick={fetchTickets} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>
      <div className="flex items-center gap-3 mb-6">
        <p className="text-muted-foreground text-sm">{t("Сообщения из чата поддержки")}</p>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setDateAsc(prev => !prev)}>
          <ArrowUpDown className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex gap-4 h-[500px]">
        {/* Tickets list */}
        <div className="w-80 bg-card border border-border rounded-2xl p-4 flex flex-col">
          <h3 className="text-foreground font-semibold mb-3">{t("Диалоги")} ({tickets.length})</h3>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {tickets.length === 0 && (
              <p className="text-muted-foreground text-xs text-center mt-4">Нет обращений</p>
            )}
            {[...tickets]
              .sort((a, b) => {
                const aUnread = unreadCounts[a.id] || 0;
                const bUnread = unreadCounts[b.id] || 0;
                if (aUnread > 0 && bUnread === 0) return -1;
                if (bUnread > 0 && aUnread === 0) return 1;
                if (bUnread !== aUnread) return bUnread - aUnread;
                const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                return dateAsc ? diff : -diff;
              }).map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket.id)}
                className={`w-full text-left p-3 rounded-xl transition-colors relative ${
                  selectedTicket === ticket.id ? "bg-secondary" : "hover:bg-secondary/50"
                }`}
              >
                <p className="text-foreground font-semibold text-sm">{ticket.display_name}</p>
                <p className="text-muted-foreground text-xs truncate">{ticket.subject}</p>
                <p className="text-muted-foreground text-[10px] mt-1">
                  {new Date(ticket.created_at).toLocaleString("ru-RU")}
                </p>
                {(unreadCounts[ticket.id] || 0) > 0 && (
                  <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                    {unreadCounts[ticket.id]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 bg-card border border-border rounded-2xl flex flex-col">
          {currentTicket ? (
            <>
              <div className="p-4 border-b border-border">
                <div>
                  <p className="text-foreground font-semibold">{currentTicket.display_name}</p>
                  <p className="text-muted-foreground text-xs">{currentTicket.subject}</p>
                </div>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender_role !== "user" ? "justify-end" : "justify-start"} group`}>
                    <div className={`max-w-[70%] rounded-xl px-4 py-2 relative ${
                      msg.sender_role !== "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                    }`}>
                      {renderMessageText(msg.text)}
                      <p className="text-[10px] opacity-70 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-border flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
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
                  onChange={e => setMessageText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSendMessage()}
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
