import { MessageCircle, Send, X, Paperclip, FileText, Download } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { playNotificationSound } from "@/utils/notificationSound";
import { toast } from "@/hooks/use-toast";

interface ChatMessage {
  id: string;
  text: string;
  sender_role: string;
  created_at: string;
}

const formatMessageDateTime = (value: string) =>
  new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const FloatingChat = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadMessages = useCallback(async (tid: string) => {
    const { data } = await supabase
      .from("support_messages")
      .select("id, text, sender_role, created_at")
      .eq("ticket_id", tid)
      .order("created_at", { ascending: true });

    if (data) setMessages(data);
  }, []);

  const loadUnread = useCallback(async (tid: string) => {
    const { data } = await supabase
      .from("support_messages")
      .select("id")
      .eq("ticket_id", tid)
      .eq("sender_role", "support")
      .eq("is_read", false);

    setUnreadCount(data?.length || 0);
  }, []);

  const loadLatestOpenTicket = useCallback(async () => {
    if (!user) return;

    const { data: existingTickets } = await supabase
      .from("support_tickets")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(1);

    if (existingTickets && existingTickets.length > 0) {
      const tid = existingTickets[0].id;
      setTicketId(tid);
      await Promise.all([loadMessages(tid), loadUnread(tid)]);
    }
  }, [user, loadMessages, loadUnread]);

  useEffect(() => {
    if (!user) return;
    loadLatestOpenTicket();
  }, [user, loadLatestOpenTicket]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("client-support")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
        },
        (payload) => {
          const msg = payload.new as any;
          if (msg.ticket_id === ticketId) {
            setMessages((prev) => {
              if (prev.find((m) => m.id === msg.id)) return prev;
              return [...prev, { id: msg.id, text: msg.text, sender_role: msg.sender_role, created_at: msg.created_at }];
            });

            if (msg.sender_role === "support") {
              playNotificationSound();
              if (!open) {
                setUnreadCount((prev) => prev + 1);
              } else {
                supabase.from("support_messages").update({ is_read: true }).eq("id", msg.id).then();
              }
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          if (ticketId) {
            void Promise.all([loadMessages(ticketId), loadUnread(ticketId)]);
          } else {
            void loadLatestOpenTicket();
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, open, user, loadMessages, loadUnread, loadLatestOpenTicket]);

  useEffect(() => {
    if (!user) return;

    const intervalId = window.setInterval(() => {
      if (ticketId) {
        void Promise.all([loadMessages(ticketId), loadUnread(ticketId)]);
      } else {
        void loadLatestOpenTicket();
      }
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [user, ticketId, loadMessages, loadUnread, loadLatestOpenTicket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open && ticketId) {
      supabase
        .from("support_messages")
        .update({ is_read: true })
        .eq("ticket_id", ticketId)
        .eq("sender_role", "support")
        .eq("is_read", false)
        .then();
      setUnreadCount(0);
    }
  }, [open, ticketId]);

  const ensureTicket = async (): Promise<string | null> => {
    if (ticketId) return ticketId;
    if (!user) return null;

    const { data: newTicket } = await supabase
      .from("support_tickets")
      .insert({ user_id: user.id, subject: "Новое обращение" })
      .select("id")
      .single();

    if (!newTicket) return null;

    setTicketId(newTicket.id);
    return newTicket.id;
  };

  const handleSend = async () => {
    if (!text.trim() || !user) return;
    const tid = await ensureTicket();
    if (!tid) return;

    const { error } = await supabase.from("support_messages").insert({
      ticket_id: tid,
      sender_id: user.id,
      sender_role: "user",
      text: text.trim(),
    });

    if (error) {
      toast({ title: "Ошибка отправки сообщения", variant: "destructive" });
      return;
    }

    setText("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Файл слишком большой (макс. 5 МБ)", variant: "destructive" });
      return;
    }

    setUploading(true);
    const tid = await ensureTicket();
    if (!tid) {
      setUploading(false);
      return;
    }

    const filePath = `${tid}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from("support-attachments").upload(filePath, file);

    if (uploadError) {
      toast({ title: "Ошибка загрузки файла", variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("support-attachments").getPublicUrl(filePath);

    const { error: messageError } = await supabase.from("support_messages").insert({
      ticket_id: tid,
      sender_id: user.id,
      sender_role: "user",
      text: `📎 [${file.name}](${urlData.publicUrl})`,
    });

    if (messageError) {
      toast({ title: "Ошибка отправки файла", variant: "destructive" });
      setUploading(false);
      return;
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const renderMessageText = (msgText: string) => {
    const linkMatch = msgText.match(/^📎 \[(.+?)\]\((.+?)\)$/);
    if (linkMatch) {
      return (
        <a href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 underline text-xs">
          <FileText className="w-3 h-3" />
          {linkMatch[1]}
          <Download className="w-2.5 h-2.5" />
        </a>
      );
    }
    return <p className="text-xs">{msgText}</p>;
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50">
      {open && (
        <div
          className="mb-3 w-[calc(100vw-2rem)] sm:w-80 bg-card border border-border rounded-2xl shadow-lg flex flex-col overflow-hidden"
          style={{ height: 400 }}
        >
          <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5">
            <span className="text-foreground font-semibold text-sm">Чат поддержки</span>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 p-3 overflow-y-auto space-y-2">
            {messages.length === 0 && <p className="text-muted-foreground text-xs text-center mt-8">Напишите ваш вопрос — мы ответим!</p>}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender_role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 ${
                    msg.sender_role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                  }`}
                >
                  {renderMessageText(msg.text)}
                  <p className="text-[9px] opacity-60 mt-0.5">{formatMessageDateTime(msg.created_at)}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-3 border-t border-border flex gap-2">
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
              className="h-9 w-9 shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Paperclip className={`w-3.5 h-3.5 ${uploading ? "animate-spin" : ""}`} />
            </Button>
            <Input
              placeholder="Введите сообщение..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="text-sm h-9"
            />
            <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSend}>
              <Send className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="ml-auto flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors relative"
      >
        <MessageCircle className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};

export default FloatingChat;
