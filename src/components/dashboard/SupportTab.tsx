import { MessageSquare, Send, RefreshCw } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { playNotificationSound } from "@/utils/notificationSound";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesCount = useRef(0);

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
      <p className="text-muted-foreground text-sm mb-6">{t("Сообщения из чата поддержки")}</p>

      <div className="flex gap-4 h-[500px]">
        {/* Tickets list */}
        <div className="w-80 bg-card border border-border rounded-2xl p-4 flex flex-col">
          <h3 className="text-foreground font-semibold mb-3">{t("Диалоги")} ({tickets.length})</h3>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {tickets.length === 0 && (
              <p className="text-muted-foreground text-xs text-center mt-4">Нет обращений</p>
            )}
            {tickets.map((ticket) => (
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
                <p className="text-foreground font-semibold">{currentTicket.display_name}</p>
                <p className="text-muted-foreground text-xs">{currentTicket.subject}</p>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.sender_role !== "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-xl px-4 py-2 ${
                      msg.sender_role !== "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                      <p className="text-[10px] opacity-70 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-border flex gap-2">
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
