"use client";

import { useState } from "react";
import { Camera, Star } from "lucide-react";

type GooglePlacePhotoProps = {
  photoName: string;
  alt: string;
  authorName?: string | null;
  authorUri?: string | null;
  rating?: number | null;
  userRatingCount?: number | null;
};

function formatRating(rating?: number | null, userRatingCount?: number | null) {
  if (typeof rating !== "number") return null;
  const reviewLabel = typeof userRatingCount === "number" && userRatingCount > 0
    ? `${userRatingCount.toLocaleString("ko-KR")}개`
    : null;
  return reviewLabel ? `${rating.toFixed(1)} · 리뷰 ${reviewLabel}` : rating.toFixed(1);
}

export function GooglePlacePhoto({ photoName, alt, authorName, authorUri, rating, userRatingCount }: GooglePlacePhotoProps) {
  const [failed, setFailed] = useState(false);
  const ratingLabel = formatRating(rating, userRatingCount);

  if (failed) return null;

  const src = `/api/google-place-photo?name=${encodeURIComponent(photoName)}&maxWidthPx=960&maxHeightPx=540`;

  return (
    <figure className="overflow-hidden rounded-xl border border-[var(--line)] bg-[#111827]">
      <div className="relative aspect-[16/9] w-full">
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailed(true)}
        />
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-2 bg-black/65 px-4 py-3 text-white">
          <span className="inline-flex items-center gap-2 text-xs font-black">
            <Camera size={14} />
            Google Places 사진
          </span>
          {ratingLabel ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-black text-[#111827]">
              <Star size={13} fill="currentColor" />
              {ratingLabel}
            </span>
          ) : null}
        </div>
      </div>
      {authorName ? (
        <figcaption className="border-t border-white/10 px-4 py-2 text-xs font-bold text-white/80">
          사진 제공: {authorUri ? <a href={authorUri} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{authorName}</a> : authorName}
        </figcaption>
      ) : null}
    </figure>
  );
}