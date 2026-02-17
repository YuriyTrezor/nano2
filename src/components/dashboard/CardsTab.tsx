import { CreditCard, Wifi, Lock, Check, RotateCcw, CreditCard as CardIcon, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog, AlertDialogAction, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

interface CardState {
  last4: string;
  holder: string;
  exp: string;
  blocked: boolean;
}

const initialCards: CardState[] = [
  { last4: "3891", holder: "Chargeback", exp: "02/30", blocked: false },
  { last4: "3184", holder: "Chargeback", exp: "02/30", blocked: false },
  { last4: "0932", holder: "Chargeback", exp: "02/30", blocked: false },
];

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
  const { isAdmin } = useAuth();
  const [cards, setCards] = useState<CardState[]>(initialCards);
  const [blockedAlert, setBlockedAlert] = useState(false);

  const handleBlockCard = (index: number) => {
    setCards(prev => prev.map((c, i) => i === index ? { ...c, blocked: !c.blocked } : c));
    const card = cards[index];
    if (!card.blocked) {
      setBlockedAlert(true);
    }
  };

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

      {/* Blocked card alert */}
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

      {/* My cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {cards.map((card, i) => (
          <Popover key={i}>
            <PopoverTrigger asChild>
              <div className={`bg-card border rounded-2xl p-5 cursor-pointer hover:border-primary/50 transition-colors ${card.blocked ? "border-destructive" : "border-border"}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full border border-muted-foreground/30 flex items-center justify-center">
                      <span className="text-muted-foreground text-[10px]">◇</span>
                    </div>
                    <span className="text-foreground text-sm">NeoBank</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wifi className="w-3 h-3 text-primary rotate-90" />
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${card.blocked ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"}`}>
                      {card.blocked ? "Заблокирована" : "Активна"}
                    </span>
                  </div>
                </div>
                <div className={`bg-gradient-to-br from-secondary to-muted rounded-xl p-4 mt-3 ${card.blocked ? "opacity-50" : ""}`}>
                  <div className="h-12" />
                  <p className="text-foreground font-mono text-base tracking-widest mb-3">4 •••• •••• •••• {card.last4}</p>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-muted-foreground text-[9px]">{t("ВЛАДЕЛЕЦ")}</p>
                      <p className="text-foreground text-xs">{card.holder}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[9px]">{t("СРОК")}</p>
                      <p className="text-foreground text-xs">{card.exp}</p>
                    </div>
                    <p className="text-foreground font-bold italic">VISA</p>
                  </div>
                </div>
                {card.blocked && (
                  <p className="text-destructive text-xs mt-2 font-medium">Счёт заблокирован</p>
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1.5 bg-popover border border-border" align="center">
              <button
                onClick={() => handleCardAction("reissue")}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-foreground hover:bg-secondary transition-colors"
              >
                <RotateCcw className="w-4 h-4 text-muted-foreground" />
                Перевыпустить
              </button>
              <button
                onClick={() => handleCardAction("plastic")}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-foreground hover:bg-secondary transition-colors"
              >
                <CardIcon className="w-4 h-4 text-muted-foreground" />
                Заказать пластиковую
              </button>
              {isAdmin ? (
                <button
                  onClick={() => handleBlockCard(i)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-destructive hover:bg-secondary transition-colors"
                >
                  <ShieldOff className="w-4 h-4" />
                  {card.blocked ? "Разблокировать" : "Заблокировать"}
                </button>
              ) : (
                <button
                  onClick={() => handleCardAction("block")}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-destructive hover:bg-secondary transition-colors"
                >
                  <ShieldOff className="w-4 h-4" />
                  Заблокировать
                </button>
              )}
            </PopoverContent>
          </Popover>
        ))}
      </div>

      {/* Card catalog — same as landing page */}
      <h2 className="text-foreground font-semibold text-lg mb-2">{t("О картах")}</h2>
      <p className="text-muted-foreground text-sm mb-6">Условия</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cardCatalog.map((card) => (
          <div key={card.name} className="bg-card border border-border rounded-2xl p-6 flex flex-col">
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

            <Button className="mt-6 w-full bg-primary hover:bg-primary/90 text-primary-foreground">
              Купить — {card.price}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CardsTab;
