import { alertVariants } from "./styles";

export function Alert({
  tone,
  children,
}: {
  tone: "success" | "error" | "warning" | "info";
  children: React.ReactNode;
}) {
  return <div className={alertVariants(tone)}>{children}</div>;
}
