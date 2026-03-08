import { Check, LogIn, CreditCard, Crown, Gem, Wifi } from "lucide-react";
import DiamondIcon3D from "@/components/DiamondIcon3D";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const cardData = [
  {
    name: "Standard",
    limit: "2 500 000 ₽/мес",
    features: ["Кэшбэк 1%", "Бесконтактная оплата", "Apple Pay / Google Pay"],
    featuresEn: ["1% Cashback", "Contactless payment", "Apple Pay / Google Pay"],
    extras: ["Доступны переводы SWIFT"],
    extrasEn: ["SWIFT transfers available"],
    gradient: "from-[hsl(220,15%,25%)] to-[hsl(220,20%,15%)]",
    borderColor: "hsl(220,15%,30%)",
    accentColor: "hsl(220,15%,60%)",
    accentTw: "text-[hsl(220,15%,60%)]",
    shadowColor: "hsl(220,15%,40%,0.15)",
    icon: CreditCard,
    type: "visa" as const,
    label: "Standard Card",
    badge: null,
  },
  {
    name: "Gold",
    limit: "5 000 000 ₽/мес",
    features: ["Кэшбэк 3%", "Бесконтактная оплата", "Apple Pay / Google Pay", "Бесплатные переводы"],
    featuresEn: ["3% Cashback", "Contactless payment", "Apple Pay / Google Pay", "Free transfers"],
    extras: ["Доступны переводы SWIFT"],
    extrasEn: ["SWIFT transfers available"],
    gradient: "from-[hsl(35,80%,50%)] to-[hsl(25,90%,40%)]",
    borderColor: "hsl(35,60%,30%)",
    accentColor: "hsl(35,80%,55%)",
    accentTw: "text-[hsl(35,80%,55%)]",
    shadowColor: "hsl(35,80%,50%,0.15)",
    icon: Crown,
    type: "mastercard" as const,
    label: "Gold Card",
    badge: "Popular",
  },
  {
    name: "Platinum",
    limit: "10 000 000 ₽/мес",
    features: ["Кэшбэк 5%", "Бесконтактная оплата", "Apple Pay / Google Pay"],
    featuresEn: ["5% Cashback", "Contactless payment", "Apple Pay / Google Pay"],
    extras: ["Доступны переводы SWIFT", "Возможность выпуска пластиковой карты"],
    extrasEn: ["SWIFT transfers available", "Physical card available"],
    gradient: "from-[hsl(270,60%,50%)] to-[hsl(280,70%,35%)]",
    borderColor: "hsl(270,40%,35%)",
    accentColor: "hsl(270,60%,65%)",
    accentTw: "text-[hsl(270,60%,65%)]",
    shadowColor: "hsl(270,60%,50%,0.15)",
    icon: Gem,
    type: "visa" as const,
    label: "Platinum Card",
    badge: null,
  },
];

const diamondCard = {
  name: "Diamond",
  limit: "25 000 000 ₽/мес",
  features: ["Кэшбэк 7%", "Оплата в USDT", "Автоопределение моста для безопасного вывода", "Персональный консьерж 24/7", "Мультивалютный счёт (USD/EUR/GBP/CHF)"],
  featuresEn: ["7% Cashback", "USDT payments", "Auto bridge detection for safe withdrawals", "Personal concierge 24/7", "Multi-currency account (USD/EUR/GBP/CHF)"],
  extras: ["Доступны переводы SWIFT", "Возможность выпуска пластиковой карты", "Без риска блокировки при выводе"],
  extrasEn: ["SWIFT transfers available", "Physical card available", "No withdrawal block risk"],
  gradient: "from-[hsl(195,80%,40%)] to-[hsl(210,90%,30%)]",
  type: "visa" as const,
};

const MiniCard = ({ gradient, label, type, icon: Icon }: { gradient: string; label: string; type: "visa" | "mastercard"; icon?: React.ElementType }) => (
  <div className={`bg-gradient-to-br ${gradient} rounded-xl p-4 h-36 flex flex-col justify-between relative overflow-hidden`}>
    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent" />
    <div className="absolute top-0 right-0 w-20 h-20 rounded-full border border-white/10 -translate-y-6 translate-x-6" />
    <div className="flex justify-between items-start relative z-10">
      <div>
        <span className="text-white/70 text-[10px]">NeoBank</span>
        <div className="w-6 h-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded mt-1" />
      </div>
      {Icon ? <Icon className="w-5 h-5 text-white/30" /> : <Wifi className="w-4 h-4 text-white/20 rotate-90" />}
    </div>
    <div className="flex justify-between items-end relative z-10">
      <div>
        <p className="text-white/40 font-mono text-xs">{type === "mastercard" ? "5" : "4"}••• •••• •••• ••••</p>
        <p className="text-white/60 text-[10px] mt-1">{label}</p>
      </div>
      <p className="text-white/80 font-bold text-sm">
        {type === "visa" ? "VISA" : (
          <span className="flex">
            <span className="w-4 h-4 rounded-full bg-red-500 -mr-1.5 opacity-80" />
            <span className="w-4 h-4 rounded-full bg-orange-400 opacity-80" />
          </span>
        )}
      </p>
    </div>
  </div>
);

