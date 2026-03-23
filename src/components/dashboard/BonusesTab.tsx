import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Gift, Percent, Star, TrendingUp, ChevronRight, Sparkles, ShoppingBag, Utensils, Car, Plane, Pill, Fuel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const cashbackCategories = [
  { icon: ShoppingBag, label: "Супермаркеты", percent: 5, color: "hsl(150,60%,45%)" },
  { icon: Utensils, label: "Рестораны", percent: 10, color: "hsl(15,80%,50%)" },
  { icon: Fuel, label: "АЗС", percent: 3, color: "hsl(45,90%,45%)" },
  { icon: Car, label: "Транспорт", percent: 2, color: "hsl(210,70%,50%)" },
  { icon: Plane, label: "Путешествия", percent: 7, color: "hsl(195,80%,45%)" },
  { icon: Pill, label: "Аптеки", percent: 3, color: "hsl(0,60%,50%)" },
];

interface BonusHistory {
  id: string;
  title: string;
  amount: number;
  date: string;
  category: string;
}

const mockHistory: BonusHistory[] = [];

const BonusesTab = () => {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const totalCashback = 0;
  const filteredHistory = selectedCategory
    ? mockHistory.filter(h => h.category === selectedCategory)
    : mockHistory;

  const getCategoryIcon = (label: string) => {
    const cat = cashbackCategories.find(c => c.label === label);
    return cat ? cat.icon : Gift;
  };

  const getCategoryColor = (label: string) => {
    const cat = cashbackCategories.find(c => c.label === label);
    return cat ? cat.color : "hsl(210,10%,50%)";
  };

  return (
    <div className="space-y-6 w-full">
      <div>
        <h1 className="text-xl font-bold text-foreground">{t("Бонусы и кэшбэк")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("Ваши бонусы, категории кэшбэка и история начислений")}</p>
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

      {/* Bonus info */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Star className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{t("Программа лояльности")}</p>
            <p className="text-xs text-muted-foreground">{t("Уровень: Стандарт")}</p>
          </div>
        </div>
        <div className="bg-secondary rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Прогресс до «Gold»</span>
            <span className="text-xs font-medium text-foreground">2 350 / 5 000 ₽</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: "47%" }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">
            Потратьте ещё 2 650 ₽ для повышения уровня
          </p>
        </div>
      </div>

      {/* History */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">
            {t("История начислений")}
            {selectedCategory && (
              <span className="text-muted-foreground font-normal ml-2">— {selectedCategory}</span>
            )}
          </h2>
          {selectedCategory && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedCategory(null)}>
              Все
            </Button>
          )}
        </div>
        <div className="space-y-1.5">
          {filteredHistory.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-4">Нет начислений</p>
          )}
          {filteredHistory.map((h) => {
            const Icon = getCategoryIcon(h.category);
            const color = getCategoryColor(h.category);
            return (
              <div
                key={h.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{h.title}</p>
                  <p className="text-xs text-muted-foreground">{h.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-primary">+{h.amount.toLocaleString("ru-RU", { minimumFractionDigits: 2 })} ₽</p>
                  <p className="text-[10px] text-muted-foreground">{h.date}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BonusesTab;
