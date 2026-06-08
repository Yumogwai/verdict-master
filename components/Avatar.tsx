import type { CSSProperties } from "react";
import { Ic } from "./Icon";

export function Avatar({
  icon,
  color,
  size = 40,
  radius,
  glow,
  style,
}: {
  icon: string;
  color: string;
  size?: number;
  radius?: number;
  glow?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius != null ? radius : Math.round(size * 0.28),
        background: color,
        display: "grid",
        placeItems: "center",
        color: "#fff",
        flexShrink: 0,
        boxShadow: glow ? "0 0 16px " + glow : "none",
        ...style,
      }}
    >
      <Ic name={icon} style={{ width: Math.round(size * 0.5), height: Math.round(size * 0.5) }} />
    </div>
  );
}
