import { Eye, EyeOff, ArrowUpRight, ArrowDownLeft, Send, Smartphone, CreditCard, Wifi, History, Phone, Flame, WifiIcon, Tv, Zap, FileText, X, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog, AlertDialogAction, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const paymentServices = [
  { icon: Phone, label: "Мобильная связь" },
  { icon: Flame, label: "ЖКХ" },
  { icon: WifiIcon, label: "Интернет" },
  { icon: Tv, label: "Телевидение" },
  { icon: Zap, label: "Электричество" },
  { icon: FileText, label: "Налоги и штрафы" },
];

const allCards: Record<string, { name: string; number: string; holder: string; expiry: string; type: string; gradient: string }> = {
  Standard: { name: "Standard", number: "4 •••• •••• •••• 3891", holder: "", expiry: "02/30", type: "VISA", gradient: "from-secondary to-muted" },
  Gold: { name: "Gold", number: "5 •••• •••• •••• 7742", holder: "", expiry: "08/29", type: "MC", gradient: "from-[hsl(35,80%,30%)] to-[hsl(25,70%,20%)]" },
  Platinum: { name: "Platinum", number: "4 •••• •••• •••• 1205", holder: "", expiry: "11/31", type: "VISA", gradient: "from-[hsl(270,40%,25%)] to-[hsl(280,50%,15%)]" },
};

interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  created_at: string;
}

