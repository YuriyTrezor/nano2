import { MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";

interface Message {
  id: number;
  text: string;
  from: "user" | "support";
  time: string;
}

const initialDialogs = [
  {
    id: 1,
    name: "Chargeback",
    lastMessage: "Ты отстань ты",
    date: "16.02.2026, 16:42:14",
    messages: [
      { id: 1, text: "Здравствуйте, у меня проблема с транзакцией", from: "user" as const, time: "16:40" },
      { id: 2, text: "Ты отстань ты", from: "support" as const, time: "16:42" },
    ],
  },
];

const SupportTab = () => {
  const { t } = useLanguage();
  const [dialogs, setDialogs] = useState(initialDialogs);
  const [selectedDialog, setSelectedDialog] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const [newRequestText, setNewRequestText] = useState("");
  const [showNewRequest, setShowNewRequest] = useState(false);

  const currentDialog = dialogs.find(d => d.id === selectedDialog);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedDialog) return;
    const newMsg: Message = {
      id: Date.now(),
      text: messageText,
      from: "user",
      time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
    };
    setDialogs(prev => prev.map(d =>
      d.id === selectedDialog
        ? { ...d, messages: [...d.messages, newMsg], lastMessage: messageText }
        : d
    ));
    setMessageText("");
  };

  const handleNewRequest = () => {
    if (!newRequestText.trim()) return;
    const newDialog = {
      id: Date.now(),
      name: "Новое обращение",
      lastMessage: newRequestText,
      date: new Date().toLocaleString("ru-RU"),
      messages: [
        { id: 1, text: newRequestText, from: "user" as const, time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) },
      ],
    };
    setDialogs(prev => [...prev, newDialog]);
    setSelectedDialog(newDialog.id);
    setNewRequestText("");
    setShowNewRequest(false);
    toast({ title: t("Информация"), description: "Обращение создано" });
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <MessageSquare className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">{t("Обращения клиентов")}</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-6">{t("Сообщения из чата поддержки")}</p>

      <div className="flex gap-4 h-[500px]">
        {/* Dialogs list */}
        <div className="w-80 bg-card border border-border rounded-2xl p-4 flex flex-col">
          <h3 className="text-foreground font-semibold mb-3">{t("Диалоги")} ({dialogs.length})</h3>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {dialogs.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDialog(d.id)}
                className={`w-full text-left p-3 rounded-xl transition-colors ${
                  selectedDialog === d.id ? 'bg-secondary' : 'hover:bg-secondary/50'
                }`}
              >
                <p className="text-foreground font-semibold text-sm">{d.name}</p>
                <p className="text-muted-foreground text-xs truncate">{d.lastMessage}</p>
                <p className="text-muted-foreground text-[10px] mt-1">{d.date}</p>
              </button>
            ))}
          </div>
          {/* New request button */}
          <div className="mt-3 pt-3 border-t border-border">
            {showNewRequest ? (
              <div className="space-y-2">
                <Input
                  placeholder={t("Введите сообщение...")}
                  value={newRequestText}
                  onChange={e => setNewRequestText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleNewRequest()}
                  className="bg-secondary border-border text-foreground text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleNewRequest} className="flex-1">{t("Отправить")}</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowNewRequest(false)}>{t("Отмена")}</Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setShowNewRequest(true)} className="w-full gap-2" variant="outline">
                <MessageSquare className="w-4 h-4" />
                {t("Новое обращение")}
              </Button>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 bg-card border border-border rounded-2xl flex flex-col">
          {currentDialog ? (
            <>
              <div className="p-4 border-b border-border">
                <p className="text-foreground font-semibold">{currentDialog.name}</p>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {currentDialog.messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-xl px-4 py-2 ${
                      msg.from === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                      <p className="text-[10px] opacity-70 mt-1">{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-border flex gap-2">
                <Input
                  placeholder={t("Введите сообщение...")}
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
