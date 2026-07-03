import { Star } from "lucide-react";
import { REVIEWS, type Review } from "@/lib/reviews";

export function ReviewsSection() {
  const carouselReviews = [...REVIEWS, ...REVIEWS.slice(0, 12)];

  return (
    <section id="reviews" className="py-14 md:py-16">
      <div className="container-page">
        <div className="max-w-2xl">
          <div className="text-eyebrow">Skin routine feedback</div>
          <h2 className="font-display mt-2 text-3xl md:text-4xl">People come for clarity, not a crowded routine.</h2>
          <p className="mt-3 text-muted-foreground">
            The best feedback is simple: the scan feels specific, the plan feels understandable, and the next step is obvious.
          </p>
        </div>
      </div>

      <div className="review-marquee mt-10" aria-label="Auto-scrolling skincare routine feedback">
        <div className="review-marquee-track">
          {carouselReviews.map((review, index) => (
            <div key={`${review.id}-${index}`} className="w-[280px] shrink-0 sm:w-[340px]">
              <ReviewCard review={review} compact />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ReviewCard({ review, compact = false }: { review: Review; compact?: boolean }) {
  return (
    <article className={`surface-card h-full p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lift ${compact ? "min-h-[210px]" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-brand text-sm font-semibold text-primary-foreground shadow-soft" aria-hidden>
            {review.initials}
          </div>
          <div className="min-w-0">
            <div className="font-medium">{review.name}</div>
            <div className="text-xs text-muted-foreground">{review.tag}</div>
          </div>
        </div>
        <div className="flex gap-0.5 text-primary" aria-label="5 out of 5 stars">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star key={index} className="h-3.5 w-3.5 fill-current" />
          ))}
        </div>
      </div>
      <p className="mt-5 text-sm leading-6 text-foreground/90">"{review.text}"</p>
      <div className="mt-5 h-px bg-border/70" />
      <div className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Routine clarity
      </div>
    </article>
  );
}
