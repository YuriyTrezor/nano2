import { Building2, Shield, Globe, Users, TrendingUp, Award, Landmark, BadgeCheck, Clock, Headphones, CreditCard, Banknote, FileCheck, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import FloatingChat from "@/components/FloatingChat";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import licenseEuBanking from "@/assets/license-eu-banking.png";
import licenseAml from "@/assets/license-aml-compliance.png";
import licenseGdpr from "@/assets/license-gdpr.png";
import licensePci from "@/assets/license-pci-dss.png";

const About = () => {
  const { lang } = useLanguage();
  const isEn = lang === "en";
  const [selectedLicense, setSelectedLicense] = useState<string | null>(null);

  const licenses = [
    {
      image: licenseEuBanking,
      title: isEn ? "EU Banking License" : "Банковская лицензия ЕС",
      number: "EBA/GL/2022/04817",
      issuer: isEn ? "European Banking Authority" : "Европейское банковское управление",
    },
    {
      image: licenseAml,
      title: isEn ? "AML/KYC Compliance" : "Сертификат AML/KYC",
      number: "FATF/CC/2023/09284",
      issuer: isEn ? "Financial Action Task Force" : "FATF — Группа разработки финансовых мер",
    },
    {
      image: licenseGdpr,
      title: isEn ? "GDPR Compliance" : "Сертификат GDPR",
      number: "EDPB/DPC/2023/15692",
      issuer: isEn ? "European Data Protection Board" : "Европейский совет по защите данных",
    },
    {
      image: licensePci,
      title: isEn ? "PCI DSS Level 1" : "PCI DSS Уровень 1",
      number: "PCI-DSS/L1/2024/03471",
      issuer: isEn ? "PCI Security Standards Council" : "Совет по стандартам безопасности PCI",
    },
  ];

  const timeline = isEn ? [
    { year: "2022", title: "Foundation", desc: "NeoBank was founded with a mission to provide accessible international banking services to clients worldwide, free from geographic restrictions." },
    { year: "2023", title: "International Expansion", desc: "Launch of Visa and Mastercard issuance. Connection to the SWIFT network. Over 5,000 clients served across 30+ countries." },
    { year: "2024", title: "Digital Innovation", desc: "Introduction of USDT payments, multi-currency accounts, and an advanced online banking platform with 24/7 support." },
    { year: "2025", title: "Premium Services", desc: "Launch of the Diamond tier with personal concierge service, auto-bridge technology for safe withdrawals, and enhanced cashback programs." },
    { year: "2026", title: "Today", desc: "NeoBank serves clients in 50+ countries, offering a full range of international banking products with competitive rates and no hidden fees." },
  ] : [
    { year: "2022", title: "Основание", desc: "NeoBank был основан с миссией предоставления доступных международных банковских услуг клиентам по всему миру, свободных от географических ограничений." },
    { year: "2023", title: "Международная экспансия", desc: "Запуск выпуска карт Visa и Mastercard. Подключение к сети SWIFT. Более 5 000 обслуженных клиентов в 30+ странах." },
    { year: "2024", title: "Цифровые инновации", desc: "Внедрение оплаты в USDT, мультивалютных счетов и современной платформы онлайн-банкинга с поддержкой 24/7." },
    { year: "2025", title: "Премиум-сервис", desc: "Запуск уровня Diamond с персональным консьержем, технологией автоопределения мостов для безопасного вывода и расширенными программами кэшбэка." },
    { year: "2026", title: "Сегодня", desc: "NeoBank обслуживает клиентов в 50+ странах, предлагая полный спектр международных банковских продуктов с конкурентными ставками и без скрытых комиссий." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Building2 className="w-7 h-7 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {isEn ? "About NeoBank" : "О банке"}
            </h1>
          </div>
          <p className="text-muted-foreground mb-10 text-center">
            {isEn ? "Our mission, history and values" : "Наша миссия, история и ценности"}
          </p>

          {/* Mission */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/30 rounded-2xl p-6 md:p-8 mb-6 text-center">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {isEn ? "Our Mission" : "Наша миссия"}
            </h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              {isEn
                ? "NeoBank was created to give people access to modern international financial services — regardless of their location, citizenship, or geopolitical situation. We believe that banking should be simple, transparent, and accessible to everyone."
                : "NeoBank создан, чтобы дать людям доступ к современным международным финансовым сервисам — вне зависимости от их местоположения, гражданства и геополитической ситуации. Мы верим, что банкинг должен быть простым, прозрачным и доступным для каждого."}
            </p>
          </div>

          {/* Who we are */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Landmark className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                {isEn ? "Who We Are" : "Кто мы"}
              </h2>
            </div>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                {isEn
                  ? "NeoBank is a licensed international financial institution operating under European regulatory frameworks. We combine the reliability of traditional banking with the speed and convenience of modern fintech solutions."
                  : "NeoBank — лицензированное международное финансовое учреждение, работающее в соответствии с европейскими регуляторными стандартами. Мы сочетаем надёжность традиционного банкинга со скоростью и удобством современных финтех-решений."}
              </p>
              <p>
                {isEn
                  ? "Our team consists of over 120 professionals with experience at leading European and American banks. We have offices in Zurich, London, Moscow, and Saint Petersburg, providing 24/7 support to clients across all time zones."
                  : "Наша команда насчитывает более 120 профессионалов с опытом работы в ведущих европейских и американских банках. Наши офисы расположены в Цюрихе, Лондоне, Москве и Санкт-Петербурге, обеспечивая круглосуточную поддержку клиентов во всех часовых поясах."}
              </p>
              <p>
                {isEn
                  ? "We specialize in serving international clients who need reliable cross-border financial solutions: entrepreneurs, freelancers, investors, and families living in multiple countries."
                  : "Мы специализируемся на обслуживании международных клиентов, которым нужны надёжные трансграничные финансовые решения: предприниматели, фрилансеры, инвесторы и семьи, проживающие в нескольких странах."}
              </p>
            </div>
          </div>

          {/* Key values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="text-foreground font-semibold mb-2">
                {isEn ? "Security" : "Безопасность"}
              </h3>
              <p className="text-muted-foreground text-sm">
                {isEn
                  ? "Multi-level encryption, fraud protection, and secure data storage"
                  : "Многоуровневое шифрование, защита от мошенничества и безопасное хранение данных"}
              </p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              <Globe className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="text-foreground font-semibold mb-2">
                {isEn ? "Global Access" : "Глобальный доступ"}
              </h3>
              <p className="text-muted-foreground text-sm">
                {isEn
                  ? "Clients in 50+ countries, SWIFT transfers worldwide, multi-currency accounts"
                  : "Клиенты в 50+ странах, SWIFT-переводы по всему миру, мультивалютные счета"}
              </p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 text-center">
              <Users className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="text-foreground font-semibold mb-2">
                {isEn ? "Client Focus" : "Клиентоориентированность"}
              </h3>
              <p className="text-muted-foreground text-sm">
                {isEn
                  ? "Personal managers, 24/7 support, and individual approach to every client"
                  : "Персональные менеджеры, поддержка 24/7 и индивидуальный подход к каждому клиенту"}
              </p>
            </div>
          </div>

          {/* What we offer */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <BadgeCheck className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                {isEn ? "What We Offer" : "Наши услуги"}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(isEn ? [
                { icon: CreditCard, title: "International Cards", desc: "Visa and Mastercard in 4 tiers — White, Silver, Gold and Diamond. Accepted worldwide with cashback up to 7%." },
                { icon: Banknote, title: "Multi-Currency Accounts", desc: "Hold, send and receive in EUR, USD, GBP, CHF and 15+ other currencies with competitive exchange rates." },
                { icon: Globe, title: "SWIFT Transfers", desc: "Fast and secure international wire transfers to any bank in the world, with transparent fees and real-time tracking." },
                { icon: Shield, title: "Crypto Integration", desc: "Accept and send USDT payments, with seamless conversion to fiat currencies and auto-bridge for secure withdrawals." },
                { icon: Headphones, title: "24/7 Support", desc: "Dedicated personal manager for premium clients. Multi-language support available around the clock." },
                { icon: Clock, title: "Instant Onboarding", desc: "Open an account in minutes with digital verification. No branch visits required, fully remote process." },
              ] : [
                { icon: CreditCard, title: "Международные карты", desc: "Visa и Mastercard в 4 уровнях — White, Silver, Gold и Diamond. Принимаются по всему миру с кэшбэком до 7%." },
                { icon: Banknote, title: "Мультивалютные счета", desc: "Храните, отправляйте и получайте в EUR, USD, GBP, CHF и ещё 15+ валютах с конкурентными курсами обмена." },
                { icon: Globe, title: "SWIFT-переводы", desc: "Быстрые и безопасные международные переводы в любой банк мира с прозрачными комиссиями и отслеживанием в реальном времени." },
                { icon: Shield, title: "Крипто-интеграция", desc: "Приём и отправка USDT-платежей с бесшовной конвертацией в фиатные валюты и технологией auto-bridge для безопасного вывода." },
                { icon: Headphones, title: "Поддержка 24/7", desc: "Выделенный персональный менеджер для премиальных клиентов. Многоязычная поддержка доступна круглосуточно." },
                { icon: Clock, title: "Мгновенное подключение", desc: "Откройте счёт за считанные минуты с цифровой верификацией. Без визитов в офис, полностью удалённый процесс." },
              ]).map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-secondary/50">
                  <item.icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-foreground font-semibold text-sm mb-1">{item.title}</h4>
                    <p className="text-muted-foreground text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Regulatory */}
          <div className="bg-gradient-to-br from-primary/5 to-transparent border border-border rounded-2xl p-6 md:p-8 mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                {isEn ? "Regulation & Compliance" : "Регулирование и комплаенс"}
              </h2>
            </div>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                {isEn
                  ? "NeoBank operates under strict regulatory oversight. We are fully compliant with European Anti-Money Laundering Directives (AMLD), the USA PATRIOT Act requirements, and FATF international standards."
                  : "NeoBank работает под строгим регуляторным надзором. Мы полностью соответствуем Европейским директивам по противодействию отмыванию денежных средств (AMLD), требованиям USA PATRIOT Act и международным стандартам FATF."}
              </p>
              <p>
                {isEn
                  ? "Client deposits are protected under the European Deposit Insurance Scheme. All personal data is processed in accordance with GDPR and stored in Tier IV certified data centers in Switzerland."
                  : "Депозиты клиентов защищены в рамках Европейской системы страхования вкладов. Все персональные данные обрабатываются в соответствии с GDPR и хранятся в сертифицированных дата-центрах уровня Tier IV в Швейцарии."}
              </p>
            </div>
          </div>

          {/* Licenses & Certificates */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6">
            <div className="flex items-center justify-center gap-3 mb-6">
              <FileCheck className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                {isEn ? "Licenses & Certificates" : "Лицензии и сертификаты"}
              </h2>
            </div>
            <p className="text-muted-foreground text-center mb-6">
              {isEn
                ? "NeoBank International AG holds all necessary licenses and certificates for international banking operations. Click on any document to view in full size."
                : "NeoBank International AG обладает всеми необходимыми лицензиями и сертификатами для осуществления международной банковской деятельности. Нажмите на документ для просмотра в полном размере."}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {licenses.map((license, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedLicense(license.image)}
                  className="group relative bg-secondary/50 rounded-xl p-3 border border-border hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5 text-left"
                >
                  <div className="relative overflow-hidden rounded-lg mb-3 aspect-[3/4] bg-muted">
                    <img
                      src={license.image}
                      alt={license.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-background/90 text-foreground px-3 py-1.5 rounded-full font-medium">
                        {isEn ? "View" : "Открыть"}
                      </span>
                    </div>
                  </div>
                  <h4 className="text-foreground font-semibold text-xs mb-0.5 leading-tight">{license.title}</h4>
                  <p className="text-muted-foreground text-[10px]">{license.number}</p>
                  <p className="text-muted-foreground text-[10px] mt-0.5">{license.issuer}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Lightbox */}
          {selectedLicense && (
            <div
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setSelectedLicense(null)}
            >
              <button
                onClick={() => setSelectedLicense(null)}
                className="absolute top-6 right-6 text-foreground/70 hover:text-foreground bg-card border border-border rounded-full p-2 z-10"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={selectedLicense}
                alt="License"
                className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* History Timeline */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6">
            <div className="flex items-center justify-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                {isEn ? "Our History" : "История банка"}
              </h2>
            </div>
            <div className="space-y-6">
              {timeline.map((item, i) => (
                <div key={item.year} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                      {item.year}
                    </div>
                    {i < timeline.length - 1 && <div className="w-0.5 flex-1 bg-border mt-2" />}
                  </div>
                  <div className="pb-6">
                    <h3 className="text-foreground font-semibold mb-1">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Leadership & Governance */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Users className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                {isEn ? "Leadership" : "Руководство"}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(isEn ? [
                { name: "Alexander Voronov", role: "CEO", desc: "Over 20 years of experience in international banking. Former VP at Credit Suisse." },
                { name: "Dmitry Kovalev", role: "CTO", desc: "Former Lead Engineer at Revolut. Expert in fintech architecture and security systems." },
                { name: "Elena Richter", role: "Chief Compliance Officer", desc: "15+ years in AML/KYC compliance. Certified ACAMS specialist." },
              ] : [
                { name: "Александр Воронов", role: "Генеральный директор", desc: "Более 20 лет опыта в международном банкинге. Бывший вице-президент Credit Suisse." },
                { name: "Дмитрий Ковалёв", role: "Технический директор", desc: "Бывший ведущий инженер Revolut. Эксперт в архитектуре финтех-решений и системах безопасности." },
                { name: "Елена Рихтер", role: "Директор по комплаенсу", desc: "Более 15 лет в сфере AML/KYC. Сертифицированный специалист ACAMS." },
              ]).map((person, i) => (
                <div key={i} className="bg-secondary/50 rounded-xl p-5 text-center">
                  <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="text-foreground font-semibold text-sm">{person.name}</h4>
                  <p className="text-primary text-xs font-medium mb-2">{person.role}</p>
                  <p className="text-muted-foreground text-xs">{person.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Offices */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Globe className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                {isEn ? "Our Offices" : "Наши офисы"}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { city: isEn ? "Zurich, Switzerland" : "Цюрих, Швейцария", type: isEn ? "Headquarters" : "Головной офис", address: "Bahnhofstrasse 42, 8001 Zürich" },
                { city: isEn ? "London, UK" : "Лондон, Великобритания", type: isEn ? "European Office" : "Европейский офис", address: "One Exchange Square, EC2A 2JN" },
                { city: isEn ? "Moscow, Russia" : "Москва, Россия", type: isEn ? "CIS Headquarters" : "Головной офис в СНГ", address: isEn ? "Moscow City, Federation Tower, Presnenskaya Emb. 12" : "Москва-Сити, башня «Федерация», Пресненская наб., 12" },
                { city: isEn ? "Saint Petersburg, Russia" : "Санкт-Петербург, Россия", type: isEn ? "Regional Office" : "Региональный офис", address: isEn ? "Lakhta Center, Lakhtinsky Prospect 2" : "Лахта Центр, Лахтинский пр., 2" },
              ].map((office, i) => (
                <div key={i} className="bg-secondary/50 rounded-xl p-5 text-center">
                  <Landmark className="w-6 h-6 text-primary mx-auto mb-3" />
                  <h4 className="text-foreground font-semibold text-sm">{office.city}</h4>
                  <p className="text-primary text-xs font-medium mb-1">{office.type}</p>
                  <p className="text-muted-foreground text-xs">{office.address}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Numbers */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Award className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold text-foreground">
                {isEn ? "NeoBank in Numbers" : "NeoBank в цифрах"}
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: "50+", label: isEn ? "Countries" : "Стран" },
                { value: "25 000+", label: isEn ? "Clients" : "Клиентов" },
                { value: "24/7", label: isEn ? "Support" : "Поддержка" },
                { value: "4", label: isEn ? "Card tiers" : "Уровня карт" },
                { value: "120+", label: isEn ? "Employees" : "Сотрудников" },
                { value: "15+", label: isEn ? "Currencies" : "Валют" },
                { value: "4", label: isEn ? "Offices" : "Офиса" },
                { value: "99.9%", label: isEn ? "Uptime" : "Аптайм" },
              ].map(stat => (
                <div key={stat.label} className="text-center p-4 bg-secondary rounded-xl">
                  <p className="text-2xl font-bold text-primary">{stat.value}</p>
                  <p className="text-muted-foreground text-sm mt-1">{stat.label}</p>
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

export default About;
