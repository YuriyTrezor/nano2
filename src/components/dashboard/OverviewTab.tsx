import { Eye, EyeOff, ArrowUpRight, ArrowDownLeft, Send, Smartphone, CreditCard, Wifi, History, Phone, Flame, WifiIcon, Tv, Zap, FileText, X, AlertTriangle, ChevronLeft, ChevronRight, EyeOff as EyeOffIcon, Lock, FileWarning, Receipt, Wallet, Building2 } from "lucide-react";
import DiamondIcon3D from "@/components/DiamondIcon3D";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useCallback } from "react";

import CurrencyRatesCompact from "@/components/dashboard/CurrencyRatesCompact";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog, AlertDialogAction, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { fetchAllUserTransactions } from "@/lib/fetchAllUserTransactions";
import useEmblaCarousel from "embla-carousel-react";
import { getTxCurrency, formatTxAmount } from "@/lib/txCurrency";
import ConvertUsdModal from "@/components/dashboard/ConvertUsdModal";

const transliterate = (text: string): string => {
  const map: Record<string, string> = {
    А:'A',Б:'B',В:'V',Г:'G',Д:'D',Е:'E',Ё:'E',Ж:'Zh',З:'Z',И:'I',Й:'Y',К:'K',Л:'L',М:'M',Н:'N',О:'O',П:'P',Р:'R',С:'S',Т:'T',У:'U',Ф:'F',Х:'Kh',Ц:'Ts',Ч:'Ch',Ш:'Sh',Щ:'Shch',Ъ:'',Ы:'Y',Ь:'',Э:'E',Ю:'Yu',Я:'Ya',
    а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
  };
  return text.split('').map(c => map[c] ?? c).join('').toUpperCase();
};


const allCards: Record<string, { name: string; number: string; fullNumber: string; holder: string; expiry: string; type: string; gradient: string; cvv: string }> = {
  White: { name: "White", number: "4 •••• •••• •••• 3891", fullNumber: "4118 2735 6491 3891", holder: "", expiry: "02/30", type: "VISA", gradient: "from-[hsl(0,0%,85%)] to-[hsl(0,0%,70%)]", cvv: "482" },
  Silver: { name: "Silver", number: "4 •••• •••• •••• 1205", fullNumber: "4729 6183 0542 1205", holder: "", expiry: "11/31", type: "VISA", gradient: "from-[hsl(220,10%,55%)] to-[hsl(220,15%,35%)]", cvv: "365" },
  Gold: { name: "Gold", number: "4 •••• •••• •••• 3702", fullNumber: "4118 2735 6492 3702", holder: "", expiry: "08/29", type: "VISA", gradient: "from-[hsl(35,80%,30%)] to-[hsl(25,70%,20%)]", cvv: "719" },
  Diamond: { name: "Diamond", number: "4 •••• •••• •••• 5580", fullNumber: "4391 7024 8165 5580", holder: "", expiry: "06/32", type: "VISA", gradient: "from-[hsl(195,80%,30%)] to-[hsl(210,70%,20%)]", cvv: "941" },
};

interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  card_name: string;
  created_at: string;
}