const CardsSection = () => {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const isEn = lang === "en";

  return (
    <section id="cards" className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-2">{t("О картах")}</h2>
        <p className="text-muted-foreground text-center mb-16">{t("Условия")}</p>

        {/* 3 cards horizontal */}
        <div className="grid md:grid-cols-3 gap-5">
          {cardData.map((card) => (
            <div
              key={card.name}
              className="bg-card border border-border rounded-2xl p-5 flex flex-col hover:border-primary/30 transition-all"
              style={{ boxShadow: `0 4px 20px ${card.shadowColor}` }}
            >
              <MiniCard gradient={card.gradient} label={card.label} type={card.type} icon={card.icon} />
              <div className="flex items-center gap-2 mt-5">
                <h3 className="text-lg font-bold text-foreground">{card.name}</h3>
                {card.badge && (
                  <span
                    className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border"
                    style={{
                      background: `linear-gradient(135deg, ${card.accentColor}20, ${card.accentColor}10)`,
                      color: card.accentColor,
                      borderColor: card.accentColor + '4D',
                    }}
                  >
                    {card.badge}
                  </span>
                )}
              </div>
              <p className="text-muted-foreground text-xs mt-1">{isEn ? "Limit" : "Лимит"}: {card.limit}</p>

              <ul className="mt-4 space-y-1.5 flex-1">
                {(isEn ? card.featuresEn : card.features).map((f) => (
                  <li key={f} className="text-xs text-muted-foreground flex items-start gap-2">
                    <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${card.accentTw}`} /> {f}
                  </li>
                ))}
              </ul>

              <div className="mt-3 space-y-1">
                {(isEn ? card.extrasEn : card.extras).map((e) => (
                  <p key={e} className={`text-xs ${card.accentTw} flex items-center gap-2`}>
                    <Check className="w-3.5 h-3.5" /> {e}
                  </p>
                ))}
              </div>

              <Button
                className="mt-5 w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                size="sm"
                onClick={() => navigate("/auth")}
              >
                <LogIn className="w-4 h-4" />
                {t("Войти в личный кабинет")}
              </Button>
            </div>
          ))}
        </div>

        {/* Diamond Card - premium full width */}
        <div className="mt-10">
          <div className="bg-gradient-to-br from-[hsl(210,30%,8%)] to-[hsl(200,25%,12%)] border border-[hsl(195,60%,30%)]/30 rounded-2xl p-6 md:p-10 max-w-4xl mx-auto relative overflow-hidden">
            {/* Shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[hsl(195,80%,60%)]/5 to-transparent animate-pulse pointer-events-none" />
            {/* Glow corners */}
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-[hsl(195,80%,50%)]/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-[hsl(210,90%,40%)]/10 blur-3xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row gap-8 relative z-10">
              {/* Left: card visual */}
              <div className="md:w-80 shrink-0">
                <div className="relative mb-5 flex justify-center">
                  <DiamondIcon3D className="w-24 h-24" />
                </div>
                <div className={`bg-gradient-to-br ${diamondCard.gradient} rounded-xl p-5 h-48 flex flex-col justify-between relative overflow-hidden shadow-[0_10px_50px_hsl(195,80%,50%,0.2)]`}>
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent" />
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full border border-white/10 -translate-y-10 translate-x-10" />
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <span className="text-white/80 text-xs font-medium tracking-wider">NeoBank</span>
                      <div className="w-8 h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded mt-1.5" />
                    </div>
                    <DiamondIcon3D className="w-10 h-10" />
                  </div>
                  <div className="flex justify-between items-end relative z-10">
                    <div>
                      <p className="text-white/50 font-mono text-xs">4••• •••• •••• ••••</p>
                      <p className="text-[hsl(195,80%,70%)] text-sm mt-1 font-bold tracking-[0.2em]">DIAMOND</p>
                    </div>
                    <p className="text-white/90 font-bold text-lg italic">VISA</p>
                  </div>
                </div>
              </div>

              {/* Right: info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-3xl font-bold text-foreground">Diamond</h3>
                  <DiamondIcon3D className="w-7 h-7" />
                  <span className="text-[10px] px-4 py-1.5 rounded-full font-bold bg-gradient-to-r from-[hsl(195,80%,60%)]/20 to-[hsl(210,80%,50%)]/20 text-[hsl(195,80%,60%)] uppercase tracking-widest border border-[hsl(195,60%,50%)]/30">Premium</span>
                </div>
                <p className="text-muted-foreground text-sm mb-5">{isEn ? "Limit" : "Лимит"}: {diamondCard.limit}</p>

                <div className="bg-[hsl(195,40%,15%)] rounded-xl p-4 mb-5 border border-[hsl(195,60%,30%)]/20">
                  <p className="text-foreground font-semibold text-sm mb-1">
                    {isEn ? "Withdrawal without blocks to MIR cards" : "Вывод без блокировок на карты МИР"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {isEn ? "Automatic bridge detection for safe withdrawal. No blocks or delays." : "Автоматическое определение моста для безопасного вывода. Никаких блокировок и задержек."}
                  </p>
                </div>

                <ul className="space-y-2 mb-5">
                  {(isEn ? diamondCard.featuresEn : diamondCard.features).map((f) => (
                    <li key={f} className="text-sm text-muted-foreground flex items-center gap-2">
                      <Check className="w-4 h-4 text-[hsl(195,80%,60%)] shrink-0" /> {f}
                    </li>
                  ))}
                </ul>

                <div className="space-y-1.5 mb-6">
                  {(isEn ? diamondCard.extrasEn : diamondCard.extras).map((e) => (
                    <p key={e} className="text-sm text-[hsl(195,80%,60%)] flex items-center gap-2">
                      <Check className="w-4 h-4" /> {e}
                    </p>
                  ))}
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-[hsl(195,80%,40%)] to-[hsl(210,90%,30%)] hover:opacity-90 text-white gap-2 shadow-[0_0_30px_hsl(195,80%,50%,0.25)] h-12 text-base"
                  onClick={() => navigate("/auth")}
                >
                  <LogIn className="w-5 h-5" />
                  {t("Войти в личный кабинет")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CardsSection;
