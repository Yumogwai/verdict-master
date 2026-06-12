import type { CSSProperties } from "react";
import { ICONS } from "@/lib/icons";

export function Ic({
  name,
  className,
  style,
}: {
  name: string;
  className?: string;
  style?: CSSProperties;
}) {
  // Own-property check so a hostile `name` (e.g. "constructor") from persisted
  // state can never resolve through the prototype chain into the markup.
  const inner = Object.prototype.hasOwnProperty.call(ICONS, name) ? ICONS[name] : "";
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}
