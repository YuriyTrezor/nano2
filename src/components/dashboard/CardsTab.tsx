import { CreditCard, Wifi, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const myCards = [
  { last4: "3891", holder: "Chargeback", exp: "02/30" },
  { last4: "3184", holder: "Chargeback", exp: "02/30" },
  { last4: "0932", holder: "Chargeback", exp: "02/30" },
];

const orderCards = [
  {
    name: "Standard",
    price: "14 999",
    gradient: "from-slate-600 to-slate-800",
    icon: "🏦",
    cardNum: "4••• •••• •••• ••••",
    label: "Standard Card",
    features: ["Кэшбэк 1%", "Бесконтактная оплата", "Apple Pay / Google Pay", "Лимит 2 500 000 ₽/мес"],
    extras: ["Доступны переводы SWIFT"],
  },
  {
    name: "Gold",
    price: "24 999",
    gradient: "from-yellow-500 to-orange-600",
    icon: "👑",
    cardNum: "5••• •••• •••• ••••",
    label: "Gold Card",
    features: ["Кэшбэк 3%", "Бесконтактная оплата", "Apple Pay / Google Pay", "Лимит 5 000 000 ₽/мес"],
    extras: ["Доступны переводы SWIFT"],
  },
  {
    name: "Platinum",
    price: "49 999",
    gradient: "from-purple-600 to-indigo-800",
    icon: "⚡",
    cardNum: "4••• •••• •••• ••••",
    label: "Platinum Card",
    features: ["Кэшбэк 5%", "Бесконтактная оплата", "Apple Pay / Google Pay", "Лимит 10 000 000 ₽/мес"],
    extras: ["Доступны переводы SWIFT", "Возможность выпуска пластиковой карты"],
  },
];

const CardsTab = () => {
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <CreditCard className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Мои карты</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-6">Управление банковскими картами</p>

      {/* My cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {myCards.map((card, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border border-muted-foreground/30 flex items-center justify-center">
                  <span className="text-muted-foreground text-[10px]">◇</span>
                </div>
                <span className="text-foreground text-sm">NeoBank</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3 h-3 text-primary rotate-90" />
                <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-medium">Активна</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-secondary to-muted rounded-xl p-4 mt-3">
              <div className="h-12" />
              <p className="text-foreground font-mono text-base tracking-widest mb-3">4 •••• •••• •••• {card.last4}</p>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-muted-foreground text-[9px]">ВЛАДЕЛЕЦ</p>
                  <p className="text-foreground text-xs">{card.holder}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[9px]">СРОК</p>
                  <p className="text-foreground text-xs">{card.exp}</p>
                </div>
                <p className="text-foreground font-bold italic">VISA</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Order new card */}
      <h2 className="text-foreground font-semibold text-lg mb-4">Заказать новую карту</h2>
      <div className="grid grid-cols-3 gap-4">
        {orderCards.map((card, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className={`bg-gradient-to-r ${card.gradient} p-5 relative`}>
              <div className="flex justify-between items-start mb-8">
                <span className="text-2xl">{card.icon}</span>
                <span className="text-white/80 font-bold italic text-sm">VISA</span>
              </div>
              <p className="text-white/60 font-mono text-sm tracking-wider">{card.cardNum}</p>
              <p className="text-white/50 text-xs mt-1">{card.label}</p>
            </div>
            <div className="p-5">
              <h3 className="text-foreground font-bold text-lg">{card.name}</h3>
              <p className="text-primary font-bold text-xl mt-1">{card.price} <span className="text-muted-foreground text-sm font-normal">₽</span></p>
              <ul className="mt-3 space-y-1.5">
                {card.features.map((f, j) => (
                  <li key={j} className="text-muted-foreground text-sm flex items-center gap-2">
                    <span className="text-primary">•</span> {f}
                  </li>
                ))}
              </ul>
              <div className="mt-3 space-y-1">
                {card.extras.map((e, j) => (
                  <p key={j} className="text-primary text-xs flex items-center gap-1">
                    <Check className="w-3 h-3" /> {e}
                  </p>
                ))}
              </div>
              <Button className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
                Заказать за {card.price} ₽
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CardsTab;
