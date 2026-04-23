import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight, Search, CreditCard, Building2, Smartphone, X, Lock, FileWarning, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAllUserTransactions } from "@/lib/fetchAllUserTransactions";


import {
  AlertDialog, AlertDialogAction, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
type TransferType = "card" | "sbp" | "bank";

const tabs: { key: TransferType; label: string; icon: React.ReactNode }[] = [
  { key: "card", label: "На карту", icon: <CreditCard className="w-4 h-4" /> },
  { key: "sbp", label: "СБП (по телефону)", icon: <Smartphone className="w-4 h-4" /> },
  { key: "bank", label: "В другой банк", icon: <Building2 className="w-4 h-4" /> },
];

interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  card_name: string;
  created_at: string;
}

const TransfersTab = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<TransferType>("card");
  const [cardNumber, setCardNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
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
  const [noCardAlert, setNoCardAlert] = useState(false);
  const [limitExceeded, setLimitExceeded] = useState(false);
  const [limitAlert, setLimitAlert] = useState(false);

  const [userCards, setUserCards] = useState<string[]>([]);
  const [blockedCards, setBlockedCards] = useState<string[]>([]);

  // Total balance = sum of ALL transactions for the user
  const balance = transactions
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  // Fetch user transactions and blocked status from DB
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_blocked, withdrawal_blocked, document_requested, cards, blocked_cards, limit_exceeded")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile) {
        setIsBlocked((profile as any).is_blocked ?? false);
        setWithdrawalBlocked((profile as any).withdrawal_blocked ?? false);
        setDocumentRequested((profile as any).document_requested ?? false);
        setUserCards((profile as any).cards ?? []);
        setBlockedCards((profile as any).blocked_cards ?? []);
        setLimitExceeded((profile as any).limit_exceeded ?? false);
      }

      try {
        const data = await fetchAllUserTransactions<Transaction>(user.id);
        setTransactions(data);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowForm(true);
      const tab = searchParams.get("tab");
      if (tab === "sbp" || tab === "bank" || tab === "card") setActiveTab(tab);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const handleSubmit = async () => {
    if (!user) return;
    if (documentRequested) { setDocAlert(true); return; }
    if (isBlocked) { setBlockedAlert(true); return; }
    if (withdrawalBlocked) { setWithdrawalAlert(true); return; }
    if (availableCards.length === 0) { setNoCardAlert(true); return; }
    if (limitExceeded) { setLimitAlert(true); return; }

    const sum = parseFloat(amount.replace(/\s/g, ""));
    if (!amount.trim() || isNaN(sum) || sum <= 0) {
      toast.error("Введите корректную сумму");
      return;
    }
    if (sum > balance) {
      toast.error("Недостаточно средств на счёте");
      return;
    }

    if (activeTab === "bank" && (!bankBik.trim() || !bankAccount.trim())) {
      toast.error("Заполните реквизиты банка");
      return;
    }
    if (activeTab === "card" && !cardNumber.trim()) {
      toast.error("Введите номер карты");
      return;
    }
    if (activeTab === "sbp" && !phoneNumber.trim()) {
      toast.error("Введите номер телефона");
      return;
    }
    if (activeTab === "sbp" && !bankName.trim()) {
      toast.error("Укажите банк получателя");
      return;
    }

    let title = "";
    let category = "Перевод";
    if (activeTab === "card") {
      const last4 = cardNumber.replace(/\D/g, "").slice(-4);
      title = `Перевод на карту ••${last4}`;
      category = "Перевод на карту";
    } else if (activeTab === "sbp") {
      const parts = [
        `тел. ${phoneNumber}`,
        bankName ? `банк: ${bankName}` : null,
        recipientName ? `получатель: ${recipientName}` : null,
      ].filter(Boolean);
      title = `СБП (по телефону) — ${parts.join(", ")}`;
      category = "СБП";
    } else {
      title = `Перевод → ${bankName || "Другой банк"} (${bankAccount.slice(-4)})`;
      category = "Межбанковский перевод";
    }

    const defaultCard = availableCards.length > 0 ? availableCards[0] : "";

    const { data, error } = await supabase.from("transactions").insert({
      user_id: user.id,
      title,
      category,
      amount: -sum,
      card_name: defaultCard,
    }).select("id, title, category, amount, card_name, created_at").single();

    if (error) {
      toast.error("Ошибка при переводе: " + error.message);
      return;
    }

    if (data) setTransactions(prev => [data as Transaction, ...prev]);

    toast.success(`Перевод на сумму ${sum.toLocaleString("ru-RU")} ₽ выполнен`);
    setCardNumber("");
    setPhoneNumber("");
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

  const openTransferType = (type: TransferType) => {
    if (documentRequested) { setDocAlert(true); return; }
    if (isBlocked) { setBlockedAlert(true); return; }
    if (withdrawalBlocked) { setWithdrawalAlert(true); return; }
    if (availableCards.length === 0) { setNoCardAlert(true); return; }
    if (limitExceeded) { setLimitAlert(true); return; }
    setActiveTab(type);
    setShowForm(true);
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <ArrowLeftRight className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Переводы</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Баланс: <span className="text-foreground font-semibold">₽ {balance.toLocaleString("ru-RU", { minimumFractionDigits: 2 })}</span>
        </p>
      </div>

      {/* Tinkoff-style: large tiles to choose transfer type */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <button
          onClick={() => openTransferType("card")}
          className="flex flex-col items-start gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:bg-secondary/50 transition-all text-left active:scale-[0.98]"
        >
          <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-foreground text-sm font-semibold">На карту</p>
            <p className="text-muted-foreground text-xs">По номеру карты</p>
          </div>
        </button>
        <button
          onClick={() => openTransferType("sbp")}
          className="flex flex-col items-start gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:bg-secondary/50 transition-all text-left active:scale-[0.98]"
        >
          <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-foreground text-sm font-semibold">СБП (по телефону)</p>
            <p className="text-muted-foreground text-xs">По номеру телефона</p>
          </div>
        </button>
        <button
          onClick={() => openTransferType("bank")}
          className="flex flex-col items-start gap-3 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:bg-secondary/50 transition-all text-left active:scale-[0.98]"
        >
          <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-foreground text-sm font-semibold">В другой банк</p>
            <p className="text-muted-foreground text-xs">По реквизитам</p>
          </div>
        </button>
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

      {/* No card alert */}
      <AlertDialog open={noCardAlert} onOpenChange={setNoCardAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" /> Требуется оформление карты
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground">
              Для перевода средств необходимо оформить карту. Перейдите в раздел «Карты», чтобы выбрать и заказать подходящий тариф.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogAction asChild>
              <Link to="/dashboard/cards">Перейти к картам</Link>
            </AlertDialogAction>
          </AlertDialogFooter>
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
              {activeTab === "bank" ? (
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
              ) : activeTab === "sbp" ? (
                <>
                  <div>
                    <label className="text-muted-foreground text-xs mb-1 block">Номер телефона</label>
                    <Input placeholder="+7 (999) 123-45-67" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="bg-secondary border-border" />
                  </div>
                  <div>
                    <label className="text-muted-foreground text-xs mb-1 block">Банк получателя</label>
                    <Input placeholder="Например: Т-Банк" value={bankName} onChange={e => setBankName(e.target.value)} className="bg-secondary border-border" />
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
              <>
                <Input placeholder="Сумма ₽" value={amount} onChange={e => setAmount(e.target.value)} className="bg-secondary border-border" type="number" />
                <div>
                  <Button onClick={handleSubmit} className="w-full h-12 text-base font-semibold">
                    Отправить
                  </Button>
                </div>
              </>
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
