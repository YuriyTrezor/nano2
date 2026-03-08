import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight, Search, CreditCard, ArrowRightLeft, Building2, X, Lock, FileWarning } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";


import {
  AlertDialog, AlertDialogAction, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

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
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Bank transfer fields
  const [bankBik, setBankBik] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankName, setBankName] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedAlert, setBlockedAlert] = useState(false);
  const [withdrawalBlocked, setWithdrawalBlocked] = useState(false);
  const [withdrawalAlert, setWithdrawalAlert] = useState(false);
  const [documentRequested, setDocumentRequested] = useState(false);
  const [docAlert, setDocAlert] = useState(false);

  // Own cards transfer
  const [userCards, setUserCards] = useState<string[]>([]);
  const [blockedCards, setBlockedCards] = useState<string[]>([]);
  const [fromCard, setFromCard] = useState("");
  const [toCard, setToCard] = useState("");

  // Compute balance from transactions
  const balance = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);

  // Fetch user transactions and blocked status from DB
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_blocked, withdrawal_blocked, document_requested, cards, blocked_cards")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile) {
        setIsBlocked((profile as any).is_blocked ?? false);
        setWithdrawalBlocked((profile as any).withdrawal_blocked ?? false);
        setDocumentRequested((profile as any).document_requested ?? false);
        setUserCards((profile as any).cards ?? []);
        setBlockedCards((profile as any).blocked_cards ?? []);
      }

      const { data } = await supabase
        .from("transactions")
        .select("id, title, category, amount, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (data) setTransactions(data);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowForm(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSubmit = async () => {
    if (!user) return;
    if (documentRequested) { setDocAlert(true); return; }
    if (isBlocked) { setBlockedAlert(true); return; }
    if (withdrawalBlocked) { setWithdrawalAlert(true); return; }

    const sum = parseFloat(amount.replace(/\s/g, ""));
    if (!amount.trim() || isNaN(sum) || sum <= 0) {
      toast.error("Введите корректную сумму");
      return;
    }
    if (sum > balance) {
      toast.error("Недостаточно средств на счёте");
      return;
    }

    // Own cards transfer
    if (activeTab === "own") {
      if (!fromCard || !toCard) {
        toast.error("Выберите карты для перевода");
        return;
      }
      if (fromCard === toCard) {
        toast.error("Выберите разные карты");
        return;
      }
      if (blockedCards.includes(fromCard)) {
        toast.error(`Карта ${fromCard} заблокирована`);
        return;
      }
      if (blockedCards.includes(toCard)) {
        toast.error(`Карта ${toCard} заблокирована`);
        return;
      }

      // Internal transfer — two transactions that cancel each other out
      const { error: e1 } = await supabase.from("transactions").insert({
        user_id: user.id,
        title: `Перевод ${fromCard} → ${toCard}`,
        category: "Внутренний перевод",
        amount: -sum,
        card_name: fromCard,
      });
      const { error: e2 } = await supabase.from("transactions").insert({
        user_id: user.id,
        title: `Перевод ${fromCard} → ${toCard}`,
        category: "Внутренний перевод",
        amount: sum,
        card_name: toCard,
      });

      if (e1 || e2) {
        toast.error("Ошибка при переводе");
        return;
      }

      // Refresh transactions
      const { data: refreshed } = await supabase
        .from("transactions")
        .select("id, title, category, amount, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (refreshed) setTransactions(refreshed);

      toast.success(`Перевод ${sum.toLocaleString("ru-RU")} ₽ с ${fromCard} на ${toCard} выполнен`);
      setAmount("");
      setFromCard("");
      setToCard("");
      setShowForm(false);
      return;
    }

    if (activeTab === "bank" && (!bankBik.trim() || !bankAccount.trim())) {
      toast.error("Заполните реквизиты банка");
      return;
    }
    if (activeTab !== "bank" && !cardNumber.trim()) {
      toast.error("Введите номер карты");
      return;
    }

    let title = "";
    if (activeTab === "bank") {
      title = `Перевод → ${bankName || "Другой банк"} (${bankAccount.slice(-4)})`;
    } else {
      title = `Перевод → ${cardNumber}`;
    }

    const { data, error } = await supabase.from("transactions").insert({
      user_id: user.id,
      title,
      category: activeTab === "bank" ? "Межбанковский перевод" : "Перевод",
      amount: -sum,
    }).select("id, title, category, amount, created_at").single();

    if (error) {
      toast.error("Ошибка при переводе: " + error.message);
      return;
    }

    if (data) setTransactions(prev => [data, ...prev]);

    toast.success(`Перевод на сумму ${sum.toLocaleString("ru-RU")} ₽ выполнен`);
    setCardNumber("");
    setRecipientName("");
    setAmount("");
    setBankBik("");
    setBankAccount("");
    setBankName("");
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

  const availableCards = userCards.filter(c => !blockedCards.includes(c));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <ArrowLeftRight className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Переводы</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Баланс: <span className="text-foreground font-semibold">₽ {balance.toLocaleString("ru-RU", { minimumFractionDigits: 2 })}</span>
          </p>
        </div>
        <div>
          <Button onClick={() => {
            if (documentRequested) { setDocAlert(true); return; }
            if (isBlocked) { setBlockedAlert(true); return; }
            if (withdrawalBlocked) { setWithdrawalAlert(true); return; }
            setShowForm(true);
          }} className="gap-2 w-full sm:w-auto">
            <CreditCard className="w-4 h-4" /> Новый перевод
          </Button>
        </div>
      </div>

      {/* Blocked alert */}
      <AlertDialog open={blockedAlert} onOpenChange={setBlockedAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Lock className="w-5 h-5" /> Карта заблокирована
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground">
              Ваша карта была заблокирована. Для перевыпуска карты, пожалуйста, свяжитесь с Вашим менеджером или напишите в чат (внизу справа).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogAction>OK</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Withdrawal blocked alert */}
      <AlertDialog open={withdrawalAlert} onOpenChange={setWithdrawalAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Lock className="w-5 h-5" /> Вывод недоступен
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground">
              Для вывода необходимо приобрести карту
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogAction>OK</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Document request alert */}
      <AlertDialog open={docAlert} onOpenChange={setDocAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileWarning className="w-5 h-5 text-[hsl(210,80%,60%)]" /> Запрос документов
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground">
              Просим Вас предоставить подтверждающие документы о происхождении денежных средств.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogAction>OK</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowForm(false)}>
          <div
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 relative animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-foreground text-lg font-bold">Перевод</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
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
              {activeTab === "own" ? (
                <>
                  {availableCards.length < 2 ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground text-sm">Для перевода между своими картами необходимо иметь минимум 2 активные карты.</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="text-muted-foreground text-xs mb-1 block">Карта списания</label>
                        <Select value={fromCard} onValueChange={setFromCard}>
                          <SelectTrigger className="bg-secondary border-border">
                            <SelectValue placeholder="Выберите карту" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCards.map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-muted-foreground text-xs mb-1 block">Карта зачисления</label>
                        <Select value={toCard} onValueChange={setToCard}>
                          <SelectTrigger className="bg-secondary border-border">
                            <SelectValue placeholder="Выберите карту" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCards.filter(c => c !== fromCard).map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </>
              ) : activeTab === "bank" ? (
                <>
                  <div>
                    <label className="text-muted-foreground text-xs mb-1 block">Наименование банка</label>
                    <Input placeholder="Например: Сбербанк" value={bankName} onChange={e => setBankName(e.target.value)} className="bg-secondary border-border" />
                  </div>
                  <div>
                    <label className="text-muted-foreground text-xs mb-1 block">БИК банка</label>
                    <Input placeholder="044525225" value={bankBik} onChange={e => setBankBik(e.target.value)} className="bg-secondary border-border" />
                  </div>
                  <div>
                    <label className="text-muted-foreground text-xs mb-1 block">Расчётный счёт</label>
                    <Input placeholder="40817810000000000000" value={bankAccount} onChange={e => setBankAccount(e.target.value)} className="bg-secondary border-border" />
                  </div>
                  <div>
                    <label className="text-muted-foreground text-xs mb-1 block">ФИО получателя</label>
                    <Input placeholder="Имя получателя" value={recipientName} onChange={e => setRecipientName(e.target.value)} className="bg-secondary border-border" />
                  </div>
                </>
              ) : (
                <>
                  <Input placeholder="Номер карты" value={cardNumber} onChange={e => setCardNumber(e.target.value)} className="bg-secondary border-border" />
                  <Input placeholder="Имя получателя" value={recipientName} onChange={e => setRecipientName(e.target.value)} className="bg-secondary border-border" />
                </>
              )}
              {(activeTab !== "own" || availableCards.length >= 2) && (
                <>
                  <Input placeholder="Сумма ₽" value={amount} onChange={e => setAmount(e.target.value)} className="bg-secondary border-border" type="number" />
                  <div>
                    <Button onClick={handleSubmit} className="w-full h-12 text-base font-semibold">
                      Отправить
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Transaction history */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
          <h3 className="text-foreground font-semibold">История операций</h3>
          <div className="relative w-full sm:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Поиск..." className="pl-9 bg-secondary border-border h-9 text-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>
        <div className="space-y-0">
          {loading ? (
            <p className="text-muted-foreground text-sm text-center py-4">Загрузка...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">Нет операций</p>
          ) : (
            filtered.map((tx) => {
              const positive = tx.amount >= 0;
              const isExpanded = expandedTxId === tx.id;
              return (
                <div
                  key={tx.id}
                  className="flex items-start justify-between py-4 border-b border-border last:border-0 cursor-pointer"
                  onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${positive ? 'bg-primary/20' : 'bg-secondary'}`}>
                      {positive ? <ArrowDownLeft className="w-4 h-4 text-primary" /> : <ArrowUpRight className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-foreground text-sm font-medium ${isExpanded ? 'whitespace-normal break-words' : 'truncate'}`}>{tx.title}</p>
                      <p className="text-muted-foreground text-xs">{tx.category} · {formatDate(tx.created_at)}</p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold shrink-0 ml-2 ${positive ? 'text-primary' : 'text-foreground'}`}>{formatAmount(tx.amount)}</p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TransfersTab;
