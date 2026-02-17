import { CreditCard, Wifi, Lock, Check, RotateCcw, CreditCard as CardIcon, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog, AlertDialogAction, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

const cardCatalog = [
  {
    name: "Standard",
    price: "14 999 ₽",
    limit: "2 500 000 ₽/мес",
    features: ["Кэшбэк 1%", "Бесконтактная оплата", "Apple Pay / Google Pay"],
    extras: ["Доступны переводы SWIFT"],
    gradient: "from-[hsl(220,15%,25%)] to-[hsl(220,20%,15%)]",
    type: "visa" as const,
    label: "Standard Card",
    last4: "3891",
    number: "4 •••• •••• •••• 3891",
    exp: "02/30",
  },
  {
    name: "Gold",
    price: "24 999 ₽",
    limit: "5 000 000 ₽/мес",
    features: ["Кэшбэк 3%", "Бесконтактная оплата", "Apple Pay / Google Pay", "Бесплатные переводы"],
    extras: ["Доступны переводы SWIFT"],
    gradient: "from-[hsl(35,80%,50%)] to-[hsl(25,90%,40%)]",
    type: "mastercard" as const,
    label: "Gold Card",
    last4: "7742",
    number: "5 •••• •••• •••• 7742",
    exp: "08/29",
  },
  {
    name: "Platinum",
    price: "49 999 ₽",
    limit: "10 000 000 ₽/мес",
    features: ["Кэшбэк 5%", "Бесконтактная оплата", "Apple Pay / Google Pay"],
    extras: ["Доступны переводы SWIFT", "Возможность выпуска пластиковой карты"],
    gradient: "from-[hsl(270,60%,50%)] to-[hsl(280,70%,35%)]",
    type: "visa" as const,
    label: "Platinum Card",
    last4: "1205",
    number: "4 •••• •••• •••• 1205",
    exp: "11/31",
  },
];

const MiniCatalogCard = ({ gradient, label, type }: { gradient: string; label: string; type: "visa" | "mastercard" }) => (
  <div className={`bg-gradient-to-br ${gradient} rounded-xl p-4 h-36 flex flex-col justify-between relative overflow-hidden`}>
    <div className="absolute top-0 right-0 w-20 h-20 rounded-full border border-white/10 -translate-y-6 translate-x-6" />
    <div className="flex justify-between items-start">
      <div>
        <span className="text-white/70 text-[10px]">NeoBank</span>
        <div className="w-6 h-4 bg-yellow-500 rounded mt-1" />
      </div>
      <div className="w-5 h-5 rounded-full border border-white/20" />
    </div>
    <div className="flex justify-between items-end">
      <div>
        <p className="text-white/40 font-mono text-xs">4••• •••• •••• ••••</p>
        <p className="text-white/60 text-[10px] mt-1">{label}</p>
      </div>
      <p className="text-white/80 font-bold text-sm">
        {type === "visa" ? "VISA" : (
          <span className="flex">
            <span className="w-4 h-4 rounded-full bg-red-500 -mr-1.5" />
            <span className="w-4 h-4 rounded-full bg-orange-400" />
          </span>
        )}
      </p>
    </div>
  </div>
);

const CardsTab = () => {
  const { t } = useLanguage();
  const { user, isAdmin } = useAuth();
  const [blockedAlert, setBlockedAlert] = useState(false);
  const [cardType, setCardType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchCard = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("card_type" as any)
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) setCardType((data as any).card_type ?? null);
      setLoading(false);
    };
    fetchCard();
  }, [user]);

  const assignedCard = cardCatalog.find(c => c.name === cardType);

  const handleCardAction = (action: string) => {
    toast.info("Для выполнения данной операции свяжитесь с Вашим менеджером или напишите в чат поддержки.");
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <CreditCard className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">{t("Мои карты")}</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-6">{t("Управление банковскими картами")}</p>

      <AlertDialog open={blockedAlert} onOpenChange={setBlockedAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Карта заблокирована
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground">
              Ваша карта была заблокирована. Для перевыпуска карты, пожалуйста, свяжитесь с Вашим менеджером или напишите в чат (внизу справа).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter><AlertDialogAction>OK</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Active card */}
      {!loading && assignedCard ? (
        <div className="mb-8">
          <h2 className="text-foreground font-semibold text-lg mb-4">Ваша карта</h2>
          <div className="max-w-sm">
            <Popover>
              <PopoverTrigger asChild>
                <div className="bg-card border border-border rounded-2xl p-5 cursor-pointer hover:border-primary/50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full border border-muted-foreground/30 flex items-center justify-center">
                        <span className="text-muted-foreground text-[10px]">◇</span>
                      </div>
                      <span className="text-foreground text-sm">NeoBank</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Wifi className="w-3 h-3 text-primary rotate-90" />
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-primary/20 text-primary">
                        Активна
                      </span>
                    </div>
                  </div>
                  <div className={`bg-gradient-to-br ${assignedCard.gradient} rounded-xl p-4 mt-3`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-8 h-5 bg-yellow-500 rounded" />
                      <Wifi className="w-4 h-4 text-white/40 rotate-90" />
                    </div>
                    <p className="text-white font-mono text-base tracking-widest mb-3">{assignedCard.number}</p>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-white/50 text-[9px]">ВЛАДЕЛЕЦ</p>
                        <p className="text-white text-xs">{user?.user_metadata?.display_name || user?.email?.split("@")[0]}</p>
                      </div>
                      <div>
                        <p className="text-white/50 text-[9px]">СРОК</p>
                        <p className="text-white text-xs">{assignedCard.exp}</p>
                      </div>
                      <p className="text-white font-bold italic">
                        {assignedCard.type === "visa" ? "VISA" : "MC"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">{assignedCard.name} • {assignedCard.limit}</span>
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-1.5 bg-popover border border-border" align="center">
                <button onClick={() => handleCardAction("reissue")} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-foreground hover:bg-secondary transition-colors">
                  <RotateCcw className="w-4 h-4 text-muted-foreground" /> Перевыпустить
                </button>
                <button onClick={() => handleCardAction("plastic")} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-foreground hover:bg-secondary transition-colors">
                  <CardIcon className="w-4 h-4 text-muted-foreground" /> Заказать пластиковую
                </button>
                <button onClick={() => handleCardAction("block")} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-destructive hover:bg-secondary transition-colors">
                  <ShieldOff className="w-4 h-4" /> Заблокировать
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      ) : !loading ? (
        <div className="mb-8 p-6 bg-card border border-border rounded-2xl text-center">
          <CreditCard className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium mb-1">У вас нет активной карты</p>
          <p className="text-muted-foreground text-sm">Свяжитесь с менеджером или напишите в чат поддержки для оформления карты.</p>
        </div>
      ) : null}

      {/* Card catalog */}
      <h2 className="text-foreground font-semibold text-lg mb-2">{t("О картах")}</h2>
      <p className="text-muted-foreground text-sm mb-6">Условия</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cardCatalog.map((card) => (
          <div key={card.name} className={`bg-card border rounded-2xl p-6 flex flex-col ${cardType === card.name ? "border-primary" : "border-border"}`}>
            {cardType === card.name && (
              <div className="flex items-center gap-1.5 mb-3">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-primary text-xs font-semibold">Ваша карта</span>
              </div>
            )}
            <MiniCatalogCard gradient={card.gradient} label={card.label} type={card.type} />
            <h3 className="text-xl font-bold text-foreground mt-6">{card.name}</h3>
            <p className="text-3xl font-extrabold text-foreground mt-2">{card.price}</p>
            <p className="text-muted-foreground text-sm mt-1">Лимит: {card.limit}</p>
            <ul className="mt-6 space-y-2 flex-1">
              {card.features.map((f) => (
                <li key={f} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="mt-0.5">—</span> {f}
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-1.5">
              {card.extras.map((e) => (
                <p key={e} className="text-sm text-primary flex items-center gap-2">
                  <Check className="w-4 h-4" /> {e}
                </p>
              ))}
            </div>
            <Button
              className="mt-6 w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => toast.info("Свяжитесь с Вашим менеджером или напишите в чат (внизу справа)")}
            >
              Купить — {card.price}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CardsTab;
