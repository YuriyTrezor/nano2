import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Gift, Star, TrendingUp, Sparkles, ShoppingBag, Utensils, Car, Plane, Pill, Fuel, Crown, Gem, Award, ChevronRight } from "lucide-react";

const cashbackCategories = [
  { icon: ShoppingBag, label: "Супермаркеты", percent: 5, color: "hsl(150,60%,45%)" },
  { icon: Utensils, label: "Рестораны", percent: 10, color: "hsl(15,80%,50%)" },
  { icon: Fuel, label: "АЗС", percent: 3, color: "hsl(45,90%,45%)" },
  { icon: Car, label: "Транспорт", percent: 2, color: "hsl(210,70%,50%)" },
  { icon: Plane, label: "Путешествия", percent: 7, color: "hsl(195,80%,45%)" },
  { icon: Pill, label: "Аптеки", percent: 3, color: "hsl(0,60%,50%)" },
];

const loyaltyLevels = [
  { name: "Standard", icon: Star, color: "hsl(210,10%,55%)", minSpend: 0, cashbackBonus: 0, perks: ["Базовый кэшбэк по категориям"] },
  { name: "Gold", icon: Crown, color: "hsl(45,85%,50%)", minSpend: 5000, cashbackBonus: 1, perks: ["+1% ко всем категориям", "Приоритетная поддержка"] },
  { name: "Platinum", icon: Gem, color: "hsl(220,15%,65%)", minSpend: 25000, cashbackBonus: 2, perks: ["+2% ко всем категориям", "Персональный менеджер", "Бесплатные переводы"] },
  { name: "Diamond", icon: Award, color: "hsl(195,80%,55%)", minSpend: 100000, cashbackBonus: 3, perks: ["+3% ко всем категориям", "VIP-обслуживание", "Эксклюзивные предложения", "Кэшбэк без лимита"] },
];

const BonusesTab = () => {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);

  const totalCashback = 0;
  const currentLevel = loyaltyLevels[0]; // Standard by default

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-xl font-bold text-foreground">{t("Бонусы и кэшбэк")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("Ваши бонусы, категории кэшбэка и программа лояльности")}</p>
      </div>

      {/* Total cashback card */}
      <div className="bg-gradient-to-r from-primary/80 to-primary rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/5 rounded-full -translate-y-8 translate-x-8" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-primary-foreground/5 rounded-full translate-y-6 -translate-x-6" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary-foreground/80" />
            <p className="text-sm font-medium text-primary-foreground/80">{t("Накопленный кэшбэк")}</p>
          </div>
          <p className="text-3xl font-bold text-primary-foreground">{totalCashback.toLocaleString("ru-RU", { minimumFractionDigits: 2 })} ₽</p>
          <p className="text-xs text-primary-foreground/60 mt-1">{t("Начисления появятся после совершения операций")}</p>
          <div className="flex items-center gap-2 mt-2">
            <TrendingUp className="w-4 h-4 text-primary-foreground/70" />
            <span className="text-xs text-primary-foreground/70">{t("За этот месяц")}</span>
          </div>
        </div>
      </div>

      {/* Cashback categories */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">{t("Категории кэшбэка")}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {cashbackCategories.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setSelectedCategory(selectedCategory === cat.label ? null : cat.label)}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 active:scale-[0.98] ${
                selectedCategory === cat.label
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/30"
              }`}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${cat.color}20` }}
              >
                <cat.icon className="w-5 h-5" style={{ color: cat.color }} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{t(cat.label)}</p>
                <p className="text-xs font-semibold" style={{ color: cat.color }}>
                  {cat.percent}% кэшбэк
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Loyalty Program - redesigned as tiered cards */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">{t("Программа лояльности")}</h2>
        <div className="space-y-2">
          {loyaltyLevels.map((level, idx) => {
            const LevelIcon = level.icon;
            const isCurrent = level.name === currentLevel.name;
            const isExpanded = expandedLevel === level.name;
            const isLocked = idx > 0;

            return (
              <button
                key={level.name}
                onClick={() => setExpandedLevel(isExpanded ? null : level.name)}
                className={`w-full text-left rounded-xl border p-4 transition-all duration-200 ${
                  isCurrent
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:border-primary/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${level.color}20` }}
                  >
                    <LevelIcon className="w-5 h-5" style={{ color: level.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{level.name}</p>
                      {isCurrent && (
                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                          Текущий
                        </span>
                      )}
                      {isLocked && !isCurrent && (
                        <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          от {level.minSpend.toLocaleString("ru-RU")} ₽/мес
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      +{level.cashbackBonus}% бонус ко всем категориям
                    </p>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0 ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5 animate-in fade-in-0 duration-150">
                    {level.perks.map((perk, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: level.color }} />
                        <p className="text-xs text-muted-foreground">{perk}</p>
                      </div>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* History */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">{t("История начислений")}</h2>
        <div className="bg-card border border-dashed border-border rounded-xl p-6 text-center">
          <Gift className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">Нет начислений</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Начисления появятся после совершения операций</p>
        </div>
      </div>
    </div>
  );
};

export default BonusesTab;
