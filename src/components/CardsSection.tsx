import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const cardData = [
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

const MiniCard = ({ gradient, label, type }: { gradient: string; label: string; type: "visa" | "mastercard" }) => (
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

const CardsSection = () => {
  return (
    <section id="cards" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-2">О картах</h2>
        <p className="text-muted-foreground text-center mb-16">Условия</p>

        <div className="grid md:grid-cols-3 gap-6">
          {cardData.map((card) => (
            <div key={card.name} className="bg-card border border-border rounded-2xl p-6 flex flex-col">
              <MiniCard gradient={card.gradient} label={card.label} type={card.type} />
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
    </section>
  );
};

export default CardsSection;
