import { Eye, EyeOff, ArrowUpRight, ArrowDownLeft, Send, Smartphone, CreditCard, Wifi, History, Phone, Flame, WifiIcon, Tv, Zap, FileText, X, AlertTriangle, ChevronLeft, ChevronRight, EyeOff as EyeOffIcon, Lock, FileWarning } from "lucide-react";
import DiamondIcon3D from "@/components/DiamondIcon3D";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useCallback } from "react";

import CurrencyRatesCompact from "@/components/dashboard/CurrencyRatesCompact";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog, AlertDialogAction, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import useEmblaCarousel from "embla-carousel-react";

const transliterate = (text: string): string => {
  const map: Record<string, string> = {
    А:'A',Б:'B',В:'V',Г:'G',Д:'D',Е:'E',Ё:'E',Ж:'Zh',З:'Z',И:'I',Й:'Y',К:'K',Л:'L',М:'M',Н:'N',О:'O',П:'P',Р:'R',С:'S',Т:'T',У:'U',Ф:'F',Х:'Kh',Ц:'Ts',Ч:'Ch',Ш:'Sh',Щ:'Shch',Ъ:'',Ы:'Y',Ь:'',Э:'E',Ю:'Yu',Я:'Ya',
    а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
  };
  return text.split('').map(c => map[c] ?? c).join('').toUpperCase();
};

const paymentServices = [
  { icon: Phone, label: "Мобильная связь" },
  { icon: Flame, label: "ЖКХ" },
  { icon: WifiIcon, label: "Интернет" },
  { icon: Tv, label: "Телевидение" },
  { icon: Zap, label: "Электричество" },
  { icon: FileText, label: "Налоги и штрафы" },
];

