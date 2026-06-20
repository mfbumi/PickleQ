import { Trash2 } from "lucide-react";
import type { Player } from "../engine/types";
import { initials } from "../engine/utils";
import { useSession } from "../engine/useSession";

export default function PlayerRoster({ players }: { players: Player[] }) {
  const { toggleCheckIn, removePlayer } = useSession();
  const sorted = [...players].sort((a, b) => a.joinedAt - b.joinedAt);

  if (sorted.length === 0) {
    return (
      <p style={{ fontSize: 13, color: "var(--sage-dim)", padding: "4px 2px" }}>
        No players yet. Add names above to build today's roster.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflowY: "auto" }}>
      {sorted.map((p) => (
        <div
          key={p.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "7px 8px",
            borderRadius: "var(--radius-sm)",
            background: p.checkedIn ? "transparent" : "rgba(244,251,238,0.02)",
            opacity: p.checkedIn ? 1 : 0.55,
          }}
        >
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--surface-raised)",
              color: "var(--chalk)",
              fontSize: 11,
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
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--chalk)" }}>{p.name}</p>
            <p style={{ fontSize: 11, color: "var(--sage)" }}>
              {p.gamesPlayed} played · {p.gamesWon} won
            </p>
          </div>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              color: "var(--sage)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={p.checkedIn}
              onChange={() => toggleCheckIn(p.id)}
              style={{ accentColor: "var(--optic)" }}
            />
            In
          </label>
          <button
            onClick={() => removePlayer(p.id)}
            style={{ background: "transparent", border: "none", color: "var(--sage-dim)", padding: 4 }}
            title="Remove player"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
