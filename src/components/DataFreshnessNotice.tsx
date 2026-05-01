import { SourceNotice } from "@/components/SourceNotice";

export async function DataFreshnessNotice({ className }: { className?: string }) {
  return <SourceNotice className={className} />;
}