import { sectionLabel } from "./styles";

export function SectionHeading({
  children,
  description,
}: {
  children: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={sectionLabel}>{children}</span>
      <span className="h-px flex-1 bg-line" />
      {description && <span className="shrink-0 text-xs text-muted">{description}</span>}
    </div>
  );
}
