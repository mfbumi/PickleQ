import { Clock, Lock, Moon } from "lucide-react";
import type { Player } from "../engine/types";
import { initials } from "../engine/utils";

interface PaddleChipProps {
  player: Player;
  variant: "next" | "waiting" | "flex" | "resting";
  positionLabel?: string;
  onClick?: () => void;
}

const variantStyles: Record<PaddleChipProps["variant"], { bg: string; border: string; text: string; face: string }> = {
  next: { bg: "rgba(215,255,61,0.16)", border: "var(--optic)", text: "var(--optic)", face: "var(--optic)" },
  waiting: { bg: "rgba(244,251,238,0.05)", border: "var(--line-strong)", text: "var(--chalk)", face: "var(--sage)" },
  flex: { bg: "rgba(255,107,74,0.12)", border: "var(--coral)", text: "var(--coral)", face: "var(--coral)" },
  resting: { bg: "rgba(244,251,238,0.02)", border: "var(--line)", text: "var(--sage-dim)", face: "var(--sage-dim)" },
};

export default function PaddleChip({ player, variant, positionLabel, onClick }: PaddleChipProps) {
  const styles = variantStyles[variant];

  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: styles.bg,
        border: `1.5px solid ${styles.border}`,
        borderRadius: 999,
        padding: "7px 14px 7px 7px",
        color: styles.text,
        flexShrink: 0,
        position: "relative",
        transition: "transform 0.12s ease, border-color 0.12s ease",
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      title={`${player.name} — ${player.gamesPlayed} games played`}
    >
      {/* paddle face */}
      <span
        style={{
          width: 28,
          height: 32,
          borderRadius: "60% 60% 55% 55%",
          background: styles.face,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 11,
          color: variant === "waiting" || variant === "resting" ? "var(--court-deep)" : "var(--court-deep)",
          flexShrink: 0,
        }}
      >
        {initials(player.name)}
      </span>
      <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.25 }}>
        <span style={{ fontWeight: 600, fontSize: 13.5, whiteSpace: "nowrap" }}>{player.name}</span>
        <span style={{ fontSize: 11, opacity: 0.75, display: "flex", alignItems: "center", gap: 4 }}>
          {variant === "resting" ? (
            <>
              <Moon size={10} /> Resting
            </>
          ) : variant === "flex" ? (
            <>
              <Lock size={10} /> Flex — next sub-in
            </>
          ) : positionLabel ? (
            <>
              <Clock size={10} /> {positionLabel}
            </>
          ) : (
            `${player.gamesPlayed} games`
          )}
        </span>
      </span>
    </button>
  );
}
