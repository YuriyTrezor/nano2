import { ArrowLeftRight, Globe, ShieldCheck, Clock, Building, FileText } from "lucide-react";
import Navbar from "@/components/Navbar";
import FloatingChat from "@/components/FloatingChat";
import { useLanguage } from "@/contexts/LanguageContext";

const Swift = () => {
  const { lang } = useLanguage();
  const isEn = lang === "en";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <ArrowLeftRight className="w-7 h-7 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {isEn ? "SWIFT Details" : "SWIFT реквизиты"}
            </h1>
          </div>
          <p className="text-muted-foreground mb-10">
            {isEn
              ? "International bank transfers via SWIFT network"
              : "Международные банковские переводы через сеть SWIFT"}
          </p>

          {/* What is SWIFT */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                {isEn ? "What is SWIFT?" : "Что такое SWIFT?"}
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {isEn
                ? "SWIFT (Society for Worldwide Interbank Financial Telecommunication) is a global messaging network used by banks and financial institutions to securely transmit information and instructions through a standardized system of codes. It enables international money transfers between banks in different countries."
                : "SWIFT (Society for Worldwide Interbank Financial Telecommunication) — это глобальная межбанковская система передачи информации и совершения платежей. Она объединяет более 11 000 финансовых организаций в 200+ странах мира и обеспечивает безопасную передачу платёжных поручений между банками."}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {isEn
                ? "NeoBank provides full SWIFT transfer capabilities, allowing you to send and receive funds internationally with competitive rates and reliable processing times."
                : "NeoBank предоставляет полный функционал SWIFT-переводов, позволяя отправлять и получать средства по всему миру с конкурентными курсами и надёжными сроками обработки."}
            </p>
          </div>

          {/* Bank details */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <Building className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                {isEn ? "Bank Details" : "Банковские реквизиты"}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: isEn ? "Bank Name" : "Наименование банка", value: "NeoBank International Ltd." },
                { label: "SWIFT/BIC", value: "NEOBGE22XXX" },
                { label: isEn ? "Correspondent Bank" : "Банк-корреспондент", value: "Deutsche Bank AG, Frankfurt" },
                { label: isEn ? "Correspondent SWIFT" : "SWIFT корреспондента", value: "DEUTDEFF" },
                { label: "IBAN", value: "GE29NB0000000012345678" },
                { label: isEn ? "Registration Country" : "Страна регистрации", value: isEn ? "Georgia" : "Грузия" },
                { label: isEn ? "Address" : "Адрес", value: "26 Chavchavadze Ave, Tbilisi 0179, Georgia" },
                { label: isEn ? "Currency" : "Валюта", value: "USD, EUR, GBP, CHF, RUB" },
              ].map(item => (
                <div key={item.label} className="p-4 bg-secondary rounded-xl">
                  <p className="text-muted-foreground text-xs mb-1">{item.label}</p>
                  <p className="text-foreground font-medium text-sm font-mono">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              <ShieldCheck className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="text-foreground font-semibold mb-2">
                {isEn ? "Secure Transfers" : "Безопасные переводы"}
              </h3>
              <p className="text-muted-foreground text-sm">
                {isEn
                  ? "All transfers are protected by multi-level encryption and verification"
                  : "Все переводы защищены многоуровневым шифрованием и верификацией"}
              </p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              <Clock className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="text-foreground font-semibold mb-2">
                {isEn ? "Processing Time" : "Сроки обработки"}
              </h3>
              <p className="text-muted-foreground text-sm">
                {isEn
                  ? "1-3 business days for international transfers depending on destination"
                  : "1-3 рабочих дня для международных переводов в зависимости от направления"}
              </p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              <FileText className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="text-foreground font-semibold mb-2">
                {isEn ? "No Hidden Fees" : "Без скрытых комиссий"}
              </h3>
              <p className="text-muted-foreground text-sm">
                {isEn
                  ? "Transparent fee structure with competitive exchange rates"
                  : "Прозрачная структура комиссий с конкурентными обменными курсами"}
              </p>
            </div>
          </div>

          {/* How to use */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {isEn ? "How to Make a SWIFT Transfer" : "Как сделать SWIFT-перевод"}
            </h2>
            <div className="space-y-4">
              {(isEn ? [
                { step: "1", text: "Log in to your NeoBank account and go to the Transfers section" },
                { step: "2", text: "Select 'International Transfer (SWIFT)' and enter the recipient's bank details" },
                { step: "3", text: "Specify the amount, currency, and purpose of payment" },
                { step: "4", text: "Verify the details and confirm the transfer. Funds will be sent within 1-3 business days" },
              ] : [
                { step: "1", text: "Войдите в личный кабинет NeoBank и перейдите в раздел «Переводы»" },
                { step: "2", text: "Выберите «Международный перевод (SWIFT)» и введите реквизиты получателя" },
                { step: "3", text: "Укажите сумму, валюту и назначение платежа" },
                { step: "4", text: "Проверьте данные и подтвердите перевод. Средства будут отправлены в течение 1-3 рабочих дней" },
              ]).map(item => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {item.step}
                  </div>
                  <p className="text-muted-foreground text-sm pt-1.5">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <FloatingChat />
    </div>
  );
};

export default Swift;
