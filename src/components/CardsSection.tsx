import { Check, LogIn } from "lucide-react";
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
    type: "visa" as const,
    label: "Standard Card",
  },
  {
    name: "Gold",
    limit: "5 000 000 ₽/мес",
    features: ["Кэшбэк 3%", "Бесконтактная оплата", "Apple Pay / Google Pay", "Бесплатные переводы"],
    featuresEn: ["3% Cashback", "Contactless payment", "Apple Pay / Google Pay", "Free transfers"],
    extras: ["Доступны переводы SWIFT"],
    extrasEn: ["SWIFT transfers available"],
    gradient: "from-[hsl(35,80%,50%)] to-[hsl(25,90%,40%)]",
    type: "mastercard" as const,
    label: "Gold Card",
  },
  {
    name: "Platinum",
    limit: "10 000 000 ₽/мес",
    features: ["Кэшбэк 5%", "Бесконтактная оплата", "Apple Pay / Google Pay"],
    featuresEn: ["5% Cashback", "Contactless payment", "Apple Pay / Google Pay"],
    extras: ["Доступны переводы SWIFT", "Возможность выпуска пластиковой карты"],
    extrasEn: ["SWIFT transfers available", "Physical card available"],
    gradient: "from-[hsl(270,60%,50%)] to-[hsl(280,70%,35%)]",
    type: "visa" as const,
    label: "Platinum Card",
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
  label: "Diamond Card",
  premium: true,
};

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
        <p className="text-white/40 font-mono text-xs">{type === "mastercard" ? "5" : "4"}••• •••• •••• ••••</p>
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
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const isEn = lang === "en";

  return (
    <section id="cards" className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-2">{t("О картах")}</h2>
        <p className="text-muted-foreground text-center mb-16">{t("Условия")}</p>

        <div className="grid md:grid-cols-3 gap-6">
          {cardData.map((card) => (
            <div key={card.name} className="bg-card border border-border rounded-2xl p-6 flex flex-col">
              <MiniCard gradient={card.gradient} label={card.label} type={card.type} />
              <h3 className="text-xl font-bold text-foreground mt-6">{card.name}</h3>
              <p className="text-muted-foreground text-sm mt-1">{isEn ? "Limit" : "Лимит"}: {card.limit}</p>

              <ul className="mt-6 space-y-2 flex-1">
                {(isEn ? card.featuresEn : card.features).map((f) => (
                  <li key={f} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="mt-0.5">—</span> {f}
                  </li>
                ))}
              </ul>

              <div className="mt-4 space-y-1.5">
                {(isEn ? card.extrasEn : card.extras).map((e) => (
                  <p key={e} className="text-sm text-primary flex items-center gap-2">
                    <Check className="w-4 h-4" /> {e}
                  </p>
                ))}
              </div>

              <Button
                className="mt-6 w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
                onClick={() => navigate("/auth")}
              >
                <LogIn className="w-4 h-4" />
                {t("Войти в личный кабинет")}
              </Button>
            </div>
          ))}
        </div>

        {/* Diamond Card - full width below */}
        <div className="mt-8">
          <div className="bg-gradient-to-br from-[hsl(210,30%,8%)] to-[hsl(200,25%,12%)] border border-[hsl(195,60%,30%)]/30 rounded-2xl p-6 md:p-8 max-w-3xl mx-auto relative overflow-hidden">
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[hsl(195,80%,60%)]/5 to-transparent animate-[diamond-shine_3s_ease-in-out_infinite]" />
            
            <div className="flex flex-col md:flex-row gap-8 relative z-10">
              {/* Left: card visual */}
              <div className="md:w-72 shrink-0">
                <div className="relative mb-4 flex justify-center md:justify-start">
                  <DiamondIcon3D className="w-16 h-16" />
                </div>
                <div className={`bg-gradient-to-br ${diamondCard.gradient} rounded-xl p-5 h-44 flex flex-col justify-between relative overflow-hidden shadow-[0_0_30px_hsl(195,80%,50%,0.15)]`}>
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent" />
                  <div className="absolute top-0 right-0 w-28 h-28 rounded-full border border-white/10 -translate-y-8 translate-x-8" />
                  <div className="flex justify-between items-start relative z-10">
                    <div>
                      <span className="text-white/80 text-xs font-medium tracking-wider">NeoBank</span>
                      <div className="w-7 h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded mt-1.5" />
                    </div>
                    <DiamondIcon3D className="w-8 h-8" />
                  </div>
                  <div className="flex justify-between items-end relative z-10">
                    <div>
                      <p className="text-white/50 font-mono text-xs">4••• •••• •••• ••••</p>
                      <p className="text-[hsl(195,80%,70%)] text-xs mt-1 font-semibold tracking-wider">DIAMOND</p>
                    </div>
                    <p className="text-white/90 font-bold text-sm">VISA</p>
                  </div>
                </div>
              </div>

              {/* Right: info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold text-foreground">Diamond</h3>
                  <DiamondIcon3D className="w-6 h-6" />
                  <span className="text-[10px] px-3 py-1 rounded-full font-bold bg-gradient-to-r from-[hsl(195,80%,60%)]/20 to-[hsl(210,80%,50%)]/20 text-[hsl(195,80%,60%)] uppercase tracking-wider border border-[hsl(195,60%,50%)]/30">Premium</span>
                </div>
                <p className="text-muted-foreground text-sm mb-4">{isEn ? "Limit" : "Лимит"}: {diamondCard.limit}</p>

                <div className="bg-[hsl(195,40%,15%)] rounded-xl p-4 mb-4 border border-[hsl(195,60%,30%)]/20">
                  <p className="text-foreground font-semibold text-sm mb-1">
                    {isEn ? "Withdrawal without blocks to MIR cards" : "Вывод без блокировок на карты МИР"}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {isEn ? "Automatic bridge detection for safe withdrawal. No blocks or delays." : "Автоматическое определение моста для безопасного вывода. Никаких блокировок и задержек."}
                  </p>
                </div>

                <ul className="space-y-2 mb-4">
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
                  className="w-full bg-gradient-to-r from-[hsl(195,80%,40%)] to-[hsl(210,90%,30%)] hover:opacity-90 text-white gap-2 shadow-[0_0_20px_hsl(195,80%,50%,0.2)]"
                  onClick={() => navigate("/auth")}
                >
                  <LogIn className="w-4 h-4" />
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
