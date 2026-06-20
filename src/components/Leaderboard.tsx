import { Trophy } from "lucide-react";
import type { Player } from "../engine/types";
import { initials } from "../engine/utils";

export default function Leaderboard({ players }: { players: Player[] }) {
  const ranked = [...players]
    .filter((p) => p.gamesPlayed > 0)
    .sort((a, b) => {
      const winRateA = a.gamesWon / a.gamesPlayed;
      const winRateB = b.gamesWon / b.gamesPlayed;
      if (winRateB !== winRateA) return winRateB - winRateA;
      return b.gamesPlayed - a.gamesPlayed;
    });

  if (ranked.length === 0) {
    return <p style={{ fontSize: 13, color: "var(--sage-dim)" }}>Standings appear once games are recorded.</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {ranked.slice(0, 10).map((p, i) => {
        const winRate = Math.round((p.gamesWon / p.gamesPlayed) * 100);
        return (
          <div
            key={p.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 6px",
              borderRadius: "var(--radius-sm)",
              borderBottom: i < ranked.length - 1 ? "1px solid var(--line)" : "none",
            }}
          >
            <span
              className="mono"
              style={{
                width: 20,
                fontSize: 12.5,
                color: i === 0 ? "var(--optic)" : "var(--sage)",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              {i === 0 ? <Trophy size={12} /> : i + 1}
            </span>
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: "var(--surface-raised)",
                color: "var(--chalk)",
                fontSize: 10.5,
                fontWeight: 700,
                fontFamily: "var(--font-display)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {initials(p.name)}
            </span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--chalk)" }}>{p.name}</span>
            <span className="mono" style={{ fontSize: 12, color: "var(--sage)" }}>
              {p.gamesWon}-{p.gamesPlayed - p.gamesWon}
            </span>
            <span
              className="mono"
              style={{ fontSize: 12, fontWeight: 700, color: "var(--optic)", width: 38, textAlign: "right" }}
            >
              {winRate}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
