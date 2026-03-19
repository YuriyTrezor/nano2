import { ArrowLeftRight, Globe, Copy, CheckCircle2, Building2, Info, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const requisites = [
  { label: "Банк получатель / Beneficiary Bank", value: "NeoBank International Ltd." },
  { label: "SWIFT/BIC код", value: "NEOBGE22XXX" },
  { label: "Банк-корреспондент / Correspondent Bank", value: "Deutsche Bank AG, Frankfurt" },
  { label: "SWIFT корреспондента", value: "DEUTDEFFXXX" },
  { label: "Корреспондентский счёт / Correspondent Account", value: "100 9541 280" },
  { label: "Наименование получателя / Beneficiary Name", value: "NeoBank Client Account" },
  { label: "IBAN / Account Number", value: "GE29NB0000000012345678" },
  { label: "Назначение платежа / Payment Purpose", value: "NeoBank" },
];

const currencies = [
  { code: "USD", name: "Доллар США", icon: "$" },
  { code: "EUR", name: "Евро", icon: "€" },
  { code: "GBP", name: "Фунт стерлингов", icon: "£" },
  { code: "CHF", name: "Швейцарский франк", icon: "₣" },
];

const SwiftDepositTab = () => {
  const { user } = useAuth();
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = (value: string, idx: number) => {
    navigator.clipboard.writeText(value);
    setCopiedIdx(idx);
    toast.success("Скопировано");
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleCopyAll = () => {
    const text = requisites.map(r => `${r.label}: ${r.value}`).join("\n");
    navigator.clipboard.writeText(text);
    toast.success("Все реквизиты скопированы");
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <Globe className="w-6 h-6 text-primary" />
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Пополнение через SWIFT</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-6">
        Пополните счёт международным банковским переводом
      </p>

      {/* Currencies */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {currencies.map(cur => (
          <div key={cur.code} className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2 text-primary font-bold text-lg">
              {cur.icon}
            </div>
            <p className="text-foreground font-semibold text-sm">{cur.code}</p>
            <p className="text-muted-foreground text-xs">{cur.name}</p>
          </div>
        ))}
      </div>

      {/* Requisites */}
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <h2 className="text-foreground font-bold text-lg">Реквизиты для перевода</h2>
          </div>
          <Button variant="outline" size="sm" onClick={handleCopyAll} className="gap-1.5 text-xs">
            <Copy className="w-3.5 h-3.5" /> Копировать все
          </Button>
        </div>

        <div className="space-y-0 divide-y divide-border">
          {requisites.map((req, idx) => (
            <div key={idx} className="flex items-start sm:items-center justify-between py-3 gap-2 group">
              <div className="min-w-0 flex-1">
                <p className="text-muted-foreground text-xs mb-0.5">{req.label}</p>
                <p className="text-foreground font-mono text-sm break-all">{req.value}</p>
              </div>
              <button
                onClick={() => handleCopy(req.value, idx)}
                className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                title="Копировать"
              >
                {copiedIdx === idx ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Important info */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-5 sm:p-6 mb-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="text-foreground font-semibold mb-2">Важная информация</h3>
            <ul className="text-muted-foreground text-sm space-y-2">
              <li>• В назначении платежа обязательно укажите ваш email: <span className="text-foreground font-medium">{user?.email || "ваш@email.com"}</span></li>
              <li>• Срок зачисления: <span className="text-foreground font-medium">1-3 рабочих дня</span></li>
              <li>• Минимальная сумма пополнения: <span className="text-foreground font-medium">$1000 / €1000 / £1000 / ₣1000</span></li>
              <li>• Комиссия за зачисление: <span className="text-foreground font-medium">0%</span></li>
              <li>• Конвертация в рубли по курсу ЦБ на дату зачисления</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Steps */}
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <ArrowLeftRight className="w-5 h-5 text-primary" />
          <h3 className="text-foreground font-bold">Как пополнить счёт</h3>
        </div>
        <div className="space-y-4">
          {[
            "Скопируйте реквизиты NeoBank, нажав кнопку «Копировать все»",
            "Откройте интернет-банк вашего текущего банка и создайте международный перевод (SWIFT)",
            "Вставьте скопированные реквизиты и укажите сумму пополнения",
            "В назначении платежа укажите ваш email в NeoBank для идентификации",
            "Подтвердите перевод. Средства поступят на ваш счёт в течение 1-3 рабочих дней",
          ].map((text, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                {i + 1}
              </div>
              <p className="text-muted-foreground text-sm pt-1">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-green-500" />
          <h3 className="text-foreground font-bold">Безопасность</h3>
        </div>
        <p className="text-muted-foreground text-sm">
          Все SWIFT-переводы защищены международными стандартами шифрования. NeoBank является участником сети SWIFT 
          и соответствует требованиям международного банковского регулирования. Ваши средства застрахованы и находятся 
          под защитой.
        </p>
      </div>
    </div>
  );
};

export default SwiftDepositTab;
