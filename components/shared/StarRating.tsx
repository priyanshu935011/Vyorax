import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  size?: number;
  className?: string;
}

export default function StarRating({ rating, size = 14, className = "" }: StarRatingProps) {
  // Clamp rating between 0 and 5
  const clampedRating = Math.max(0, Math.min(5, rating));

  return (
    <div className={`flex text-[var(--gold)] items-center ${className}`} style={{ gap: size > 16 ? "3px" : "1.5px" }}>
      {Array.from({ length: 5 }).map((_, i) => {
        const fillPercent = Math.max(0, Math.min(100, (clampedRating - i) * 100));
        return (
          <div key={i} className="relative select-none" style={{ width: size, height: size }}>
            {/* Background Grey Star */}
            <Star
              size={size}
              className="text-[var(--steel)]/50 absolute top-0 left-0"
            />
            {/* Foreground Filled Star (clipped width) */}
            {fillPercent > 0 && (
              <div
                className="absolute top-0 left-0 overflow-hidden"
                style={{ width: `${fillPercent}%`, height: size }}
              >
                <Star
                  size={size}
                  className="fill-[var(--gold)] text-[var(--gold)] max-w-none"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
