import { Landmark, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const creditProducts = [
  {
    name: "Микрокредит",
    rate: "от 9.9%",
    maxAmount: "до 100 000 ₽",
    maxTerm: "до 12 мес.",
    gradient: "from-cyan-400 to-blue-600",
    features: ["Без залога", "Быстрое одобрение", "Без справок о доходах"],
  },
  {
    name: "Потребительский",
    rate: "от 7.5%",
    maxAmount: "до 1 000 000 ₽",
    maxTerm: "до 60 мес.",
    gradient: "from-violet-500 to-purple-700",
    features: ["Фиксированная ставка", "Досрочное погашение", "Кредитные каникулы"],
  },
  {
    name: "Бизнес-кредит",
    rate: "от 6.0%",
    maxAmount: "до 10 000 000 ₽",
    maxTerm: "до 84 мес.",
    gradient: "from-pink-500 to-red-600",
    features: ["Для ИП и ООО", "Индивидуальный график", "Персональный менеджер", "Льготный период"],
  },
];

const CreditsTab = () => {
  const [amount, setAmount] = useState("500000");
  const [term, setTerm] = useState("24");

  const monthly = Math.round(Number(amount) / Number(term));

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <Landmark className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Кредиты</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-6">Кредитные продукты на выгодных условиях</p>

      {/* Calculator */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <h3 className="text-foreground font-semibold mb-4 flex items-center gap-2">
          <span className="text-primary">%</span> Кредитный калькулятор
        </h3>
        <div className="flex items-end gap-6">
          <div className="flex-1">
            <label className="text-muted-foreground text-xs mb-1 block">Сумма кредита (₽)</label>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-secondary border-border" />
          </div>
          <div className="flex-1">
            <label className="text-muted-foreground text-xs mb-1 block">Срок (месяцев)</label>
            <Input value={term} onChange={(e) => setTerm(e.target.value)} className="bg-secondary border-border" />
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs">Ежемесячный платёж</p>
            <p className="text-primary font-bold text-2xl">{monthly.toLocaleString("ru-RU")} ₽</p>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="grid grid-cols-3 gap-4">
        {creditProducts.map((credit, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className={`bg-gradient-to-r ${credit.gradient} p-6 text-center`}>
              <p className="text-white font-bold text-3xl">{credit.rate}</p>
              <p className="text-white/70 text-sm">годовых</p>
            </div>
            <div className="p-5">
              <h3 className="text-foreground font-bold text-lg">{credit.name}</h3>
              <div className="flex items-center gap-3 mt-2 text-muted-foreground text-sm">
                <span>{credit.maxAmount}</span>
                <span>📅 {credit.maxTerm}</span>
              </div>
              <ul className="mt-3 space-y-1.5">
                {credit.features.map((f, j) => (
                  <li key={j} className="text-muted-foreground text-sm flex items-center gap-2">
                    <Check className="w-3 h-3 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
                Оформить заявку
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreditsTab;
