import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Phone, Flame, Wifi, Tv, Zap, FileText, Plus, Clock, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const paymentCategories = [
  { icon: Phone, label: "Мобильная связь", labelEn: "Mobile", color: "hsl(210,70%,50%)" },
  { icon: Flame, label: "ЖКХ", labelEn: "Utilities", color: "hsl(15,80%,50%)" },
  { icon: Wifi, label: "Интернет", labelEn: "Internet", color: "hsl(195,80%,45%)" },
  { icon: Tv, label: "Телевидение", labelEn: "Television", color: "hsl(270,60%,50%)" },
  { icon: Zap, label: "Электричество", labelEn: "Electricity", color: "hsl(45,90%,50%)" },
  { icon: FileText, label: "Налоги и штрафы", labelEn: "Taxes & Fines", color: "hsl(0,60%,50%)" },
];

interface AutoPayment {
  id: string;
  category: string;
  account: string;
  amount: string;
  active: boolean;
  nextDate: string;
}

const mockAutoPayments: AutoPayment[] = [
  { id: "1", category: "Мобильная связь", account: "+7 (999) 123-45-67", amount: "500", active: true, nextDate: "25.03.2026" },
  { id: "2", category: "Интернет", account: "Договор №847291", amount: "890", active: true, nextDate: "01.04.2026" },
  { id: "3", category: "ЖКХ", account: "ЛС 4820193756", amount: "6 240", active: false, nextDate: "05.04.2026" },
];

const PaymentsTab = () => {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [autoPayments, setAutoPayments] = useState<AutoPayment[]>(mockAutoPayments);
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");

  const handlePay = () => {
    if (!account || !amount) {
      toast.error("Заполните все поля");
      return;
    }
    toast.success(`Платёж ${amount} ₽ успешно проведён`);
    setSelectedCategory(null);
    setAccount("");
    setAmount("");
  };

  const toggleAuto = (id: string) => {
    setAutoPayments(prev =>
      prev.map(ap => ap.id === id ? { ...ap, active: !ap.active } : ap)
    );
    toast.success("Статус автоплатежа обновлён");
  };

  const deleteAuto = (id: string) => {
    setAutoPayments(prev => prev.filter(ap => ap.id !== id));
    toast.success("Автоплатёж удалён");
  };

  const getCategoryIcon = (label: string) => {
    const cat = paymentCategories.find(c => c.label === label);
    return cat ? cat.icon : FileText;
  };

  const getCategoryColor = (label: string) => {
    const cat = paymentCategories.find(c => c.label === label);
    return cat ? cat.color : "hsl(210,10%,50%)";
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">{t("Платежи и автоплатежи")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("Оплата услуг и управление автоплатежами")}</p>
      </div>

      {/* Payment categories */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">{t("Оплата услуг")}</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {paymentCategories.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setSelectedCategory(selectedCategory === cat.label ? null : cat.label)}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200 active:scale-[0.97] ${
                selectedCategory === cat.label
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30"
              }`}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${cat.color}20` }}
              >
                <cat.icon className="w-5 h-5" style={{ color: cat.color }} />
              </div>
              <span className="text-[11px] font-medium text-center leading-tight">{t(cat.label)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Payment form */}
      {selectedCategory && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-200">
          <h3 className="text-sm font-semibold text-foreground">{t(selectedCategory)}</h3>
          <Input
            placeholder={t("Номер счёта / договора / телефон")}
            value={account}
            onChange={e => setAccount(e.target.value)}
            className="bg-secondary border-border"
          />
          <Input
            placeholder={t("Сумма, ₽")}
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="bg-secondary border-border"
          />
          <div className="flex gap-2">
            <Button onClick={handlePay} className="flex-1">
              {t("Оплатить")}
            </Button>
            <Button variant="outline" onClick={() => setSelectedCategory(null)}>
              {t("Отмена")}
            </Button>
          </div>
        </div>
      )}

      {/* Auto payments */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground">{t("Автоплатежи")}</h2>
          <Button variant="outline" size="sm" className="text-xs gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            {t("Добавить")}
          </Button>
        </div>

        <div className="space-y-2">
          {autoPayments.map((ap) => {
            const Icon = getCategoryIcon(ap.category);
            const color = getCategoryColor(ap.category);
            return (
              <div
                key={ap.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  ap.active ? "bg-card border-border" : "bg-muted/30 border-border/50 opacity-60"
                }`}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{ap.category}</p>
                  <p className="text-xs text-muted-foreground truncate">{ap.account}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-foreground">{ap.amount} ₽</p>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px]">{ap.nextDate}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleAuto(ap.id)}
                    className="p-1 rounded-md hover:bg-secondary transition-colors"
                    title={ap.active ? "Отключить" : "Включить"}
                  >
                    {ap.active ? (
                      <ToggleRight className="w-5 h-5 text-primary" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteAuto(ap.id)}
                    className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PaymentsTab;