const OverviewTab = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topUpAlert, setTopUpAlert] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [payAlert, setPayAlert] = useState(false);
  const [docAlert, setDocAlert] = useState(false);
  const [depositModal, setDepositModal] = useState(false);
  const [cardDepositOpen, setCardDepositOpen] = useState(false);
  const [cardDepositNumber, setCardDepositNumber] = useState("");
  const [cardDepositAmount, setCardDepositAmount] = useState("");
  const [cardDepositHolder, setCardDepositHolder] = useState("");
  const [cardDepositExpiry, setCardDepositExpiry] = useState("");
  const [cardDepositCvv, setCardDepositCvv] = useState("");
  
  const [isBlocked, setIsBlocked] = useState(false);
  const [withdrawalBlocked, setWithdrawalBlocked] = useState(false);
  const [documentRequested, setDocumentRequested] = useState(false);
  const [limitExceeded, setLimitExceeded] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [userCards, setUserCards] = useState<string[]>([]);
  const [cvvVisible, setCvvVisible] = useState<Record<string, boolean>>({});
  const [numberVisible, setNumberVisible] = useState<Record<string, boolean>>({});
  const [blockedCards, setBlockedCards] = useState<string[]>([]);
  const [mirAlert, setMirAlert] = useState(false);
  const [displayCurrency, setDisplayCurrency] = useState<"RUB" | "USD" | "EUR">("RUB");
  const [fxRates, setFxRates] = useState<Record<string, number>>({ USD: 90, EUR: 98 });

  // Fetch FX rates for currency switcher
  useEffect(() => {
    supabase.from("currency_rates").select("code, value, nominal").then(({ data }) => {
      if (!data) return;
      const map: Record<string, number> = {};
      data.forEach((r: any) => {
        const v = Number(r.value) / Number(r.nominal || 1);
        if (v > 0) map[r.code] = v;
      });
      if (Object.keys(map).length) setFxRates(prev => ({ ...prev, ...map }));
    });
  }, []);

  const toggleCvv = (cardName: string) => {
    setCvvVisible(prev => ({ ...prev, [cardName]: !prev[cardName] }));
  };

  const toggleNumber = (cardName: string) => {
    const isVisible = numberVisible[cardName];
    if (isVisible) {
      const card = allCards[cardName];
      if (card) {
        navigator.clipboard.writeText(card.fullNumber.replace(/\s/g, ""));
        toast.success("Скопировано");
      }
    }
    setNumberVisible(prev => ({ ...prev, [cardName]: !prev[cardName] }));
  };

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Пользователь";

  // Рублёвый баланс = сумма всех транзакций КРОМЕ USD
  const rubTransactions = transactions.filter(tx => getTxCurrency(tx) === "RUB");
  const usdTransactions = transactions.filter(tx => getTxCurrency(tx) === "USD");
  const balance = rubTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const usdBalance = usdTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
  // Если рублёвых операций нет, а USD есть — счёт считается долларовым
  const isUsdAccount = rubTransactions.length === 0 && usdTransactions.length > 0;
  // Авто-переключение валюты на USD, когда счёт долларовый
  useEffect(() => {
    if (isUsdAccount && displayCurrency === "RUB") {
      setDisplayCurrency("USD");
    }
  }, [isUsdAccount]);
  const convertBalance = (currency: "RUB" | "USD" | "EUR") => {
    if (isUsdAccount) {
      if (currency === "USD") return usdBalance;
      if (currency === "RUB") return usdBalance * (fxRates.USD || 0);
      return usdBalance * (fxRates.USD || 0) / (fxRates[currency] || 1);
    }
    if (currency === "RUB") return balance;
    return balance / (fxRates[currency] || 1);
  };
  const getCurrencySymbol = (currency: "RUB" | "USD" | "EUR") => {
    if (currency === "RUB") return "₽";
    if (currency === "USD") return "$";
    return "€";
  };
  const formatCurrencyAmount = (currency: "RUB" | "USD" | "EUR") => {
    const amount = convertBalance(currency);
    return `${getCurrencySymbol(currency)} ${amount.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const currencySymbol = getCurrencySymbol(displayCurrency);
  const convertedBalance = convertBalance(displayCurrency);
  const convertedBalanceFormatted = convertedBalance.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // If user has only one card, that card holds the FULL balance.
  // Otherwise, sum transactions matching the card name.
  const cardBalance = (cardName: string) => {
    if (userCards.length === 1) return isUsdAccount ? usdBalance : balance;
    return rubTransactions
      .filter(tx => tx.card_name === cardName)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
  };

  const computePercentChange = () => {
    const cardTxs = transactions;
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    const recent = cardTxs.filter(tx => now - new Date(tx.created_at).getTime() < thirtyDays);
    const older = cardTxs.filter(tx => {
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
        .select("is_blocked, cards, withdrawal_blocked, blocked_cards, document_requested, limit_exceeded")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile) {
        setIsBlocked((profile as any).is_blocked ?? false);
        setWithdrawalBlocked((profile as any).withdrawal_blocked ?? false);
        setUserCards((profile as any).cards ?? []);
        setBlockedCards((profile as any).blocked_cards ?? []);
        setDocumentRequested((profile as any).document_requested ?? false);
        setLimitExceeded((profile as any).limit_exceeded ?? false);
      }

      try {
        const txData = await fetchAllUserTransactions<Transaction>(user.id);
        setTransactions(txData);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
      }
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
        setWithdrawalBlocked(updated.withdrawal_blocked ?? false);
        setUserCards(updated.cards ?? []);
        setBlockedCards(updated.blocked_cards ?? []);
        setDocumentRequested(updated.document_requested ?? false);
        setLimitExceeded(updated.limit_exceeded ?? false);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

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

  const lastName = user?.user_metadata?.last_name || "";
  const fullName = lastName ? `${displayName} ${lastName}` : displayName;
  const holderName = transliterate(fullName);
  const activeCards = userCards
    .filter(name => allCards[name])
    .map(name => ({ ...allCards[name], holder: holderName }));

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const formatAmount = (amount: number) => {
    const prefix = amount >= 0 ? "+" : "";
    return `${prefix}${amount.toLocaleString("ru-RU", { minimumFractionDigits: 0 })} ₽`;
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" }) + ", " + d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  // Card type label for the card section
  const cardTypeLabel = activeCards.length > 0 ? activeCards[selectedIndex]?.name || "" : "";
  const cardTypeColor = cardTypeLabel === "Gold" ? "text-[hsl(35,80%,50%)]" : cardTypeLabel === "Silver" ? "text-[hsl(220,10%,60%)]" : cardTypeLabel === "Diamond" ? "text-[hsl(195,80%,60%)]" : "text-muted-foreground";

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

      {/* Document request alert */}
      <AlertDialog open={docAlert} onOpenChange={setDocAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileWarning className="w-5 h-5 text-[hsl(210,80%,60%)]" />
              Запрос документов
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground">
              Просим Вас предоставить подтверждающие документы о происхождении денежных средств.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogAction>OK</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* USD → RUB conversion modal */}
      <ConvertUsdModal
        open={convertOpen}
        onClose={() => setConvertOpen(false)}
        usdBalance={usdBalance}
        cardName={userCards[0] || ""}
      />

      {/* Transfer — direct navigate, no modal */}

      {/* Deposit modal */}
      {depositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setDepositModal(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-foreground text-lg font-bold">Пополнение счёта</h2>
              <button onClick={() => setDepositModal(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => { setDepositModal(false); setCardDepositOpen(true); }}
                className="flex items-center gap-3 w-full p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-medium text-foreground">Пополнение с карты</p>
                  <p className="text-xs text-muted-foreground">Перевод с банковской карты</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
              <button
                onClick={() => { setDepositModal(false); navigate("/dashboard/swift-deposit"); }}
                className="flex items-center gap-3 w-full p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-medium text-foreground">Пополнение через IBAN / SWIFT</p>
                  <p className="text-xs text-muted-foreground">Международный банковский перевод</p>
                  <p className="text-xs text-orange-400 mt-1">⚠ Обязательно свяжитесь с менеджером перед оплатой</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card deposit form modal */}
      {cardDepositOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setCardDepositOpen(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-foreground text-lg font-bold">Пополнение с карты</h2>
              <button onClick={() => setCardDepositOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Номер карты</label>
                <Input
                  value={cardDepositNumber}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 16);
                    setCardDepositNumber(v.replace(/(.{4})/g, "$1 ").trim());
                  }}
                  placeholder="0000 0000 0000 0000"
                  className="bg-secondary border-border font-mono"
                  maxLength={19}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Имя и фамилия (как на карте)</label>
                <Input
                  value={cardDepositHolder}
                  onChange={e => setCardDepositHolder(e.target.value.toUpperCase())}
                  placeholder="IVAN IVANOV"
                  className="bg-secondary border-border uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Срок действия</label>
                  <Input
                    value={cardDepositExpiry}
                    onChange={e => {
                      let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                      if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
                      setCardDepositExpiry(v);
                    }}
                    placeholder="MM/YY"
                    className="bg-secondary border-border font-mono"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">CVV</label>
                  <Input
                    value={cardDepositCvv}
                    onChange={e => setCardDepositCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                    placeholder="•••"
                    type="password"
                    className="bg-secondary border-border font-mono"
                    maxLength={3}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Сумма пополнения, ₽</label>
                <Input
                  value={cardDepositAmount}
                  onChange={e => setCardDepositAmount(e.target.value)}
                  placeholder="0"
                  type="number"
                  className="bg-secondary border-border"
                />
              </div>
              
              <button
                onClick={() => {
                  if (!cardDepositNumber.trim() || !cardDepositHolder.trim() || !cardDepositExpiry.trim() || !cardDepositCvv.trim() || !cardDepositAmount.trim()) {
                    toast.error("Заполните все поля");
                    return;
                  }
                  setCardDepositOpen(false);
                  setMirAlert(true);
                }}
                className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-medium text-sm hover:bg-primary/90 transition-colors"
              >
                Пополнить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MIR-only alert (after card deposit form submit) */}
      <AlertDialog open={mirAlert} onOpenChange={setMirAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Пополнение возможно только с карты МИР
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground">
              Указанная карта не принадлежит платёжной системе МИР. Пополнение счёта возможно только с банковских карт МИР.
              Свяжитесь с Вашим менеджером для настройки альтернативного способа пополнения.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => {
              setCardDepositNumber(""); setCardDepositHolder(""); setCardDepositExpiry(""); setCardDepositCvv(""); setCardDepositAmount("");
            }}>Понятно</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block warning */}
      {isBlocked && (
        <div className="mb-4 p-4 rounded-2xl border border-destructive bg-destructive/10 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-destructive text-sm">
            Ваша карта была заблокирована. Для перевыпуска карты, пожалуйста, свяжитесь с Вашим менеджером или напишите в чат (внизу справа).
          </p>
        </div>
      )}

      {/* Document requested banner */}
      {documentRequested && !isBlocked && (
        <div className="mb-4 p-4 rounded-2xl border border-[hsl(210,80%,50%)]/30 bg-[hsl(210,80%,50%)]/10 flex items-start gap-3">
          <FileWarning className="w-5 h-5 text-[hsl(210,80%,60%)] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-foreground text-sm font-semibold mb-1">Требуется подтверждение происхождения средств</p>
            <p className="text-muted-foreground text-xs mb-3">
              В соответствии с требованиями законодательства нам необходимо получить подтверждающие документы. 
              Не переживайте — это стандартная процедура, и мы готовы помочь вам её пройти.
            </p>
            <button
              onClick={() => navigate("/dashboard/compliance")}
              className="inline-flex items-center gap-1.5 text-[hsl(210,80%,60%)] hover:text-[hsl(210,80%,70%)] text-sm font-medium transition-colors"
            >
              Узнать подробнее и решить вопрос
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">{t("Добро пожаловать")}, {displayName} 👋</h1>
        <p className="text-muted-foreground text-sm">{t("Вот обзор ваших финансов")}</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left column */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Balance card */}
          {(() => {
            const noCards = !isBlocked && activeCards.length === 0;
            const limitState = !isBlocked && !noCards && limitExceeded;
            return (
          <div className={`rounded-2xl p-5 md:p-6 relative ${
            isBlocked 
              ? "bg-destructive/20 border border-destructive" 
              : noCards
                ? "overflow-hidden border border-[hsl(42,75%,55%)]/40 shadow-[0_10px_30px_-10px_hsl(40,80%,40%/0.45),inset_0_1px_0_hsl(48,90%,90%/0.55),inset_0_-12px_24px_-12px_hsl(35,70%,30%/0.35)] bg-[radial-gradient(ellipse_at_top_left,hsl(50,95%,78%)_0%,hsl(45,90%,68%)_38%,hsl(40,85%,58%)_75%,hsl(35,80%,50%)_100%)]"
                : limitState
                  ? "overflow-hidden border border-[hsl(42,75%,55%)]/40 shadow-[0_10px_30px_-10px_hsl(40,80%,40%/0.45),inset_0_1px_0_hsl(48,90%,90%/0.55),inset_0_-12px_24px_-12px_hsl(35,70%,30%/0.35)] bg-[radial-gradient(ellipse_at_top_left,hsl(50,95%,78%)_0%,hsl(45,90%,68%)_38%,hsl(40,85%,58%)_75%,hsl(35,80%,50%)_100%)]"
                : documentRequested
                  ? "bg-gradient-to-r from-[hsl(210,80%,50%)] to-[hsl(220,85%,45%)]"
                  : withdrawalBlocked 
                    ? "bg-gradient-to-r from-[hsl(35,90%,45%)] to-[hsl(25,85%,50%)]" 
                    : "bg-gradient-to-r from-primary/80 to-primary"
          }`}>
            {(noCards || limitState) && (
              <>
                {/* Glossy highlight */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[linear-gradient(180deg,hsl(0,0%,100%/0.35)_0%,hsl(0,0%,100%/0.05)_45%,transparent_55%)]" />
                {/* Soft glow blob */}
                <div className="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full bg-[radial-gradient(circle,hsl(50,100%,85%/0.55)_0%,transparent_70%)] blur-2xl" />
                {/* Bottom shadow rim for depth */}
                <div className="pointer-events-none absolute inset-x-4 bottom-0 h-3 rounded-b-2xl bg-[radial-gradient(ellipse_at_center,hsl(30,60%,20%/0.35)_0%,transparent_70%)] blur-md" />
              </>
            )}
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm font-medium ${isBlocked ? "text-destructive" : (noCards || limitState) ? "text-[hsl(30,60%,20%)]/80" : "text-primary-foreground/80"}`}>{t("Общий баланс")}</p>
                  {isUsdAccount && (
                    <span
                      className="relative inline-flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider text-white overflow-hidden"
                      style={{
                        background: "linear-gradient(135deg, hsl(150,75%,28%) 0%, hsl(155,80%,42%) 45%, hsl(150,70%,32%) 100%)",
                        boxShadow:
                          "0 6px 14px -4px hsl(150,80%,20%/0.6), 0 2px 4px hsl(150,80%,15%/0.4), inset 0 1px 0 hsl(150,90%,75%/0.6), inset 0 -1px 0 hsl(150,80%,15%/0.5)",
                        textShadow: "0 1px 1px hsl(150,80%,12%/0.6)",
                      }}
                    >
                      <span
                        className="relative w-5 h-5 rounded-full flex items-center justify-center text-[12px] font-black"
                        style={{
                          background: "radial-gradient(circle at 30% 25%, hsl(50,100%,80%) 0%, hsl(45,95%,55%) 45%, hsl(35,85%,38%) 100%)",
                          color: "hsl(150,80%,18%)",
                          boxShadow:
                            "inset 0 1px 1px hsl(50,100%,90%/0.9), inset 0 -1px 1px hsl(30,80%,25%/0.6), 0 1px 2px hsl(0,0%,0%/0.4)",
                          textShadow: "0 1px 0 hsl(50,100%,90%/0.5)",
                        }}
                      >
                        $
                      </span>
                      <span className="relative">Долларовый счёт</span>
                      <span
                        className="pointer-events-none absolute inset-0 rounded-full"
                        style={{
                          background:
                            "linear-gradient(180deg, hsl(0,0%,100%/0.35) 0%, hsl(0,0%,100%/0.05) 45%, transparent 55%)",
                        }}
                      />
                    </span>
                  )}
                </div>
                <p className={`text-2xl sm:text-3xl md:text-4xl font-bold mt-1 break-words ${isBlocked ? "text-destructive" : (noCards || limitState) ? "text-[hsl(28,70%,18%)] drop-shadow-[0_1px_0_hsl(50,100%,90%/0.6)]" : "text-primary-foreground"}`}>
                  {balanceHidden ? "••••••" : `${currencySymbol} ${convertedBalanceFormatted}`}
                </p>
                {!balanceHidden && usdBalance !== 0 && !isUsdAccount && (
                  <p className={`text-sm sm:text-base font-semibold mt-1 ${isBlocked ? "text-destructive" : (noCards || limitState) ? "text-[hsl(28,70%,18%)]/80" : "text-primary-foreground/90"}`}>
                    $ {usdBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
                {/* Currency switcher */}
                {!isBlocked && (
                  <div className="flex gap-1 mt-3">
                    {(["RUB", "USD", "EUR"] as const).map(c => (
                      <button
                        key={c}
                        onClick={() => setDisplayCurrency(c)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                          displayCurrency === c
                            ? "bg-primary-foreground text-primary"
                            : "bg-primary-foreground/15 text-primary-foreground/80 hover:bg-primary-foreground/25"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
                {!isBlocked && displayCurrency !== "RUB" && !balanceHidden && (
                  <p className="text-primary-foreground/70 text-xs mt-2">
                    1 {displayCurrency} ≈ {(fxRates[displayCurrency] || 0).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽
                  </p>
                )}
                {isUsdAccount && !isBlocked && usdBalance > 0 && (
                  <button
                    onClick={() => setConvertOpen(true)}
                    className="mt-3 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary-foreground text-primary px-4 py-2 rounded-xl font-semibold text-sm hover:opacity-90 transition"
                  >
                    Конвертировать USD → RUB
                  </button>
                )}
                {!isBlocked && !balanceHidden && !withdrawalBlocked && !documentRequested && percentChange !== null && (
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${percentChange >= 0 ? "bg-primary-foreground/20 text-primary-foreground" : "bg-destructive/20 text-destructive"}`}>
                      {percentChange >= 0 ? "↗" : "↘"} {percentChange >= 0 ? "+" : ""}{percentChange.toFixed(1)}%
                    </span>
                    <span className="text-primary-foreground/70 text-xs">{t("за последний месяц")}</span>
                  </div>
                )}
                {documentRequested && !isBlocked && (
                  <div className="flex items-center gap-2 mt-3">
                    <FileWarning className="w-4 h-4 text-primary-foreground/80" />
                    <span className="text-primary-foreground/90 text-xs">Просим Вас предоставить подтверждающие документы о происхождении денежных средств.</span>
                  </div>
                )}
                {withdrawalBlocked && !isBlocked && !documentRequested && (
                  <div className="flex items-center gap-2 mt-3">
                    <AlertTriangle className="w-4 h-4 text-primary-foreground/80" />
                    <span className="text-primary-foreground/90 text-xs">Для вывода необходимо приобрести карту. Свяжитесь с Вашим менеджером или напишите в чат (внизу справа).</span>
                  </div>
                )}
                {noCards && (
                  <div className="mt-4 p-3 rounded-xl bg-[hsl(30,40%,15%)]/15 border border-[hsl(30,40%,15%)]/15 backdrop-blur-sm shadow-[inset_0_1px_0_hsl(0,0%,100%/0.3)]">
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard className="w-4 h-4 text-[hsl(28,70%,18%)]" />
                      <span className="text-[hsl(28,70%,18%)] text-sm font-semibold">Требуется оформление карты</span>
                    </div>
                    <p className="text-[hsl(28,70%,22%)] text-xs mb-3">
                      Для перевода средств необходимо оформить карту. Перейдите в раздел «Карты», чтобы выбрать и заказать подходящий тариф.
                    </p>
                    <button
                      onClick={() => navigate("/dashboard/cards")}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[hsl(28,70%,18%)] text-[hsl(48,90%,90%)] text-xs font-semibold hover:opacity-90 transition-opacity shadow-md"
                    >
                      Перейти к картам
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {limitState && (
                  <div className="mt-4 p-3 rounded-xl bg-[hsl(30,40%,15%)]/15 border border-[hsl(30,40%,15%)]/15 backdrop-blur-sm shadow-[inset_0_1px_0_hsl(0,0%,100%/0.3)]">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-[hsl(28,70%,18%)]" />
                      <span className="text-[hsl(28,70%,18%)] text-sm font-semibold">Превышен лимит</span>
                    </div>
                    <p className="text-[hsl(28,70%,22%)] text-xs mb-3">
                      Превышен лимит по операциям. Для увеличения лимита свяжитесь с Вашим менеджером или напишите в чат поддержки (внизу справа).
                    </p>
                  </div>
                )}
              </div>
              <button onClick={toggleBalanceHidden} className={`${isBlocked ? "text-destructive/60" : (noCards || limitState) ? "text-[hsl(28,70%,18%)]/70" : "text-primary-foreground/60"} hover:opacity-80 transition-opacity shrink-0 relative z-10`}>
                {balanceHidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
            );
          })()}

          {/* Card on mobile */}
          {activeCards.length > 0 ? (
            <div className="xl:hidden">
              <div className="bg-card border border-border rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-muted-foreground text-xs font-medium tracking-wider">{t("ДЕБЕТОВАЯ КАРТА")}</p>
                  <span className={`text-xs font-semibold ${cardTypeColor}`}>{cardTypeLabel}</span>
                </div>
                <div className="relative">
                  <div ref={emblaRef} className="overflow-hidden rounded-xl">
                    <div className="flex">
                      {activeCards.map((card, i) => {
                        const isCardBlocked = isBlocked || blockedCards.includes(card.name);
                        return (
                        <div key={i} className="min-w-0 shrink-0 grow-0 basis-full card-perspective">
                          <div className={`card-flipper ${cvvVisible[card.name] ? 'flipped' : ''}`} style={{ minHeight: '180px' }}>
                            {/* Front */}
                            <div className={`card-front bg-gradient-to-br ${card.gradient} rounded-xl p-4 relative select-none card-holographic ${isCardBlocked ? "opacity-70" : ""}`}>
                            {isCardBlocked && (
                              <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-destructive/90 text-destructive-foreground px-2 py-0.5 rounded-full">
                                <Lock className="w-3 h-3" />
                                <span className="text-[10px] font-medium">Заблокирована</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none rounded-xl" />
                            <div className="flex justify-between items-start mb-4 relative z-10">
                              <div className="card-chip">
                                <div className="card-chip-lines" />
                              </div>
                              {card.name === "Diamond" ? <DiamondIcon3D className="w-8 h-8" /> : <Wifi className="w-4 h-4 text-white/40 rotate-90" />}
                            </div>
                          <p className="text-white/60 font-mono text-[10px] mb-1 relative z-10 card-text-embossed">BALANCE</p>
                          <p className="text-white font-bold text-lg mb-2 relative z-10">{balanceHidden ? "••••••" : isUsdAccount ? `$ ${cardBalance(card.name).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : `₽ ${cardBalance(card.name).toLocaleString("ru-RU", { minimumFractionDigits: 2 })}`}</p>
                            <button onClick={(e) => { e.stopPropagation(); toggleNumber(card.name); }} className="text-left relative z-10">
                              <p className="text-white font-mono text-base card-number-embossed mb-3">{numberVisible[card.name] ? card.fullNumber : card.number}</p>
                            </button>
                            <div className="flex justify-between items-end relative z-10">
                              <div>
                                <p className="text-white/50 text-[10px] card-text-embossed">CARDHOLDER</p>
                                <p className="text-white text-xs font-medium card-text-embossed">{card.holder}</p>
                              </div>
                              <div>
                                <p className="text-white/50 text-[10px] card-text-embossed">EXPIRES</p>
                                <p className="text-white text-xs font-medium card-text-embossed">{card.expiry}</p>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); toggleCvv(card.name); }} className="text-left">
                                <p className="text-white/50 text-[10px]">CVV</p>
                                <p className="text-white text-xs font-medium">•••</p>
                              </button>
                            {card.type === "VISA" ? (
                              <p className="text-white font-bold text-lg italic card-text-embossed">VISA</p>
                            ) : (
                              <span className="flex items-center">
                                <span className="w-5 h-5 rounded-full bg-red-500 -mr-2 opacity-80" />
                                <span className="w-5 h-5 rounded-full bg-orange-400 opacity-80" />
                              </span>
                            )}
                            </div>
                          </div>
                          {/* Back */}
                          <div className={`card-back bg-gradient-to-br ${card.gradient} rounded-xl relative overflow-hidden`}>
                            <div className="w-full h-10 bg-black/70 mt-5" />
                            <div className="px-4 mt-4">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-8 bg-white/10 rounded flex items-center justify-end px-3">
                                  <span className="text-white font-mono text-sm font-bold italic card-text-embossed">{card.cvv}</span>
                                </div>
                                <p className="text-white/50 text-[9px] font-mono">CVV2</p>
                              </div>
                              <div className="mt-3 flex justify-between items-end">
                                <p className="text-white/20 text-[8px]">NeoBank International AG</p>
                                <button onClick={(e) => { e.stopPropagation(); toggleCvv(card.name); }} className="text-white/60 text-xs hover:text-white transition-colors">
                                  ↻ Перевернуть
                                </button>
                              </div>
                            </div>
                          </div>
                          </div>
                        </div>
                      ); })}
                    </div>
                  </div>
                  {activeCards.length > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-3">
                      <button onClick={scrollPrev} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
                        <ChevronLeft className="w-4 h-4 text-foreground" />
                      </button>
                      <div className="flex gap-1.5">
                        {activeCards.map((_, i) => (
                          <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === selectedIndex ? "bg-primary" : "bg-muted-foreground/30"}`} />
                        ))}
                      </div>
                      <button onClick={scrollNext} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
                        <ChevronRight className="w-4 h-4 text-foreground" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="xl:hidden">
              <div className="bg-card border border-border rounded-2xl p-4 text-center">
                <CreditCard className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">Карта не назначена</p>
              </div>
            </div>
          )}

          {/* Quick actions - mobile */}
          <div className="xl:hidden">
            <div className="bg-card border border-border rounded-2xl p-4">
              <h3 className="text-foreground font-semibold mb-3 text-sm">{t("Быстрые действия")}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button onClick={() => { if (isUsdAccount) { setConvertOpen(true); return; } if (documentRequested) { setDocAlert(true); return; } navigate("/dashboard/transfers?new=1"); }} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Send className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground text-[11px]">{t("Перевод")}</span>
                </button>
                <button onClick={() => { if (documentRequested) { setDocAlert(true); return; } setDepositModal(true); }} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Wallet className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground text-[11px]">{t("Пополнить")}</span>
                </button>
                <button onClick={() => { if (isUsdAccount) { setConvertOpen(true); return; } if (documentRequested) { setDocAlert(true); return; } navigate("/dashboard/payments"); }} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Receipt className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground text-[11px]">{t("Платежи")}</span>
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
          <div className="bg-card border border-border rounded-2xl p-4 md:p-5 overflow-hidden">
            <h3 className="text-foreground font-semibold mb-4">{t("Последние операции")}</h3>
            <div className="space-y-0 overflow-x-hidden">
              {transactions.length === 0 && (
                <p className="text-muted-foreground text-sm text-center py-4">Нет операций</p>
              )}
              {transactions.slice(0, 20).map((tx) => {
                const positive = tx.amount >= 0;
                return (
                  <div key={tx.id} className="flex items-center py-3 border-b border-border last:border-0 gap-3 overflow-hidden">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${positive ? 'bg-primary/20' : 'bg-secondary'}`}>
                      {positive ? (
                        <ArrowDownLeft className="w-4 h-4 text-primary" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground text-sm font-medium truncate">{tx.title}</p>
                      <p className="text-muted-foreground text-xs truncate">{tx.category}</p>
                    </div>
                    <div className="text-right shrink-0 ml-2 whitespace-nowrap">
                      <p className={`text-sm font-medium ${positive ? 'text-primary' : 'text-foreground'}`}>{formatTxAmount(tx)}</p>
                      <p className="text-muted-foreground text-xs">{formatDate(tx.created_at)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column - desktop */}
        <div className="hidden xl:block w-80 shrink-0 space-y-6">
          {/* Card preview */}
          {activeCards.length > 0 ? (
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-muted-foreground text-xs font-medium tracking-wider">{t("ДЕБЕТОВАЯ КАРТА")}</p>
                <span className={`text-xs font-semibold ${cardTypeColor}`}>{cardTypeLabel}</span>
              </div>
              <div className="relative">
                <div ref={emblaRef} className="overflow-hidden rounded-xl">
                  <div className="flex">
                    {activeCards.map((card, i) => {
                      const isCardBlocked = isBlocked || blockedCards.includes(card.name);
                      return (
                      <div key={i} className="min-w-0 shrink-0 grow-0 basis-full card-perspective">
                        <div className={`card-flipper ${cvvVisible[card.name] ? 'flipped' : ''}`} style={{ minHeight: '200px' }}>
                          {/* Front */}
                          <div className={`card-front bg-gradient-to-br ${card.gradient} rounded-xl p-4 relative card-holographic ${isCardBlocked ? "opacity-70" : ""}`}>
                          {isCardBlocked && (
                            <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-destructive/90 text-destructive-foreground px-2 py-0.5 rounded-full">
                              <Lock className="w-3 h-3" />
                              <span className="text-[10px] font-medium">Заблокирована</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none rounded-xl" />
                          <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className="card-chip">
                              <div className="card-chip-lines" />
                            </div>
                            {card.name === "Diamond" ? <DiamondIcon3D className="w-8 h-8" /> : <Wifi className="w-4 h-4 text-white/40 rotate-90" />}
                          </div>
                          <p className="text-white/60 font-mono text-[10px] mb-1 relative z-10 card-text-embossed">BALANCE</p>
                          <p className="text-white font-bold text-lg mb-2 relative z-10">{balanceHidden ? "••••••" : isUsdAccount ? `$ ${cardBalance(card.name).toLocaleString("en-US", { minimumFractionDigits: 2 })}` : `₽ ${cardBalance(card.name).toLocaleString("ru-RU", { minimumFractionDigits: 2 })}`}</p>
                          <button onClick={(e) => { e.stopPropagation(); toggleNumber(card.name); }} className="text-left relative z-10">
                            <p className="text-white font-mono text-base card-number-embossed mb-3">{numberVisible[card.name] ? card.fullNumber : card.number}</p>
                          </button>
                          <div className="flex justify-between items-end relative z-10">
                            <div>
                              <p className="text-white/50 text-[10px] card-text-embossed">CARDHOLDER</p>
                              <p className="text-white text-xs font-medium card-text-embossed">{card.holder}</p>
                            </div>
                            <div>
                              <p className="text-white/50 text-[10px] card-text-embossed">EXPIRES</p>
                              <p className="text-white text-xs font-medium card-text-embossed">{card.expiry}</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); toggleCvv(card.name); }} className="text-left">
                              <p className="text-white/50 text-[10px]">CVV</p>
                              <p className="text-white text-xs font-medium">•••</p>
                            </button>
                            {card.type === "VISA" ? (
                              <p className="text-white font-bold text-lg italic card-text-embossed">VISA</p>
                            ) : (
                              <span className="flex items-center">
                                <span className="w-5 h-5 rounded-full bg-red-500 -mr-2 opacity-80" />
                                <span className="w-5 h-5 rounded-full bg-orange-400 opacity-80" />
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Back */}
                        <div className={`card-back bg-gradient-to-br ${card.gradient} rounded-xl relative overflow-hidden`}>
                          <div className="w-full h-10 bg-black/70 mt-5" />
                          <div className="px-4 mt-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-8 bg-white/10 rounded flex items-center justify-end px-3">
                                <span className="text-white font-mono text-sm font-bold italic card-text-embossed">{card.cvv}</span>
                              </div>
                              <p className="text-white/50 text-[9px] font-mono">CVV2</p>
                            </div>
                            <div className="mt-3 flex justify-between items-end">
                              <p className="text-white/20 text-[8px]">NeoBank International AG</p>
                              <button onClick={(e) => { e.stopPropagation(); toggleCvv(card.name); }} className="text-white/60 text-xs hover:text-white transition-colors">
                                ↻ Перевернуть
                              </button>
                            </div>
                          </div>
                        </div>
                        </div>
                      </div>
                    ); })}
                  </div>
                </div>
                {activeCards.length > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <button onClick={scrollPrev} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
                      <ChevronLeft className="w-4 h-4 text-foreground" />
                    </button>
                    <div className="flex gap-1.5">
                      {activeCards.map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === selectedIndex ? "bg-primary" : "bg-muted-foreground/30"}`} />
                      ))}
                    </div>
                    <button onClick={scrollNext} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
                      <ChevronRight className="w-4 h-4 text-foreground" />
                    </button>
                  </div>
                )}
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
              <button onClick={() => { if (isUsdAccount) { setConvertOpen(true); return; } if (documentRequested) { setDocAlert(true); return; } navigate("/dashboard/transfers?new=1"); }} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Send className="w-4 h-4 text-primary" />
                </div>
                <span className="text-foreground text-xs">{t("Перевод")}</span>
              </button>
              <button onClick={() => { if (documentRequested) { setDocAlert(true); return; } setDepositModal(true); }} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-primary" />
                </div>
                <span className="text-foreground text-xs">{t("Пополнить")}</span>
              </button>
              <button onClick={() => { if (isUsdAccount) { setConvertOpen(true); return; } if (documentRequested) { setDocAlert(true); return; } navigate("/dashboard/payments"); }} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-primary" />
                </div>
                <span className="text-foreground text-xs">{t("Платежи")}</span>
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
            <div className="space-y-3">
              {(["RUB", "USD", "EUR"] as const).map((currency) => {
                const selected = displayCurrency === currency;
                return (
                  <button
                    key={currency}
                    onClick={() => setDisplayCurrency(currency)}
                    className={`w-full rounded-xl border px-3 py-3 flex items-center justify-between text-left transition-colors ${selected ? "border-primary bg-primary/10" : "border-border hover:bg-secondary/50"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${selected ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                        {currency}
                      </div>
                      <div>
                        <p className="text-foreground text-sm font-medium">{currency === "RUB" ? t("Общий счёт") : `${currency} счёт`}</p>
                        <p className="text-muted-foreground text-xs">{currency === "RUB" ? "Основная валюта" : "Конвертация по текущему курсу"}</p>
                      </div>
                    </div>
                    <p className={`text-sm font-medium ${selected ? "text-primary" : isBlocked ? "text-destructive" : "text-foreground"}`}>
                      {balanceHidden ? "••••••" : formatCurrencyAmount(currency)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
          {/* Currency Rates */}
          <CurrencyRatesCompact />
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
