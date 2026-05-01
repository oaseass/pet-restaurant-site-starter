import clsx from "clsx";

export function SourceBadge({
  label,
  tone = "official",
  className,
}: {
  label: string;
  tone?: "official" | "user" | "owner" | "manual" | "admin";
  className?: string;
}) {
  const toneClassName = {
    official: "bg-[var(--brand-soft)] text-[var(--brand)] border-[rgba(31,74,64,0.12)]",
    user: "bg-[#fff2ea] text-[#a15c3a] border-[rgba(178,107,71,0.12)]",
    owner: "bg-[#fff5d9] text-[#8b6a20] border-[rgba(208,174,113,0.18)]",
    manual: "bg-[#f3f0ec] text-[#5f5550] border-[rgba(56,41,29,0.1)]",
    admin: "bg-[#f0ecff] text-[#5a54a0] border-[rgba(90,84,160,0.14)]",
  }[tone];

  return <span className={clsx("badge", toneClassName, className)}>{label}</span>;
}