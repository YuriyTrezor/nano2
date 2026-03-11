import { ArrowRight, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";
import neobankLogo from "@/assets/neobank-logo.png";

const Navbar = () => {
  const { lang, toggleLang, t } = useLanguage();
  const isEn = lang === "en";
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setShowInstall(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <a href="/" className="flex items-center">
            <img src={neobankLogo} alt="NeoBank" className="h-9 rounded-md opacity-90 brightness-90" />
          </a>
          <div className="hidden md:flex items-center gap-6">
            <a href="#cards" className="text-muted-foreground hover:text-foreground transition-colors text-sm">{t("О картах")}</a>
            <a href="#reviews" className="text-muted-foreground hover:text-foreground transition-colors text-sm">{t("Отзывы клиентов")}</a>
            <a href="#contacts" className="text-muted-foreground hover:text-foreground transition-colors text-sm">{t("Контакты")}</a>
            <a href="/about" className="text-muted-foreground hover:text-foreground transition-colors text-sm">{isEn ? "About" : "О банке"}</a>
            <a href="/swift" className="text-muted-foreground hover:text-foreground transition-colors text-sm">SWIFT</a>
            <a href="/documents" className="text-muted-foreground hover:text-foreground transition-colors text-sm">{isEn ? "Documents" : "Документы"}</a>
            <a href="/support" className="text-muted-foreground hover:text-foreground transition-colors text-sm">{t("Поддержка")}</a>
          </div>
        </div>
        <div className="flex items-center gap-3">

          <div className="hidden sm:flex items-center rounded-full border border-border overflow-hidden">
            <button
              onClick={() => lang !== "ru" && toggleLang()}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${lang === "ru" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              RU
            </button>
            <button
              onClick={() => lang !== "en" && toggleLang()}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              EN
            </button>
          </div>
          <a href="/auth">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 text-xs sm:text-sm">
              <span className="hidden sm:inline">{t("Войти в личный кабинет")}</span>
              <span className="sm:hidden">{t("Войти в личный кабинет").split(" ")[0]}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
