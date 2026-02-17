import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight, Search, CreditCard, ArrowRightLeft, Building2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type TransferType = "card" | "own" | "bank";

const tabs: { key: TransferType; label: string; icon: React.ReactNode }[] = [
  { key: "card", label: "На карту", icon: <CreditCard className="w-4 h-4" /> },
  { key: "own", label: "Между своими", icon: <ArrowRightLeft className="w-4 h-4" /> },
  { key: "bank", label: "В другой банк", icon: <Building2 className="w-4 h-4" /> },
];

interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  created_at: string;
}

const TransfersTab = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<TransferType>("card");
  const [cardNumber, setCardNumber] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [amount, setAmount] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Compute balance from transactions
  const balance = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);

  // Fetch user transactions from DB
  useEffect(() => {
    if (!user) return;
    const fetchTransactions = async () => {
      const { data } = await supabase
        .from("transactions")
        .select("id, title, category, amount, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (data) setTransactions(data);
    };
    fetchTransactions();
  }, [user]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowForm(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSubmit = async () => {
    if (!user) return;
    const sum = parseFloat(amount.replace(/\s/g, ""));
    if (!cardNumber.trim() || !amount.trim() || isNaN(sum) || sum <= 0) {
      toast.error("Заполните все поля корректно");
      return;
    }
    if (sum > balance) {
      toast.error("Недостаточно средств на счёте");
      return;
    }

    const title = `Перевод → ${cardNumber}`;
    const { data, error } = await supabase.from("transactions").insert({
      user_id: user.id,
      title,
      category: "Перевод",
      amount: -sum,
    }).select("id, title, category, amount, created_at").single();

    if (error) {
      toast.error("Ошибка при переводе: " + error.message);
      return;
    }

    if (data) {
      setTransactions(prev => [data, ...prev]);
    }

    toast.success(`Перевод на сумму ${sum.toLocaleString("ru-RU")} ₽ выполнен`);
    setCardNumber("");
    setRecipientName("");
    setAmount("");
    setShowForm(false);
  };

  const formatAmount = (amt: number) => {
    const prefix = amt >= 0 ? "+" : "";
    return `${prefix}${amt.toLocaleString("ru-RU", { minimumFractionDigits: 0 })} ₽`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" }) + ", " + d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  const filtered = searchQuery.trim()
    ? transactions.filter(tx => tx.title.toLowerCase().includes(searchQuery.toLowerCase()) || tx.category.toLowerCase().includes(searchQuery.toLowerCase()))
    : transactions;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <ArrowLeftRight className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Переводы</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Баланс: <span className="text-foreground font-semibold">₽ {balance.toLocaleString("ru-RU", { minimumFractionDigits: 2 })}</span>
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
            <Input
              placeholder="Поиск..."
              className="pl-9 bg-secondary border-border h-9 text-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-0">
          {filtered.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-4">Нет операций</p>
          )}
          {filtered.map((tx) => {
            const positive = tx.amount >= 0;
            return (
              <div key={tx.id} className="flex items-center justify-between py-4 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${positive ? 'bg-primary/20' : 'bg-secondary'}`}>
                    {positive ? <ArrowDownLeft className="w-4 h-4 text-primary" /> : <ArrowUpRight className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-medium">{tx.title}</p>
                    <p className="text-muted-foreground text-xs">{tx.category} · {formatDate(tx.created_at)}</p>
                  </div>
                </div>
                <p className={`text-sm font-semibold ${positive ? 'text-primary' : 'text-foreground'}`}>{formatAmount(tx.amount)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TransfersTab;
