import { ArrowLeftRight, Globe, ShieldCheck, Clock, AlertTriangle, Building2 } from "lucide-react";
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
              {isEn ? "SWIFT Transfers" : "Переводы SWIFT"}
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
                ? "SWIFT (Society for Worldwide Interbank Financial Telecommunication) is a global messaging network used by over 11,000 banks and financial institutions in 200+ countries. It enables secure international money transfers between banks by transmitting standardized payment instructions."
                : "SWIFT (Society for Worldwide Interbank Financial Telecommunication) — это глобальная межбанковская система передачи информации и совершения платежей. Она объединяет более 11 000 финансовых организаций в 200+ странах мира и обеспечивает безопасную передачу платёжных поручений между банками."}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {isEn
                ? "SWIFT itself does not transfer money — it transmits secure messages between banks with instructions on how to move funds. Each bank in the network has a unique SWIFT/BIC code that identifies it during transactions."
                : "SWIFT сама по себе не переводит деньги — она передаёт защищённые сообщения между банками с инструкциями о перемещении средств. Каждый банк в сети имеет уникальный SWIFT/BIC код, который идентифицирует его при проведении операций."}
            </p>
          </div>

          {/* Sanctions context */}
          <div className="bg-gradient-to-br from-[hsl(35,80%,50%)]/10 to-[hsl(25,90%,40%)]/5 border border-[hsl(35,80%,50%)]/30 rounded-2xl p-6 md:p-8 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-[hsl(35,80%,50%)]" />
              <h2 className="text-xl font-bold text-foreground">
                {isEn ? "SWIFT and Russian Sanctions" : "SWIFT и санкции против РФ"}
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {isEn
                ? "Since 2022, a number of major Russian banks have been disconnected from the SWIFT network as part of international sanctions imposed by the EU, USA, and their allies. This has significantly limited the ability of Russian residents and businesses to make international transfers through traditional channels."
                : "С 2022 года ряд крупнейших российских банков был отключён от сети SWIFT в рамках международных санкций, введённых ЕС, США и их союзниками. Это существенно ограничило возможности российских резидентов и бизнеса совершать международные переводы через традиционные каналы."}
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {isEn
                ? "Disconnected banks cannot send or receive international transfers via SWIFT, which affects both personal and corporate payments — from paying for goods abroad to receiving salaries from foreign companies."
                : "Отключённые банки не могут отправлять и получать международные переводы через SWIFT, что затрагивает как личные, так и корпоративные платежи — от оплаты товаров за рубежом до получения зарплат от иностранных компаний."}
            </p>
          </div>

          {/* NeoBank solution */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 rounded-2xl p-6 md:p-8 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                {isEn ? "NeoBank — Your Access to SWIFT" : "NeoBank — Ваш доступ к SWIFT"}
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {isEn
                ? "NeoBank provides full SWIFT transfer capabilities for its clients. As a bank registered outside the jurisdiction of sanctions, NeoBank maintains uninterrupted access to the SWIFT network and offers international transfers in USD, EUR, GBP, CHF and other currencies."
                : "NeoBank предоставляет своим клиентам полноценный доступ к SWIFT-переводам. Будучи банком, зарегистрированным вне юрисдикции санкций, NeoBank сохраняет бесперебойный доступ к сети SWIFT и предлагает международные переводы в USD, EUR, GBP, CHF и других валютах."}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {isEn
                ? "We issue international Visa and Mastercard cards with full SWIFT support — allowing you to send and receive funds worldwide without restrictions, blocks, or delays."
                : "Мы выпускаем международные карты Visa и Mastercard с полной поддержкой SWIFT — позволяя вам отправлять и получать средства по всему миру без ограничений, блокировок и задержек."}
            </p>
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
              <Globe className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="text-foreground font-semibold mb-2">
                {isEn ? "No Restrictions" : "Без ограничений"}
              </h3>
              <p className="text-muted-foreground text-sm">
                {isEn
                  ? "Full access to international transfers regardless of sanctions"
                  : "Полный доступ к международным переводам вне зависимости от санкций"}
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
