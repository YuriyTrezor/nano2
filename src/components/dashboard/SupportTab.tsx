import { MessageSquare } from "lucide-react";
import { useState } from "react";

const dialogs = [
  {
    id: 1,
    name: "Chargeback",
    lastMessage: "Ты отстань ты",
    date: "16.02.2026, 16:42:14",
  },
];

const SupportTab = () => {
  const [selectedDialog, setSelectedDialog] = useState<number | null>(null);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <MessageSquare className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Обращения клиентов</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-6">Сообщения из чата поддержки</p>

      <div className="flex gap-4 h-[500px]">
        {/* Dialogs list */}
        <div className="w-80 bg-card border border-border rounded-2xl p-4">
          <h3 className="text-foreground font-semibold mb-3">Диалоги ({dialogs.length})</h3>
          <div className="space-y-2">
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
        </div>

        {/* Chat area */}
        <div className="flex-1 bg-card border border-border rounded-2xl flex items-center justify-center">
          {selectedDialog ? (
            <p className="text-muted-foreground text-sm">Чат загружен</p>
          ) : (
            <p className="text-muted-foreground text-sm">Выберите диалог</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportTab;
