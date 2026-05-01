import Link from "next/link";
import { MapPin, ShieldCheck } from "lucide-react";

export type RestaurantCardItem = {
  id: string;
  name: string;
  businessType: string;
  sido: string;
  sigungu: string | null;
  address: string;
  lat?: number | null;
  lng?: number | null;
  officialRegistered?: boolean;
  dataUpdatedAt: Date;
};

export function RestaurantCard({ restaurant }: { restaurant: RestaurantCardItem }) {
  return (
    <Link href={`/restaurants/${restaurant.id}`} className="card group block rounded-[1rem] p-5 transition duration-200 hover:border-[rgba(31,107,91,0.2)] hover:bg-[#fcfbf9]">
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="mb-3 flex flex-wrap gap-2">
          {restaurant.officialRegistered === false ? null : <span className="badge"><ShieldCheck size={14} /> 공식 등록</span>}
          <span className="badge">{restaurant.businessType}</span>
          <span className="badge">{restaurant.sido}{restaurant.sigungu ? ` · ${restaurant.sigungu}` : ""}</span>
        </div>
        <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-[11px] font-black text-[var(--brand)]">식당</span>
      </div>
      <h3 className="relative z-10 text-xl font-black tracking-tight">{restaurant.name}</h3>
      <p className="relative z-10 mt-2 flex gap-2 text-sm leading-6 text-[var(--muted)]">
        <MapPin className="mt-0.5 shrink-0" size={16} />
        <span>{restaurant.address}</span>
      </p>
      <div className="relative z-10 mt-5 flex items-center justify-between border-t border-[var(--line)] pt-4">
        <p className="text-xs font-bold text-[var(--muted)]">데이터 기준일 {restaurant.dataUpdatedAt.toLocaleDateString("ko-KR")}</p>
        <span className="text-sm font-black text-[var(--brand)] transition group-hover:translate-x-0.5">상세 보기</span>
      </div>
    </Link>
  );
}
