import { badgeVariants } from "./styles";

export function Badge({
  tone,
  children,
}: {
  tone: "success" | "error" | "warning" | "neutral";
  children: React.ReactNode;
}) {
  return <span className={badgeVariants(tone)}>{children}</span>;
}
