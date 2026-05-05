export type MapCategoryKey = "all" | "restaurants" | "hospitals" | "grooming" | "daycare" | "funeral" | "pharmacy" | "lost-pets";

export type MapCategoryOption = {
  key: MapCategoryKey;
  label: string;
  description: string;
  href: string;
  status: "active" | "coming-soon";
  countLabel: string;
};

export type MapRestaurantListItem = {
  id: string;
  name: string;
  address: string;
  businessType: string;
  /** "all" 카테고리에서 카테고리 배지로 표시할 레이블 (예: 병원, 약국) */
  categoryLabel?: string;
  regionLabel: string;
  href: string;
  officialRegistered: boolean;
  lat: number | null;
  lng: number | null;
  coordinateStatus: "ready" | "pending";
  dataUpdatedLabel: string;
  distanceKm?: number;
  phone?: string | null;
  externalCategory?: string | null;
  externalHref?: string | null;
  reviewLabel?: string;
  reviewHref?: string;
  sourceLabel?: string;
};

export type PreparedCategoryState = {
  title: string;
  description: string;
  note: string;
};