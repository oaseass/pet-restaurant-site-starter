"use client";

import { useRouter } from "next/navigation";

const TABS: Array<{
  id: string;
  label: string;
  redirect?: string;
}> = [
  { id: "all", label: "전체" },
  { id: "restaurants", label: "식당" },
  { id: "hospitals", label: "병원", redirect: "/hospitals" },
  { id: "grooming", label: "미용", redirect: "/grooming" },
  { id: "lost-pets", label: "찾아요", redirect: "/lost-pets" },
  { id: "guide", label: "가이드" },
];

interface SearchFilterTabsProps {
  activeTab: string;
  keyword: string;
}

export function SearchFilterTabs({ activeTab, keyword }: SearchFilterTabsProps) {
  const router = useRouter();

  const handleTab = (tab: (typeof TABS)[0]) => {
    if (tab.redirect) {
      router.push(tab.redirect);
      return;
    }
    const params = new URLSearchParams();
    if (keyword) params.set("q", keyword);
    if (tab.id !== "all") params.set("category", tab.id);
    const qs = params.toString();
    router.push(`/search${qs ? `?${qs}` : ""}`);
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 0,
        borderBottom: "1px solid var(--line)",
        background: "white",
        position: "sticky",
        top: 0,
        zIndex: 10,
        overflowX: "auto",
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTab(tab)}
            style={{
              padding: "9px 12px",
              fontSize: "13px",
              fontWeight: isActive ? 800 : 500,
              color: isActive ? "var(--brand)" : "#555",
              background: "none",
              border: "none",
              borderBottom: isActive ? "2px solid var(--brand)" : "2px solid transparent",
              cursor: "pointer",
              whiteSpace: "nowrap",
              marginBottom: "-1px",
              flexShrink: 0,
            }}
          >
            {tab.label}
            {tab.redirect && (
              <span style={{ fontSize: "9px", marginLeft: "2px", color: "#bbb" }}>↗</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
