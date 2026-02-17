import { Landmark, Check, X, Calculator, FileText, Clock, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

const creditProducts = [
  {
    name: "Микрокредит",
    rate: "от 9.9%",
    rateNum: 9.9,
    maxAmount: "до 100 000 ₽",
    maxTerm: "до 12 мес.",
    gradient: "from-cyan-400 to-blue-600",
    features: ["Без залога", "Быстрое одобрение", "Без справок о доходах"],
  },
  {
    name: "Потребительский",
    rate: "от 7.5%",
    rateNum: 7.5,
    maxAmount: "до 1 000 000 ₽",
    maxTerm: "до 60 мес.",
    gradient: "from-violet-500 to-purple-700",
    features: ["Фиксированная ставка", "Досрочное погашение", "Кредитные каникулы"],
  },
  {
    name: "Бизнес-кредит",
    rate: "от 6.0%",
    rateNum: 6.0,
    maxAmount: "до 10 000 000 ₽",
    maxTerm: "до 84 мес.",
    gradient: "from-pink-500 to-red-600",
    features: ["Для ИП и ООО", "Индивидуальный график", "Персональный менеджер", "Льготный период"],
  },
];

const CreditsTab = () => {
  const [amount, setAmount] = useState("500000");
  const [term, setTerm] = useState("24");
  const [selectedCredit, setSelectedCredit] = useState<typeof creditProducts[0] | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditTerm, setCreditTerm] = useState("");
  const [purpose, setPurpose] = useState("");

  const monthly = Math.round(Number(amount) / Number(term));

  const handleApply = (credit: typeof creditProducts[0]) => {
    setSelectedCredit(credit);
    setCreditAmount("");
    setCreditTerm("");
    setPurpose("");
  };

  const handleSubmit = () => {
    if (!selectedCredit) return;
    const sum = parseFloat(creditAmount.replace(/\s/g, ""));
    const months = parseInt(creditTerm);
    if (isNaN(sum) || sum <= 0 || isNaN(months) || months <= 0) {
      toast.error("Заполните все поля корректно");
      return;
    }
    const monthlyPayment = Math.round((sum + sum * (selectedCredit.rateNum / 100) * (months / 12)) / months);
    toast.success(`Заявка на кредит «${selectedCredit.name}» отправлена. Ежемесячный платёж: ~${monthlyPayment.toLocaleString("ru-RU")} ₽`);
    setSelectedCredit(null);
  };

  const calcMonthly = () => {
    if (!selectedCredit) return 0;
    const sum = parseFloat(creditAmount.replace(/\s/g, "")) || 0;
    const months = parseInt(creditTerm) || 1;
    return Math.round((sum + sum * (selectedCredit.rateNum / 100) * (months / 12)) / months);
  };

  const calcTotal = () => {
    if (!selectedCredit) return 0;
    const sum = parseFloat(creditAmount.replace(/\s/g, "")) || 0;
    const months = parseInt(creditTerm) || 1;
    return Math.round(sum + sum * (selectedCredit.rateNum / 100) * (months / 12));
  };

  return (
    <div>
      {/* Credit application dialog */}
      {selectedCredit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setSelectedCredit(null)}>
          <div className="bg-card border border-border rounded-2xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 fade-in duration-200" onClick={e => e.stopPropagation()}>
            <div className={`bg-gradient-to-r ${selectedCredit.gradient} p-6`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm">Оформление кредита</p>
                  <p className="text-white font-bold text-2xl">{selectedCredit.name}</p>
                </div>
                <button onClick={() => setSelectedCredit(null)} className="text-white/70 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <span className="text-white font-bold text-lg">{selectedCredit.rate}</span>
                <span className="text-white/80 text-sm">{selectedCredit.maxAmount}</span>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-muted-foreground text-xs mb-1.5 block">Желаемая сумма (₽)</label>
                <Input
                  placeholder="Введите сумму"
                  value={creditAmount}
                  onChange={e => setCreditAmount(e.target.value)}
                  className="bg-secondary border-border h-12 text-lg"
                  type="number"
                />
              </div>
              <div>
                <label className="text-muted-foreground text-xs mb-1.5 block">Срок (месяцев)</label>
                <Input
                  placeholder="Введите срок"
                  value={creditTerm}
                  onChange={e => setCreditTerm(e.target.value)}
                  className="bg-secondary border-border"
                  type="number"
                />
              </div>
              <div>
                <label className="text-muted-foreground text-xs mb-1.5 block">Цель кредита</label>
                <Input
                  placeholder="Например: ремонт, авто, бизнес"
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>

              {/* Payment preview */}
              {creditAmount && creditTerm && parseFloat(creditAmount) > 0 && parseInt(creditTerm) > 0 && (
                <div className="bg-secondary rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Сумма кредита</span>
                    <span className="text-foreground font-medium">{parseFloat(creditAmount).toLocaleString("ru-RU")} ₽</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ежемесячный платёж</span>
                    <span className="text-primary font-bold">~{calcMonthly().toLocaleString("ru-RU")} ₽</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between text-sm">
                    <span className="text-muted-foreground">Итого к возврату</span>
                    <span className="text-foreground font-semibold">{calcTotal().toLocaleString("ru-RU")} ₽</span>
                  </div>
                </div>
              )}

              <ul className="space-y-1.5">
                {selectedCredit.features.map((f, j) => (
                  <li key={j} className="text-muted-foreground text-sm flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-primary" /> {f}
                  </li>
                ))}
              </ul>

              <Button onClick={handleSubmit} className="w-full h-12 text-base font-semibold">
                <FileText className="w-4 h-4 mr-2" /> Отправить заявку
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-2">
        <Landmark className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Кредиты</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-6">Кредитные продукты на выгодных условиях</p>

      {/* Calculator */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <h3 className="text-foreground font-semibold mb-4 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-primary" /> Кредитный калькулятор
        </h3>
        <div className="flex flex-col md:flex-row items-end gap-4 md:gap-6">
          <div className="flex-1 w-full">
            <label className="text-muted-foreground text-xs mb-1 block">Сумма кредита (₽)</label>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-secondary border-border" />
          </div>
          <div className="flex-1 w-full">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {credit.maxTerm}</span>
              </div>
              <ul className="mt-3 space-y-1.5">
                {credit.features.map((f, j) => (
                  <li key={j} className="text-muted-foreground text-sm flex items-center gap-2">
                    <Check className="w-3 h-3 text-primary" /> {f}
                  </li>
                ))}
              </ul>
              <Button onClick={() => handleApply(credit)} className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
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
