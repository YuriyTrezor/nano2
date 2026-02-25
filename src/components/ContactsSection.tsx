import { Phone, Mail, Send } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const ContactsSection = () => {
  const { t } = useLanguage();

  return (
    <section id="contacts" className="py-24 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-10">{t("Контакты")}</h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
          <a href="tel:88004582537" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
            <Phone className="w-5 h-5 text-primary" />
            <span className="text-lg">8 (800) 458-25-37</span>
          </a>
          <a href="mailto:support@neobank.ru" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
            <Mail className="w-5 h-5 text-primary" />
            <span className="text-lg">support@neobank.ru</span>
          </a>
          <a href="https://t.me/Neobank_manager" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors">
            <Send className="w-5 h-5 text-primary" />
            <span className="text-lg">Telegram</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default ContactsSection;
