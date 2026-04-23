import { ArrowRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";
import neobankLogo from "@/assets/neobank-logo.png";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Link } from "react-router-dom";

const Navbar = () => {
  const { lang, toggleLang, t } = useLanguage();
  const isEn = lang === "en";
  const [open, setOpen] = useState(false);

  const navItems = [
    { href: "/#cards", label: t("О картах") },
    { href: "/#reviews", label: t("Отзывы клиентов") },
    { href: "/#contacts", label: t("Контакты") },
    { href: "/about", label: isEn ? "About" : "О банке" },
    { href: "/swift", label: "SWIFT" },
    { href: "/documents", label: isEn ? "Documents" : "Документы" },
    { href: "/support", label: t("Поддержка") },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center">
            <img src={neobankLogo} alt="NeoBank" className="h-9 rounded-md opacity-90 brightness-90" />
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              item.href.startsWith("/#") ? (
                <a key={item.href} href={item.href} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {item.label}
                </a>
              ) : (
                <Link key={item.href} to={item.href} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  {item.label}
                </Link>
              )
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
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
          <Link to="/auth" className="hidden sm:block">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 text-xs sm:text-sm">
              {t("Войти в личный кабинет")}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>

          {/* Mobile hamburger */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <button
                aria-label="Меню"
                className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-foreground"
              >
                <Menu className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-sm bg-background border-border p-0 flex flex-col">
              <SheetHeader className="p-5 border-b border-border text-left">
                <SheetTitle className="text-foreground">
                  <img src={neobankLogo} alt="NeoBank" className="h-8 rounded-md opacity-90 brightness-90" />
                </SheetTitle>
              </SheetHeader>

              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {navItems.map((item) => (
                  item.href.startsWith("/#") ? (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="block px-3 py-3 rounded-lg text-base text-foreground hover:bg-secondary transition-colors"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setOpen(false)}
                      className="block px-3 py-3 rounded-lg text-base text-foreground hover:bg-secondary transition-colors"
                    >
                      {item.label}
                    </Link>
                  )
                ))}
              </div>

              <div className="p-4 border-t border-border space-y-3">
                <div className="flex items-center rounded-full border border-border overflow-hidden w-fit mx-auto">
                  <button
                    onClick={() => lang !== "ru" && toggleLang()}
                    className={`px-4 py-1.5 text-xs font-medium ${lang === "ru" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                  >
                    RU
                  </button>
                  <button
                    onClick={() => lang !== "en" && toggleLang()}
                    className={`px-4 py-1.5 text-xs font-medium ${lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                  >
                    EN
                  </button>
                </div>
                <Link to="/auth" onClick={() => setOpen(false)} className="block">
                  <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
                    {t("Войти в личный кабинет")}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
