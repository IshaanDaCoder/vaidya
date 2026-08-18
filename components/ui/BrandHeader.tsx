import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "./Logo";

// Minimal masthead for auth/onboarding screens: logo mark, wordmark, and
// the theme toggle, matching the marketing homepage's header treatment.
export function BrandHeader({ href = "/" }: { href?: string }) {
  return (
    <div className="flex items-center justify-between">
      <Link href={href} className="flex items-center gap-2.5">
        <Logo size={30} />
        <span className="font-serif text-lg font-semibold text-trust-dark dark:text-trust">Vaidya</span>
      </Link>
      <ThemeToggle />
    </div>
  );
}
