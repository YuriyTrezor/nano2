import { MessageCircle, Send, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { playNotificationSound } from "@/utils/notificationSound";

interface ChatMessage {
  id: string;
  text: string;
  sender_role: string;
  created_at: string;
}

const FloatingChat = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Find or ignore ticket on mount
  useEffect(() => {
    if (!user) return;
    
    const loadTicket = async () => {
      // Find existing open ticket
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
        loadMessages(tid);
        loadUnread(tid);
      }
    };

    loadTicket();
  }, [user]);

  const loadMessages = async (tid: string) => {
    const { data } = await supabase
      .from("support_messages")
      .select("id, text, sender_role, created_at")
      .eq("ticket_id", tid)
      .order("created_at", { ascending: true });
    if (data) setMessages(data);
  };

  const loadUnread = async (tid: string) => {
    const { data } = await supabase
      .from("support_messages")
      .select("id")
      .eq("ticket_id", tid)
      .eq("sender_role", "support")
      .eq("is_read", false);
    setUnreadCount(data?.length || 0);
  };

  // Realtime
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel("client-support")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "support_messages",
      }, (payload) => {
        const msg = payload.new as any;
        if (msg.ticket_id === ticketId) {
          setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev;
            return [...prev, { id: msg.id, text: msg.text, sender_role: msg.sender_role, created_at: msg.created_at }];
          });
          
          if (msg.sender_role === "support") {
            playNotificationSound();
            if (!open) {
              setUnreadCount(prev => prev + 1);
            } else {
              // Mark as read
              supabase.from("support_messages").update({ is_read: true }).eq("id", msg.id).then();
            }
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ticketId, open, user]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark as read when opening
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

  const handleSend = async () => {
    if (!text.trim() || !user) return;

    let tid = ticketId;

    // Create ticket if none exists
    if (!tid) {
      const { data: newTicket } = await supabase
        .from("support_tickets")
        .insert({ user_id: user.id, subject: "Новое обращение" })
        .select("id")
        .single();
      
      if (!newTicket) return;
      tid = newTicket.id;
      setTicketId(tid);
    }

    await supabase.from("support_messages").insert({
      ticket_id: tid,
      sender_id: user.id,
      sender_role: "user",
      text: text.trim(),
    });

    setText("");
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-3 w-80 bg-card border border-border rounded-2xl shadow-lg flex flex-col overflow-hidden" style={{ height: 400 }}>
          <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5">
            <span className="text-foreground font-semibold text-sm">Чат поддержки</span>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 p-3 overflow-y-auto space-y-2">
            {messages.length === 0 && (
              <p className="text-muted-foreground text-xs text-center mt-8">Напишите ваш вопрос — мы ответим!</p>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender_role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 ${
                  msg.sender_role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                }`}>
                  <p className="text-xs">{msg.text}</p>
                  <p className="text-[9px] opacity-60 mt-0.5">
                    {new Date(msg.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-3 border-t border-border flex gap-2">
            <Input
              placeholder="Введите сообщение..."
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
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
