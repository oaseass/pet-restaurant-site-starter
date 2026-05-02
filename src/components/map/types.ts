export type MapCategoryKey = "restaurants" | "hospitals" | "grooming" | "daycare" | "funeral" | "lost-pets";

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
  regionLabel: string;
  href: string;
  officialRegistered: boolean;
  lat: number | null;
  lng: number | null;
  coordinateStatus: "ready" | "pending";
  dataUpdatedLabel: string;
  distanceKm?: number;
};

export type PreparedCategoryState = {
  title: string;
  description: string;
  note: string;
};