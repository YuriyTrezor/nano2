import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const Navbar = () => {
  const { lang, toggleLang } = useLanguage();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              N
            </div>
            <span className="text-foreground font-semibold text-lg">NeoBank</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#cards" className="text-muted-foreground hover:text-foreground transition-colors text-sm">О картах</a>
            <a href="#reviews" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Отзывы</a>
            <a href="#contacts" className="text-muted-foreground hover:text-foreground transition-colors text-sm">Контакты</a>
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
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5">
              Войти в личный кабинет <ArrowRight className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
