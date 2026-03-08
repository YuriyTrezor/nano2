import { PiggyBank, Clock, TrendingUp, X, Check, Percent, Calendar, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

const deposits = [
  {
    name: "Стабильный",
    rate: "12%",
    rateNum: 12,
    duration: "6 месяцев",
    durationMonths: 6,
    minAmount: "от 10 000 ₽",
    minAmountNum: 10000,
    gradient: "from-emerald-500 to-teal-600",
    icon: <PiggyBank className="w-6 h-6 text-white" />,
    features: ["Фиксированная ставка", "Ежемесячные выплаты", "Досрочное снятие"],
  },
  {
    name: "Накопительный",
    rate: "15%",
    rateNum: 15,
    duration: "12 месяцев",
    durationMonths: 12,
    minAmount: "от 50 000 ₽",
    minAmountNum: 50000,
    gradient: "from-blue-500 to-indigo-600",
    icon: <TrendingUp className="w-6 h-6 text-white" />,
    features: ["Повышенная ставка", "Капитализация процентов", "Пополнение без ограничений"],
  },
  {
    name: "Премиум",
    rate: "18%",
    rateNum: 18,
    duration: "24 месяца",
    durationMonths: 24,
    minAmount: "от 500 000 ₽",
    minAmountNum: 500000,
    gradient: "from-orange-500 to-red-500",
    icon: <PiggyBank className="w-6 h-6 text-white" />,
    features: ["Максимальная доходность", "Персональный менеджер", "Страхование вклада", "Бонус при открытии"],
  },
];

const DepositsTab = () => {
  const [selectedDeposit, setSelectedDeposit] = useState<typeof deposits[0] | null>(null);
  const [depositAmount, setDepositAmount] = useState("");

  const handleOpen = (dep: typeof deposits[0]) => {
    setSelectedDeposit(dep);
    setDepositAmount("");
  };

  const handleSubmit = () => {
    if (!selectedDeposit) return;
    const sum = parseFloat(depositAmount.replace(/\s/g, ""));
    if (isNaN(sum) || sum < selectedDeposit.minAmountNum) {
      toast.error(`Минимальная сумма: ${selectedDeposit.minAmountNum.toLocaleString("ru-RU")} ₽`);
      return;
    }
    const profit = Math.round(sum * (selectedDeposit.rateNum / 100) * (selectedDeposit.durationMonths / 12));
    toast.success(`Заявка на вклад «${selectedDeposit.name}» отправлена. Ожидаемый доход: ${profit.toLocaleString("ru-RU")} ₽`);
    setSelectedDeposit(null);
  };

  const calcProfit = () => {
    if (!selectedDeposit) return 0;
    const sum = parseFloat(depositAmount.replace(/\s/g, "")) || 0;
    return Math.round(sum * (selectedDeposit.rateNum / 100) * (selectedDeposit.durationMonths / 12));
  };

  return (
    <div>
      {/* Deposit dialog */}
      {selectedDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setSelectedDeposit(null)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 fade-in duration-200" onClick={e => e.stopPropagation()}>
            {/* Header with gradient */}
            <div className={`bg-gradient-to-r ${selectedDeposit.gradient} p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm">Вклад</p>
                  <p className="text-white font-bold text-2xl">{selectedDeposit.name}</p>
                </div>
                <button onClick={() => setSelectedDeposit(null)} className="text-white/70 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-white/70" />
                  <span className="text-white font-bold text-lg">{selectedDeposit.rate}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-white/70" />
                  <span className="text-white/90 text-sm">{selectedDeposit.duration}</span>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-muted-foreground text-xs mb-1.5 block">Сумма вклада (₽)</label>
                <Input
                  placeholder={`Минимум ${selectedDeposit.minAmountNum.toLocaleString("ru-RU")}`}
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  className="bg-secondary border-border h-12 text-lg"
                  type="number"
                />
              </div>

              {/* Calculator preview */}
              {depositAmount && parseFloat(depositAmount) > 0 && (
                <div className="bg-secondary rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Сумма вклада</span>
                    <span className="text-foreground font-medium">{parseFloat(depositAmount).toLocaleString("ru-RU")} ₽</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Срок</span>
                    <span className="text-foreground font-medium">{selectedDeposit.duration}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ставка</span>
                    <span className="text-foreground font-medium">{selectedDeposit.rate} годовых</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between text-sm">
                    <span className="text-muted-foreground font-semibold">Доход</span>
                    <span className="text-primary font-bold text-lg">+{calcProfit().toLocaleString("ru-RU")} ₽</span>
                  </div>
                </div>
              )}

              <ul className="space-y-1.5">
                {selectedDeposit.features.map((f, j) => (
                  <li key={j} className="text-muted-foreground text-sm flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary" /> {f}
                  </li>
                ))}
              </ul>

              <Button onClick={handleSubmit} className="w-full h-12 text-base font-semibold">
                <Wallet className="w-4 h-4 mr-2" /> Открыть вклад
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-2">
        <PiggyBank className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Вклады</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-6">Выгодные условия для ваших накоплений</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {deposits.map((dep, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
            <div className={`bg-gradient-to-r ${dep.gradient} p-6 text-center`}>
              <div className="flex justify-center mb-2">{dep.icon}</div>
              <p className="text-white font-bold text-4xl">{dep.rate}</p>
              <p className="text-white/70 text-sm">годовых</p>
            </div>
            <div className="p-5 flex flex-col flex-1">
              <h3 className="text-foreground font-bold text-lg">{dep.name}</h3>
              <div className="flex items-center gap-3 mt-2 text-muted-foreground text-sm">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {dep.duration}</span>
                <span>{dep.minAmount}</span>
              </div>
              <ul className="mt-3 space-y-1.5 flex-1">
                {dep.features.map((f, j) => (
                  <li key={j} className="text-muted-foreground text-sm flex items-center gap-2">
                    <span className="text-primary">•</span> {f}
                  </li>
                ))}
              </ul>
              <Button onClick={() => handleOpen(dep)} className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
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