const OverviewTab = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topUpAlert, setTopUpAlert] = useState(false);
  const [payAlert, setPayAlert] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [cardType, setCardType] = useState<string | null>(null);

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Пользователь";

  // Compute balance from transactions
  const balance = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const balanceFormatted = balance.toLocaleString("ru-RU", { minimumFractionDigits: 2 });

  // Compute real % change: compare last 30 days vs previous 30 days
  const computePercentChange = () => {
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const recent = transactions.filter(tx => now - new Date(tx.created_at).getTime() < thirtyDays);
    const older = transactions.filter(tx => {
      const age = now - new Date(tx.created_at).getTime();
      return age >= thirtyDays && age < thirtyDays * 2;
    });
    const recentSum = recent.reduce((s, tx) => s + Number(tx.amount), 0);
    const olderSum = older.reduce((s, tx) => s + Number(tx.amount), 0);
    if (olderSum === 0 && recentSum === 0) return null;
    if (olderSum === 0) return recentSum > 0 ? 100 : -100;
    return ((recentSum - olderSum) / Math.abs(olderSum)) * 100;
  };
  const percentChange = computePercentChange();

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_blocked, card_type" as any)
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile) {
        setIsBlocked((profile as any).is_blocked ?? false);
        setCardType((profile as any).card_type ?? null);
      }

      const { data: txData } = await supabase
        .from("transactions")
        .select("id, title, category, amount, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (txData) setTransactions(txData);
    };
    fetchData();

    const channel = supabase
      .channel("profile-block-status")
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "profiles",
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const updated = payload.new as any;
        setIsBlocked(updated.is_blocked ?? false);
        setCardType(updated.card_type ?? null);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Load balance hidden preference
  useEffect(() => {
    if (!user) return;
    const key = `balance_hidden_${user.id}`;
    setBalanceHidden(localStorage.getItem(key) === "true");
  }, [user]);

  const toggleBalanceHidden = () => {
    if (!user) return;
    const key = `balance_hidden_${user.id}`;
    const next = !balanceHidden;
    setBalanceHidden(next);
    localStorage.setItem(key, String(next));
  };

  const currentCard = cardType && allCards[cardType] ? { ...allCards[cardType], holder: displayName } : null;

  const formatAmount = (amount: number) => {
    const prefix = amount >= 0 ? "+" : "";
    return `${prefix}${amount.toLocaleString("ru-RU", { minimumFractionDigits: 0 })} ₽`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) + ", " + d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div>
      {/* Top up alert dialog */}
      <AlertDialog open={topUpAlert} onOpenChange={setTopUpAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Пополнение счёта
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground">
              Пополнение возможно только с карты МИР. Свяжитесь с Вашим менеджером.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogAction>OK</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Pay services modal — MIR gateway message */}
      {payAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setPayAlert(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-foreground text-lg font-bold">Оплата услуг</h2>
              <button onClick={() => setPayAlert(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {paymentServices.map((svc, i) => (
                <button key={i} onClick={() => { setPayAlert(false); toast.info("Настройте, пожалуйста, платёжный шлюз МИР для оплаты"); }} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <svc.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-foreground text-xs">{svc.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Block warning */}
      {isBlocked && (
        <div className="mb-4 p-4 rounded-2xl border border-destructive bg-destructive/10 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-destructive text-sm">
            Ваша карта была заблокирована. Для перевыпуска карты, пожалуйста, свяжитесь с Вашим менеджером или напишите в чат (внизу справа).
          </p>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">{t("Добро пожаловать")}, {displayName} 👋</h1>
        <p className="text-muted-foreground text-sm">{t("Вот обзор ваших финансов")}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column */}
        <div className="flex-1 space-y-6">
          {/* Balance card */}
          <div className={`rounded-2xl p-5 md:p-6 relative ${isBlocked ? "bg-destructive/20 border border-destructive" : "bg-gradient-to-r from-primary/80 to-primary"}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className={`text-sm font-medium ${isBlocked ? "text-destructive" : "text-primary-foreground/80"}`}>{t("Общий баланс")}</p>
                <p className={`text-3xl md:text-4xl font-bold mt-1 ${isBlocked ? "text-destructive" : "text-primary-foreground"}`}>
                  {balanceHidden ? "••••••" : `₽ ${balanceFormatted}`}
                </p>
                {!isBlocked && !balanceHidden && percentChange !== null && (
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${percentChange >= 0 ? "bg-primary-foreground/20 text-primary-foreground" : "bg-destructive/20 text-destructive"}`}>
                      {percentChange >= 0 ? "↗" : "↘"} {percentChange >= 0 ? "+" : ""}{percentChange.toFixed(1)}%
                    </span>
                    <span className="text-primary-foreground/70 text-xs">{t("за последний месяц")}</span>
                  </div>
                )}
              </div>
              <button onClick={toggleBalanceHidden} className={`${isBlocked ? "text-destructive/60" : "text-primary-foreground/60"} hover:opacity-80 transition-opacity`}>
                {balanceHidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Card on mobile */}
          {currentCard && (
            <div className="lg:hidden">
              <div className="bg-card border border-border rounded-2xl p-4">
                <p className="text-muted-foreground text-xs font-medium tracking-wider mb-3">{t("ДЕБЕТОВАЯ КАРТА")} — {currentCard.name}</p>
                <div className={`bg-gradient-to-br ${currentCard.gradient} rounded-xl p-4 relative select-none`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-8 h-5 bg-yellow-500 rounded" />
                    <Wifi className="w-4 h-4 text-white/40 rotate-90" />
                  </div>
                  <p className="text-white font-mono text-lg tracking-widest mb-4">{currentCard.number}</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-white/50 text-[10px]">{t("ВЛАДЕЛЕЦ")}</p>
                      <p className="text-white text-xs font-medium">{currentCard.holder}</p>
                    </div>
                    <div>
                      <p className="text-white/50 text-[10px]">{t("СРОК")}</p>
                      <p className="text-white text-xs font-medium">{currentCard.expiry}</p>
                    </div>
                    <p className="text-white font-bold text-lg italic">{currentCard.type}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {!currentCard && (
            <div className="lg:hidden">
              <div className="bg-card border border-border rounded-2xl p-4 text-center">
                <CreditCard className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Карта не назначена</p>
              </div>
            </div>
          )}

          {/* Quick actions - mobile */}
          <div className="lg:hidden">
            <div className="bg-card border border-border rounded-2xl p-4">
              <h3 className="text-foreground font-semibold mb-3 text-sm">{t("Быстрые действия")}</h3>
              <div className="grid grid-cols-4 gap-2">
                <button onClick={() => navigate("/dashboard/transfers?new=1")} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Send className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground text-[11px]">{t("Перевод")}</span>
                </button>
                <button onClick={() => setTopUpAlert(true)} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground text-[11px]">{t("Пополнить")}</span>
                </button>
                <button onClick={() => setPayAlert(true)} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground text-[11px]">{t("Оплатить")}</span>
                </button>
                <button onClick={() => navigate("/dashboard/transfers")} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <History className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground text-[11px]">{t("История")}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-card border border-border rounded-2xl p-4 md:p-5">
            <h3 className="text-foreground font-semibold mb-4">{t("Последние операции")}</h3>
            <div className="space-y-0">
              {transactions.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-4">Нет операций</p>
              )}
              {transactions.slice(0, 20).map((tx) => {
                const positive = tx.amount >= 0;
                return (
                  <div key={tx.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${positive ? 'bg-primary/20' : 'bg-secondary'}`}>
                        {positive ? (
                          <ArrowDownLeft className="w-4 h-4 text-primary" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-foreground text-sm font-medium truncate">{tx.title}</p>
                        <p className="text-muted-foreground text-xs">{tx.category}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <p className={`text-sm font-medium ${positive ? 'text-primary' : 'text-foreground'}`}>{formatAmount(tx.amount)}</p>
                      <p className="text-muted-foreground text-xs">{formatDate(tx.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column - desktop */}
        <div className="hidden lg:block w-80 space-y-6">
          {/* Card preview */}
          {currentCard ? (
            <div className="bg-card border border-border rounded-2xl p-5">
              <p className="text-muted-foreground text-xs font-medium tracking-wider mb-3">{t("ДЕБЕТОВАЯ КАРТА")} — {currentCard.name}</p>
              <div className={`bg-gradient-to-br ${currentCard.gradient} rounded-xl p-4 relative`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-8 h-5 bg-yellow-500 rounded" />
                  <Wifi className="w-4 h-4 text-white/40 rotate-90" />
                </div>
                <p className="text-white font-mono text-lg tracking-widest mb-4">{currentCard.number}</p>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-white/50 text-[10px]">{t("ВЛАДЕЛЕЦ")}</p>
                    <p className="text-white text-xs font-medium">{currentCard.holder}</p>
                  </div>
                  <div>
                    <p className="text-white/50 text-[10px]">{t("СРОК")}</p>
                    <p className="text-white text-xs font-medium">{currentCard.expiry}</p>
                  </div>
                  <p className="text-white font-bold text-lg italic">{currentCard.type}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-5 text-center">
              <CreditCard className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Карта не назначена</p>
            </div>
          )}

          {/* Quick actions */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-foreground font-semibold mb-4">{t("Быстрые действия")}</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => navigate("/dashboard/transfers?new=1")} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Send className="w-4 h-4 text-primary" />
                </div>
                <span className="text-foreground text-xs">{t("Перевод")}</span>
              </button>
              <button onClick={() => setTopUpAlert(true)} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-primary" />
                </div>
                <span className="text-foreground text-xs">{t("Пополнить")}</span>
              </button>
              <button onClick={() => setPayAlert(true)} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-primary" />
                </div>
                <span className="text-foreground text-xs">{t("Оплатить")}</span>
              </button>
              <button onClick={() => navigate("/dashboard/transfers")} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <History className="w-4 h-4 text-primary" />
                </div>
                <span className="text-foreground text-xs">{t("История")}</span>
              </button>
            </div>
          </div>

          {/* Accounts */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-foreground font-semibold mb-4">{t("Мои счета")}</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${isBlocked ? "bg-destructive text-destructive-foreground" : "bg-destructive text-destructive-foreground"}`}>RUB</div>
                <div>
                  <p className="text-foreground text-sm font-medium">{t("Основной счёт")}</p>
                  <p className="text-muted-foreground text-xs">RUB</p>
                </div>
              </div>
              <p className={`text-sm font-medium ${isBlocked ? "text-destructive" : "text-foreground"}`}>
                {balanceHidden ? "••••••" : `₽ ${balanceFormatted}`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
