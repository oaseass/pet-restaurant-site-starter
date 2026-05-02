import { AppSidebar } from "@/components/AppSidebar";
import { RightRail } from "@/components/RightRail";

interface PublicPageShellProps {
  children: React.ReactNode;
  restaurantCount?: number;
  lastUpdatedAt?: string | null;
}

export function PublicPageShell({
  children,
  restaurantCount,
  lastUpdatedAt,
}: PublicPageShellProps) {
  return (
    <div className="portal-layout">
      <aside className="portal-sidebar">
        <AppSidebar />
      </aside>
      <main className="portal-main">
        {children}
      </main>
      <aside className="portal-rail">
        <RightRail
          restaurantCount={restaurantCount}
          lastUpdatedAt={lastUpdatedAt}
        />
      </aside>
    </div>
  );
}
