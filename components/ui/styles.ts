// Shared class-name tokens for the app's internal (non-marketing) pages.
// Kept as plain strings rather than component wrappers so existing native
// <input>/<select>/<Link> elements can adopt the new look by swapping their
// className, without touching name/formAction/defaultValue wiring.

export const label = "text-xs font-medium tracking-wide text-muted";

export const input =
  "mt-1.5 w-full rounded-lg border border-line bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-shadow focus:border-trust focus:ring-2 focus:ring-trust/15";

export const card = "rounded-2xl border border-line bg-surface p-5 shadow-sm";

export const cardInteractive =
  "rounded-2xl border border-line bg-surface p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-trust/40 hover:shadow-md";

export const listRow =
  "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3.5 shadow-sm";

export const sectionLabel =
  "text-xs font-semibold uppercase tracking-[0.12em] text-trust-dark dark:text-trust";

export function heading(size: "lg" | "md" = "lg") {
  return size === "lg"
    ? "font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
    : "font-serif text-lg font-semibold tracking-tight text-foreground";
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "md" | "sm";

export function buttonVariants(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
) {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-trust/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background";
  const sizes: Record<ButtonSize, string> = {
    md: "rounded-full px-5 py-2.5 text-sm",
    sm: "rounded-full px-3.5 py-1.5 text-xs",
  };
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-trust text-white shadow-md shadow-trust/25 hover:-translate-y-0.5 hover:bg-trust-dark hover:shadow-lg hover:shadow-trust/35",
    secondary:
      "border border-line bg-surface text-foreground shadow-sm hover:-translate-y-0.5 hover:border-trust hover:text-trust-dark hover:shadow-md dark:hover:text-trust",
    ghost: "text-muted hover:text-foreground",
    danger:
      "bg-red-700 text-white shadow-md shadow-red-700/20 hover:-translate-y-0.5 hover:bg-red-800 hover:shadow-lg hover:shadow-red-700/30",
  };
  return `${base} ${sizes[size]} ${variants[variant]}`;
}

type AlertTone = "success" | "error" | "warning" | "info";

export function alertVariants(tone: AlertTone) {
  const base = "rounded-xl border px-4 py-3 text-sm";
  const tones: Record<AlertTone, string> = {
    success: "border-trust/25 bg-trust/10 text-trust-dark dark:text-trust",
    error:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300",
    warning:
      "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-300",
    info: "border-line bg-surface text-foreground/85",
  };
  return `${base} ${tones[tone]}`;
}

type BadgeTone = "success" | "error" | "warning" | "neutral";

export function badgeVariants(tone: BadgeTone) {
  const base =
    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize";
  const tones: Record<BadgeTone, string> = {
    success: "border-trust/25 bg-trust/10 text-trust-dark dark:text-trust",
    error:
      "border-red-300 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300",
    warning:
      "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-300",
    neutral: "border-line bg-background text-muted",
  };
  return `${base} ${tones[tone]}`;
}

export const link = "font-medium text-trust-dark underline underline-offset-4 dark:text-trust";
