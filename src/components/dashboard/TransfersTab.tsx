import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const transfers = [
  { type: "in", title: "Перевод → 121212121", category: "Перевод", date: "16 февр. 2026 г., 16:42", amount: "+103 434 ₽", positive: true },
  { type: "in", title: "Возврат средств. Причина: неверно указан номер карты (номер введён с пробелами).", category: "Перевод", date: "16 февр. 2026 г., 16:25", amount: "+5 000 ₽", positive: true },
  { type: "out", title: "Перевод → 434343", category: "Перевод", date: "16 февр. 2026 г., 16:18", amount: "-25 000 ₽", positive: false },
  { type: "out", title: "Перевод → 44345678987654444", category: "Перевод", date: "16 февр. 2026 г., 15:39", amount: "-10 000 ₽", positive: false },
  { type: "out", title: "Перевод → 44345678987654444", category: "Перевод", date: "14 февр. 2026 г., 23:59", amount: "-3 434 ₽", positive: false },
  { type: "in", title: "Пополнение баланса", category: "Пополнение", date: "14 февр. 2026 г., 23:21", amount: "+676 ₽", positive: true },
  { type: "in", title: "Пополнение баланса", category: "Пополнение", date: "14 февр. 2026 г., 23:03", amount: "+454 ₽", positive: true },
  { type: "out", title: "Оплатить: Мобильная связь (у56767667)", category: "Мобильная связь", date: "14 февр. 2026 г., 22:43", amount: "-98 781 ₽", positive: false },
];

const TransfersTab = () => {
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <ArrowLeftRight className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Переводы</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-6">История операций</p>

      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-foreground font-semibold">История операций</h3>
          <div className="relative w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Поиск..." className="pl-9 bg-secondary border-border h-9 text-sm" />
          </div>
        </div>
        <div className="space-y-0">
          {transfers.map((tx, i) => (
            <div key={i} className="flex items-center justify-between py-4 border-b border-border last:border-0">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${tx.positive ? 'bg-primary/20' : 'bg-secondary'}`}>
                  {tx.positive ? <ArrowDownLeft className="w-4 h-4 text-primary" /> : <ArrowUpRight className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div>
                  <p className="text-foreground text-sm font-medium">{tx.title}</p>
                  <p className="text-muted-foreground text-xs">{tx.category} · {tx.date}</p>
                </div>
              </div>
              <p className={`text-sm font-semibold ${tx.positive ? 'text-primary' : 'text-foreground'}`}>{tx.amount}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TransfersTab;
