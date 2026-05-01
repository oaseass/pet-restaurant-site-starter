import Link from "next/link";
import { POLICY_LINKS } from "@/lib/platform-content";

export default function PoliciesPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-8 sm:py-10">
      <section className="section-shell px-6 py-6 sm:px-8 sm:py-8">
        <p className="eyebrow">Policies</p>
        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">운영 정책</h1>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {POLICY_LINKS.map((policy) => (
          <Link key={policy.href} href={policy.href} className="card rounded-[2rem] p-6 transition hover:-translate-y-1">
            <h2 className="text-xl font-black">{policy.label}</h2>
          </Link>
        ))}
      </section>
    </main>
  );
}