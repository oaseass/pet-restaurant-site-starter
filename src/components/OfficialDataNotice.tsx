import { SourceNotice } from "@/components/SourceNotice";

export async function OfficialDataNotice({ className }: { className?: string }) {
  return <SourceNotice className={className} />;
}