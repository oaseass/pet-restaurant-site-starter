import Link from "next/link";
import { MapPin, ShieldCheck } from "lucide-react";
import type { Restaurant } from "@prisma/client";

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Link href={`/restaurants/${restaurant.id}`} className="card block rounded-3xl p-5 transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="mb-3 flex flex-wrap gap-2">
        <span className="badge"><ShieldCheck size={14} /> 공식 등록</span>
        <span className="badge">{restaurant.businessType}</span>
        <span className="badge">{restaurant.sido}{restaurant.sigungu ? ` · ${restaurant.sigungu}` : ""}</span>
      </div>
      <h3 className="text-lg font-black tracking-tight">{restaurant.name}</h3>
      <p className="mt-2 flex gap-2 text-sm leading-6 text-gray-600">
        <MapPin className="mt-0.5 shrink-0" size={16} />
        <span>{restaurant.address}</span>
      </p>
      <p className="mt-4 text-xs font-bold text-gray-400">
        데이터 기준일 {restaurant.dataUpdatedAt.toLocaleDateString("ko-KR")}
      </p>
    </Link>
  );
}
