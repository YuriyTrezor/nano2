import { MessageCircle, Send, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatMessage {
  id: number;
  text: string;
  from: "user" | "support";
  time: string;
}

const FloatingChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;
    const msg: ChatMessage = {
      id: Date.now(),
      text: text.trim(),
      from: "user",
      time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages(prev => [...prev, msg]);
    setText("");

    // Auto-reply after short delay
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: "Спасибо за обращение! Ваше сообщение передано менеджеру. Ожидайте ответа.",
        from: "support",
        time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
      }]);
    }, 1000);
  };

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
              <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 ${
                  msg.from === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                }`}>
                  <p className="text-xs">{msg.text}</p>
                  <p className="text-[9px] opacity-60 mt-0.5">{msg.time}</p>
                </div>
              </div>
            ))}
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
        className="ml-auto flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    </div>
  );
};

export default FloatingChat;
