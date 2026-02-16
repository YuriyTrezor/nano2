import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CardsSection from "@/components/CardsSection";
import ReviewsSection from "@/components/ReviewsSection";
import ContactsSection from "@/components/ContactsSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <CardsSection />
        <ReviewsSection />
        <ContactsSection />
      </main>
      <footer className="border-t border-border py-8 px-6 text-center text-muted-foreground text-sm">
        © 2025 NeoBank. Все права защищены.
      </footer>
    </div>
  );
};

export default Index;
