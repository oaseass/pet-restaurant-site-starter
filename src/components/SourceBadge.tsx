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
    official: "bg-[var(--brand-soft)] text-[var(--brand)] border-[rgba(31,107,91,0.12)]",
    user: "bg-[var(--accent-soft)] text-[#b35f1d] border-[rgba(255,159,88,0.18)]",
    owner: "bg-[#eef7ff] text-[#2d5b95] border-[rgba(45,91,149,0.14)]",
    manual: "bg-[#f7f3ee] text-[var(--muted)] border-[var(--line)]",
    admin: "bg-[#f0ecff] text-[#5a54a0] border-[rgba(90,84,160,0.14)]",
  }[tone];

  return <span className={clsx("badge", toneClassName, className)}>{label}</span>;
}