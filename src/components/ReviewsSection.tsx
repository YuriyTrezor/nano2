import avatar1 from "@/assets/review-avatar-1.jpg";
import avatar2 from "@/assets/review-avatar-2.jpg";
import avatar3 from "@/assets/review-avatar-3.jpg";
import avatar4 from "@/assets/review-avatar-4.jpg";
import avatar5 from "@/assets/review-avatar-5.jpg";
import avatar6 from "@/assets/review-avatar-6.jpg";

const reviews = [
  { name: "Алексей М.", text: "Карту оформил за 1 день, переводы SWIFT работают отлично. Рекомендую!", avatar: avatar1 },
  { name: "Елена К.", text: "Удобный личный кабинет и быстрая поддержка. Пользуюсь уже 2 года.", avatar: avatar2 },
  { name: "Дмитрий С.", text: "Gold карта — отличный выбор для путешествий. Кэшбэк радует.", avatar: avatar3 },
  { name: "Анна В.", text: "Platinum карта оправдала себя полностью. Персональный менеджер всегда на связи.", avatar: avatar4 },
  { name: "Сергей П.", text: "Пользуюсь Standard картой для покупок за границей. Всё работает без перебоев.", avatar: avatar5 },
  { name: "Ольга Н.", text: "Отличный банк! Переводы SWIFT проходят быстро, комиссии минимальные.", avatar: avatar6 },
];

const ReviewsSection = () => {
  return (
    <section id="reviews" className="py-24 px-6 border-t border-border">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-16">Отзывы</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div key={review.name} className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <img src={review.avatar} alt={review.name} className="w-12 h-12 rounded-full object-cover" />
                <span className="text-foreground font-semibold">{review.name}</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">"{review.text}"</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;
