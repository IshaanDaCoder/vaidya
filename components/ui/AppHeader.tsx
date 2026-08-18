import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "./Logo";
import { heading, link as linkClass } from "./styles";

// Consistent header block for the logged-in app screens: a serif title
// (matching the marketing homepage's typographic voice), an optional
// description, an optional "back to X" link, and a right-hand actions
// slot that always ends with the theme toggle.
export function AppHeader({
  title,
  description,
  backHref,
  backLabel,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="shrink-0" aria-label="Vaidya home">
            <Logo size={30} />
          </Link>
          <h1 className={heading("lg")}>{title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-4">
          {actions}
          <ThemeToggle />
        </div>
      </div>
      {description && <p className="mt-2 text-sm text-muted">{description}</p>}
      {backHref && (
        <Link href={backHref} className={`mt-2 inline-block text-sm ${linkClass}`}>
          {backLabel ?? "← Back"}
        </Link>
      )}
    </div>
  );
}
