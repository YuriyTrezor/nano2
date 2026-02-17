import { ShieldCheck, Upload, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

const steps = [
  { label: "Личные данные", description: "ФИО и дата рождения" },
  { label: "Документ", description: "Паспорт или ID-карта" },
  { label: "Селфи", description: "Фото с документом" },
];

const VerificationTab = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!fullName.trim() || !birthDate.trim() || !docNumber.trim()) {
      toast.error("Заполните все поля");
      return;
    }
    setSubmitted(true);
    toast.success("Заявка на верификацию отправлена. Ожидайте проверки.");
  };

  if (submitted) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Верификация</h1>
        </div>
        <div className="bg-card border border-border rounded-2xl p-8 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-foreground font-bold text-xl mb-2">Заявка отправлена</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Ваши данные находятся на проверке. Это может занять до 24 часов. Мы уведомим вас о результате.
          </p>
          <div className="flex items-center gap-2 justify-center text-muted-foreground text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>Среднее время проверки: 2-4 часа</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <ShieldCheck className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Верификация</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-6">Подтвердите вашу личность для полного доступа к услугам</p>

      {/* Progress steps */}
      <div className="flex items-center gap-2 mb-8 max-w-lg">
        {steps.map((step, i) => (
          <div key={i} className="flex-1">
            <div className={`h-1.5 rounded-full mb-2 ${i <= currentStep ? "bg-primary" : "bg-secondary"}`} />
            <p className={`text-xs font-medium ${i <= currentStep ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</p>
            <p className="text-[10px] text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="max-w-lg space-y-6">
        {/* Step 1: Personal data */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-foreground font-semibold mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">1</span>
            Личные данные
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-muted-foreground text-xs mb-1 block">ФИО полностью</label>
              <Input
                placeholder="Иванов Иван Иванович"
                value={fullName}
                onChange={e => { setFullName(e.target.value); if (currentStep < 1) setCurrentStep(1); }}
                className="bg-secondary border-border"
              />
            </div>
            <div>
              <label className="text-muted-foreground text-xs mb-1 block">Дата рождения</label>
              <Input
                placeholder="01.01.1990"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Document */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-foreground font-semibold mb-4 flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold ${currentStep >= 1 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>2</span>
            Документ, удостоверяющий личность
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-muted-foreground text-xs mb-1 block">Серия и номер паспорта</label>
              <Input
                placeholder="0000 000000"
                value={docNumber}
                onChange={e => { setDocNumber(e.target.value); if (currentStep < 2) setCurrentStep(2); }}
                className="bg-secondary border-border"
              />
            </div>
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Загрузите фото документа</p>
              <p className="text-muted-foreground text-xs mt-1">JPG, PNG до 10 МБ</p>
            </div>
          </div>
        </div>

        {/* Step 3: Selfie */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-foreground font-semibold mb-4 flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold ${currentStep >= 2 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>3</span>
            Селфи с документом
          </h3>
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
            <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">Загрузите селфи с раскрытым документом</p>
            <p className="text-muted-foreground text-xs mt-1">Лицо и данные документа должны быть чётко видны</p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-muted-foreground text-xs">
            Ваши данные защищены и обрабатываются в соответствии с ФЗ-152 «О персональных данных». Мы не передаём информацию третьим лицам.
          </p>
        </div>

        <Button onClick={handleSubmit} className="w-full h-12 text-base font-semibold">
          Отправить на проверку
        </Button>
      </div>
    </div>
  );
};

export default VerificationTab;
