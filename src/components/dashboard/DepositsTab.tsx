import { PiggyBank, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const deposits = [
  {
    name: "Стабильный",
    rate: "12%",
    duration: "6 месяцев",
    minAmount: "от 10 000 ₽",
    gradient: "from-emerald-500 to-teal-600",
    icon: <PiggyBank className="w-6 h-6 text-white" />,
    features: ["Фиксированная ставка", "Ежемесячные выплаты", "Досрочное снятие"],
  },
  {
    name: "Накопительный",
    rate: "15%",
    duration: "12 месяцев",
    minAmount: "от 50 000 ₽",
    gradient: "from-blue-500 to-indigo-600",
    icon: <TrendingUp className="w-6 h-6 text-white" />,
    features: ["Повышенная ставка", "Капитализация процентов", "Пополнение без ограничений"],
  },
  {
    name: "Премиум",
    rate: "18%",
    duration: "24 месяца",
    minAmount: "от 500 000 ₽",
    gradient: "from-orange-500 to-red-500",
    icon: <PiggyBank className="w-6 h-6 text-white" />,
    features: ["Максимальная доходность", "Персональный менеджер", "Страхование вклада", "Бонус при открытии"],
  },
];

const DepositsTab = () => {
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <PiggyBank className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Вклады</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-6">Выгодные условия для ваших накоплений</p>

      <div className="grid grid-cols-3 gap-4">
        {deposits.map((dep, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className={`bg-gradient-to-r ${dep.gradient} p-6 text-center`}>
              <div className="flex justify-center mb-2">{dep.icon}</div>
              <p className="text-white font-bold text-4xl">{dep.rate}</p>
              <p className="text-white/70 text-sm">годовых</p>
            </div>
            <div className="p-5">
              <h3 className="text-foreground font-bold text-lg">{dep.name}</h3>
              <div className="flex items-center gap-3 mt-2 text-muted-foreground text-sm">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {dep.duration}</span>
                <span>{dep.minAmount}</span>
              </div>
              <ul className="mt-3 space-y-1.5">
                {dep.features.map((f, j) => (
                  <li key={j} className="text-muted-foreground text-sm flex items-center gap-2">
                    <span className="text-primary">•</span> {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
                Открыть вклад
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DepositsTab;