const allCards: Record<string, { name: string; number: string; fullNumber: string; holder: string; expiry: string; type: string; gradient: string; cvv: string }> = {
  Standard: { name: "Standard", number: "4 •••• •••• •••• 3891", fullNumber: "4118 2735 6491 3891", holder: "", expiry: "02/30", type: "VISA", gradient: "from-secondary to-muted", cvv: "482" },
  Gold: { name: "Gold", number: "5 •••• •••• •••• 7742", fullNumber: "5263 4810 9357 7742", holder: "", expiry: "08/29", type: "MC", gradient: "from-[hsl(35,80%,30%)] to-[hsl(25,70%,20%)]", cvv: "719" },
  Platinum: { name: "Platinum", number: "4 •••• •••• •••• 1205", fullNumber: "4729 6183 0542 1205", holder: "", expiry: "11/31", type: "VISA", gradient: "from-[hsl(270,40%,25%)] to-[hsl(280,50%,15%)]", cvv: "365" },
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
  const [payAlert, setPayAlert] = useState(false);
  const [docAlert, setDocAlert] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [withdrawalBlocked, setWithdrawalBlocked] = useState(false);
  const [documentRequested, setDocumentRequested] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balanceHidden, setBalanceHidden] = useState(false);
  const [userCards, setUserCards] = useState<string[]>([]);
  const [cvvVisible, setCvvVisible] = useState<Record<string, boolean>>({});
  const [numberVisible, setNumberVisible] = useState<Record<string, boolean>>({});
  const [blockedCards, setBlockedCards] = useState<string[]>([]);

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

  // Total balance = sum of card-specific balances (only transactions assigned to user's cards)
  const balance = transactions
    .filter(tx => tx.card_name && userCards.includes(tx.card_name))
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
  const balanceFormatted = balance.toLocaleString("ru-RU", { minimumFractionDigits: 2 });

  const cardBalance = (cardName: string) => {
    return transactions
      .filter(tx => tx.card_name === cardName)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
  };

  const computePercentChange = () => {
    const cardTxs = transactions.filter(tx => tx.card_name && userCards.includes(tx.card_name));
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
        .select("is_blocked, cards, withdrawal_blocked, blocked_cards, document_requested")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile) {
        setIsBlocked((profile as any).is_blocked ?? false);
        setWithdrawalBlocked((profile as any).withdrawal_blocked ?? false);
        setUserCards((profile as any).cards ?? []);
        setBlockedCards((profile as any).blocked_cards ?? []);
        setDocumentRequested((profile as any).document_requested ?? false);
      }

      const { data: txData } = await supabase
        .from("transactions")
        .select("id, title, category, amount, card_name, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(500);
      if (txData) setTransactions(txData as Transaction[]);
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
  const cardTypeColor = cardTypeLabel === "Gold" ? "text-[hsl(35,80%,50%)]" : cardTypeLabel === "Platinum" ? "text-[hsl(270,60%,60%)]" : cardTypeLabel === "Diamond" ? "text-[hsl(195,80%,60%)]" : "text-muted-foreground";

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

      {/* Pay services modal */}
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

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Left column */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Balance card */}
          <div className={`rounded-2xl p-5 md:p-6 relative ${
            isBlocked 
              ? "bg-destructive/20 border border-destructive" 
              : documentRequested
                ? "bg-gradient-to-r from-[hsl(210,80%,50%)] to-[hsl(220,85%,45%)]"
                : withdrawalBlocked 
                  ? "bg-gradient-to-r from-[hsl(35,90%,45%)] to-[hsl(25,85%,50%)]" 
                  : "bg-gradient-to-r from-primary/80 to-primary"
          }`}>
            <div className="flex justify-between items-start">
              <div>
                <p className={`text-sm font-medium ${isBlocked ? "text-destructive" : "text-primary-foreground/80"}`}>{t("Общий баланс")}</p>
                <p className={`text-2xl sm:text-3xl md:text-4xl font-bold mt-1 ${isBlocked ? "text-destructive" : "text-primary-foreground"}`}>
                  {balanceHidden ? "••••••" : `₽ ${balanceFormatted}`}
                </p>
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
              </div>
              <button onClick={toggleBalanceHidden} className={`${isBlocked ? "text-destructive/60" : "text-primary-foreground/60"} hover:opacity-80 transition-opacity`}>
                {balanceHidden ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

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
                      {activeCards.map((card, i) => (
                        <div key={i} className="min-w-0 shrink-0 grow-0 basis-full">
                          <div className={`bg-gradient-to-br ${card.gradient} rounded-xl p-4 relative select-none`}>
                            <div className="flex justify-between items-start mb-4">
                              <div className="w-8 h-5 bg-yellow-500 rounded" />
                              {card.name === "Diamond" ? <DiamondIcon3D className="w-8 h-8" /> : <Wifi className="w-4 h-4 text-white/40 rotate-90" />}
                            </div>
                          <p className="text-white/60 font-mono text-[10px] mb-1">BALANCE</p>
                          <p className="text-white font-bold text-lg mb-2">{balanceHidden ? "••••••" : `₽ ${cardBalance(card.name).toLocaleString("ru-RU", { minimumFractionDigits: 2 })}`}</p>
                            <button onClick={(e) => { e.stopPropagation(); toggleNumber(card.name); }} className="text-left">
                              <p className="text-white font-mono text-base tracking-[0.2em] mb-3">{numberVisible[card.name] ? card.fullNumber : card.number}</p>
                            </button>
                            <div className="flex justify-between items-end">
                              <div>
                                <p className="text-white/50 text-[10px]">CARDHOLDER</p>
                                <p className="text-white text-xs font-medium">{card.holder}</p>
                              </div>
                              <div>
                                <p className="text-white/50 text-[10px]">EXPIRES</p>
                                <p className="text-white text-xs font-medium">{card.expiry}</p>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); toggleCvv(card.name); }} className="text-left">
                                <p className="text-white/50 text-[10px]">CVV</p>
                                <p className="text-white text-xs font-medium">{cvvVisible[card.name] ? card.cvv : "•••"}</p>
                              </button>
                            {card.type === "VISA" ? (
                              <p className="text-white font-bold text-lg italic">VISA</p>
                            ) : (
                              <span className="flex items-center">
                                <span className="w-5 h-5 rounded-full bg-red-500 -mr-2 opacity-80" />
                                <span className="w-5 h-5 rounded-full bg-orange-400 opacity-80" />
                              </span>
                            )}
                            </div>
                          </div>
                        </div>
                      ))}
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
                <button onClick={() => { if (documentRequested) { setDocAlert(true); return; } navigate("/dashboard/transfers?new=1"); }} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Send className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground text-[11px]">{t("Перевод")}</span>
                </button>
                <button onClick={() => { if (documentRequested) { setDocAlert(true); return; } setTopUpAlert(true); }} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground text-[11px]">{t("Пополнить")}</span>
                </button>
                <button onClick={() => { if (documentRequested) { setDocAlert(true); return; } setPayAlert(true); }} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
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
                    {activeCards.map((card, i) => (
                      <div key={i} className="min-w-0 shrink-0 grow-0 basis-full">
                        <div className={`bg-gradient-to-br ${card.gradient} rounded-xl p-4 relative`}>
                          <div className="flex justify-between items-start mb-4">
                            <div className="w-8 h-5 bg-yellow-500 rounded" />
                            {card.name === "Diamond" ? <DiamondIcon3D className="w-8 h-8" /> : <Wifi className="w-4 h-4 text-white/40 rotate-90" />}
                          </div>
                          <p className="text-white/60 font-mono text-[10px] mb-1">BALANCE</p>
                          <p className="text-white font-bold text-lg mb-2">{balanceHidden ? "••••••" : `₽ ${cardBalance(card.name).toLocaleString("ru-RU", { minimumFractionDigits: 2 })}`}</p>
                          <button onClick={(e) => { e.stopPropagation(); toggleNumber(card.name); }} className="text-left">
                            <p className="text-white font-mono text-base tracking-[0.2em] mb-3">{numberVisible[card.name] ? card.fullNumber : card.number}</p>
                          </button>
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-white/50 text-[10px]">CARDHOLDER</p>
                              <p className="text-white text-xs font-medium">{card.holder}</p>
                            </div>
                            <div>
                              <p className="text-white/50 text-[10px]">EXPIRES</p>
                              <p className="text-white text-xs font-medium">{card.expiry}</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); toggleCvv(card.name); }} className="text-left">
                              <p className="text-white/50 text-[10px]">CVV</p>
                              <p className="text-white text-xs font-medium">{cvvVisible[card.name] ? card.cvv : "•••"}</p>
                            </button>
                            {card.type === "VISA" ? (
                              <p className="text-white font-bold text-lg italic">VISA</p>
                            ) : (
                              <span className="flex items-center">
                                <span className="w-5 h-5 rounded-full bg-red-500 -mr-2 opacity-80" />
                                <span className="w-5 h-5 rounded-full bg-orange-400 opacity-80" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
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
              <button onClick={() => { if (documentRequested) { setDocAlert(true); return; } navigate("/dashboard/transfers?new=1"); }} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Send className="w-4 h-4 text-primary" />
                </div>
                <span className="text-foreground text-xs">{t("Перевод")}</span>
              </button>
              <button onClick={() => { if (documentRequested) { setDocAlert(true); return; } setTopUpAlert(true); }} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-primary" />
                </div>
                <span className="text-foreground text-xs">{t("Пополнить")}</span>
              </button>
              <button onClick={() => { if (documentRequested) { setDocAlert(true); return; } setPayAlert(true); }} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors">
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
                  <p className="text-foreground text-sm font-medium">{t("Общий счёт")}</p>
                  <p className="text-muted-foreground text-xs">RUB</p>
                </div>
              </div>
              <p className={`text-sm font-medium ${isBlocked ? "text-destructive" : "text-foreground"}`}>
                {balanceHidden ? "••••••" : `₽ ${balanceFormatted}`}
              </p>
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
