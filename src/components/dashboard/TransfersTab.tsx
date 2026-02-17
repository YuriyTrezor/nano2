import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight, Search, CreditCard, ArrowRightLeft, Building2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const transferHistory = [
  { type: "in", title: "Перевод → 121212121", category: "Перевод", date: "16 февр. 2026 г., 16:42", amount: "+103 434 ₽", positive: true },
  { type: "in", title: "Возврат средств. Причина: неверно указан номер карты (номер введён с пробелами).", category: "Перевод", date: "16 февр. 2026 г., 16:25", amount: "+5 000 ₽", positive: true },
  { type: "out", title: "Перевод → 434343", category: "Перевод", date: "16 февр. 2026 г., 16:18", amount: "-25 000 ₽", positive: false },
  { type: "out", title: "Перевод → 44345678987654444", category: "Перевод", date: "16 февр. 2026 г., 15:39", amount: "-10 000 ₽", positive: false },
  { type: "out", title: "Перевод → 44345678987654444", category: "Перевод", date: "14 февр. 2026 г., 23:59", amount: "-3 434 ₽", positive: false },
  { type: "in", title: "Пополнение баланса", category: "Пополнение", date: "14 февр. 2026 г., 23:21", amount: "+676 ₽", positive: true },
  { type: "in", title: "Пополнение баланса", category: "Пополнение", date: "14 февр. 2026 г., 23:03", amount: "+454 ₽", positive: true },
  { type: "out", title: "Оплатить: Мобильная связь (у56767667)", category: "Мобильная связь", date: "14 февр. 2026 г., 22:43", amount: "-98 781 ₽", positive: false },
];

type TransferType = "card" | "own" | "bank";

const tabs: { key: TransferType; label: string; icon: React.ReactNode }[] = [
  { key: "card", label: "На карту", icon: <CreditCard className="w-4 h-4" /> },
  { key: "own", label: "Между своими", icon: <ArrowRightLeft className="w-4 h-4" /> },
  { key: "bank", label: "В другой банк", icon: <Building2 className="w-4 h-4" /> },
];

const TransfersTab = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<TransferType>("card");
  const [cardNumber, setCardNumber] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [amount, setAmount] = useState("");
  const [transactions, setTransactions] = useState(transferHistory);
  const [balance, setBalance] = useState(124350);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowForm(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSubmit = () => {
    const sum = parseFloat(amount.replace(/\s/g, ""));
    if (!cardNumber.trim() || !amount.trim() || isNaN(sum) || sum <= 0) {
      toast.error("Заполните все поля корректно");
      return;
    }
    if (sum > balance) {
      toast.error("Недостаточно средств на счёте");
      return;
    }

    const newBalance = balance - sum;
    setBalance(newBalance);

    const now = new Date();
    const dateStr = now.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" }) + ", " + now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });

    setTransactions(prev => [{
      type: "out",
      title: `Перевод → ${cardNumber}`,
      category: "Перевод",
      date: dateStr,
      amount: `-${sum.toLocaleString("ru-RU")} ₽`,
      positive: false,
    }, ...prev]);

    toast.success(`Перевод на сумму ${sum.toLocaleString("ru-RU")} ₽ выполнен`);
    setCardNumber("");
    setRecipientName("");
    setAmount("");
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <ArrowLeftRight className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Переводы</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Баланс: <span className="text-foreground font-semibold">₽ {balance.toLocaleString("ru-RU")},00</span>
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <CreditCard className="w-4 h-4" /> Новый перевод
        </Button>
      </div>

      {/* Transfer form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowForm(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 relative" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-foreground text-lg font-bold">Перевод</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Form fields */}
            <div className="space-y-4">
              <Input
                placeholder="Номер карты"
                value={cardNumber}
                onChange={e => setCardNumber(e.target.value)}
                className="bg-secondary border-border"
              />
              <Input
                placeholder="Имя получателя"
                value={recipientName}
                onChange={e => setRecipientName(e.target.value)}
                className="bg-secondary border-border"
              />
              <Input
                placeholder="Сумма ₽"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="bg-secondary border-border"
                type="number"
              />
              <Button onClick={handleSubmit} className="w-full h-12 text-base font-semibold">
                Отправить
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction history */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-foreground font-semibold">История операций</h3>
          <div className="relative w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Поиск..." className="pl-9 bg-secondary border-border h-9 text-sm" />
          </div>
        </div>
        <div className="space-y-0">
          {transactions.map((tx, i) => (
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
