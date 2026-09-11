import { X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { clientReviews, type ClientReview } from "../config/reviews";
import "../styles/reviews.css";

type ReviewCardProps = {
  duplicate?: boolean;
  onOpen: (review: ClientReview, trigger: HTMLButtonElement) => void;
  review: ClientReview;
};

function ReviewCard({ duplicate = false, onOpen, review }: ReviewCardProps) {
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onOpen(review, event.currentTarget);
  };

  return (
    <button
      aria-hidden={duplicate || undefined}
      aria-label={`Read the full review from ${review.author}`}
      className="review-card"
      onClick={handleClick}
      tabIndex={duplicate ? -1 : 0}
      type="button"
    >
      <span className="review-card__topline">
        <span aria-hidden="true" className="review-card__quote-mark">
          “
        </span>
        {review.placeholder ? <span className="review-card__placeholder">Placeholder</span> : null}
      </span>
      <span className="review-card__preview">{review.preview}</span>
      <span className="review-card__footer">
        <span className="review-card__author">{review.author}</span>
      </span>
      <span className="review-card__read-more">Read full review</span>
    </button>
  );
}

export default function Reviews() {
  const [selectedReview, setSelectedReview] = useState<ClientReview | null>(null);
  const dialogTitleId = useId();
  const dialogTextId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const openReview = (review: ClientReview, trigger: HTMLButtonElement) => {
    triggerRef.current = trigger;
    setSelectedReview(review);
  };

  const closeReview = () => setSelectedReview(null);

  useEffect(() => {
    if (!selectedReview) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeReview();
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      triggerRef.current?.focus();
    };
  }, [selectedReview]);

  return (
    <section className="landing-section reviews" id="reviews" aria-labelledby="reviews-title">
      <div className="container">
        <div className="section-heading section-heading--wide">
          <p className="eyebrow">Client Reviews</p>
          <h2 id="reviews-title">Experiences, in their own words</h2>
        </div>
      </div>

      <div
        aria-label="Client review carousel"
        className={`reviews__viewport${selectedReview ? " reviews__viewport--paused" : ""}`}
      >
        <div className="reviews__track">
          <div className="reviews__group">
            {clientReviews.map((review) => (
              <ReviewCard key={review.id} onOpen={openReview} review={review} />
            ))}
          </div>
          <div aria-hidden="true" className="reviews__group">
            {clientReviews.map((review) => (
              <ReviewCard duplicate key={`${review.id}-duplicate`} onOpen={openReview} review={review} />
            ))}
          </div>
        </div>
      </div>

      {selectedReview ? (
        <div
          className="review-dialog__backdrop"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) closeReview();
          }}
        >
          <div
            aria-describedby={dialogTextId}
            aria-labelledby={dialogTitleId}
            aria-modal="true"
            className="review-dialog"
            role="dialog"
          >
            <button
              aria-label="Close full review"
              className="review-dialog__close"
              onClick={closeReview}
              ref={closeButtonRef}
              type="button"
            >
              <X aria-hidden="true" size={20} strokeWidth={1.6} />
            </button>
            <span aria-hidden="true" className="review-dialog__quote-mark">
              “
            </span>
            <h3 id={dialogTitleId}>{selectedReview.author}</h3>
            {selectedReview.placeholder ? (
              <p className="review-dialog__placeholder">Placeholder review</p>
            ) : null}
            <p className="review-dialog__text" id={dialogTextId}>
              {selectedReview.fullText}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
