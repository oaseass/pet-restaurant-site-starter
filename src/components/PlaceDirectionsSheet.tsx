"use client";

import { DirectionsSheet } from "@/components/detail/DirectionsSheet";

type PlaceDirectionsSheetProps = {
  name: string;
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
};

export function PlaceDirectionsSheet({ name, lat, lng, address }: PlaceDirectionsSheetProps) {
  return <DirectionsSheet name={name} lat={lat} lng={lng} address={address} />;
}