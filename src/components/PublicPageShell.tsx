import { AppSidebar } from "@/components/AppSidebar";
import { RightRail } from "@/components/RightRail";

interface PublicPageShellProps {
  children: React.ReactNode;
  restaurantCount?: number;
  registeredPlaceCount?: number;
  lastUpdatedAt?: string | null;
}

export function PublicPageShell({
  children,
  restaurantCount,
  registeredPlaceCount,
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
          registeredPlaceCount={registeredPlaceCount}
          lastUpdatedAt={lastUpdatedAt}
        />
      </aside>
    </div>
  );
}
