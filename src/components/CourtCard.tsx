import { useEffect, useState } from "react";
import { Crown, Square, Timer, Users, X } from "lucide-react";
import type { Court, Player } from "../engine/types";
import { formatElapsed, initials } from "../engine/utils";

interface CourtCardProps {
  court: Court;
  players: Player[];
  canFill: boolean;
  flexAvailable: boolean;
  onFill: () => void;
  onFillOpenSeat: () => void;
  onEnd: (winner: "A" | "B") => void;
  onClear: () => void;
  onToggleMode: () => void;
  onRemove?: () => void;
  removable?: boolean;
}

function findPlayers(ids: string[] | undefined, players: Player[]): Player[] {
  if (!ids) return [];
  return ids.map((id) => players.find((p) => p.id === id)).filter(Boolean) as Player[];
}

function TeamRow({ names, won }: { names: Player[]; won?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {names.map((p) => (
        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: won ? "var(--optic)" : "var(--surface-raised)",
              color: "var(--court-deep)",
              fontSize: 10.5,
              fontWeight: 700,
              fontFamily: "var(--font-display)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid var(--court)",
              flexShrink: 0,
            }}
          >
            {initials(p.name)}
          </span>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--chalk)", lineHeight: 1.15 }}>
            {p.name}
          </span>
        </div>
      ))}
      {won && (
        <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--optic)", fontSize: 11.5, fontWeight: 700 }}>
          <Crown size={13} color="var(--optic)" /> Holding court
        </span>
      )}
    </div>
  );
}

export default function CourtCard({
  court,
  players,
  canFill,
  flexAvailable,
  onFill,
  onFillOpenSeat,
  onEnd,
  onClear,
  onToggleMode,
  onRemove,
  removable,
}: CourtCardProps) {
  const [now, setNow] = useState(() => Date.now());
  const [pendingWinner, setPendingWinner] = useState<"A" | "B" | null>(null);
  const teamAPlayers = findPlayers(court.teamA?.playerIds, players);
  const teamBPlayers = findPlayers(court.teamB?.playerIds, players);
  const isLive = Boolean(court.teamA && court.teamB);
  const isHalfSeated = Boolean(court.teamA || court.teamB) && !isLive;
  const seatedTeam = court.teamA ? teamAPlayers : teamBPlayers;

  useEffect(() => {
    if (!court.startedAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [court.startedAt]);

  function startNextMatch() {
    if (!pendingWinner) return;
    onEnd(pendingWinner);
    if (court.mode !== "kingOfCourt") {
      onFill();
    }
    setPendingWinner(null);
  }

  return (
    <div
      style={{
        background: "var(--surface)",
        border: `1px solid ${isLive ? "var(--line-strong)" : "var(--line)"}`,
        borderRadius: "var(--radius-lg)",
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        minHeight: 220,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: 16, color: "var(--chalk)" }}>{court.label}</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {court.startedAt && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 8px",
                borderRadius: 999,
                background: "rgba(244,251,238,0.06)",
                color: "var(--sage)",
                fontSize: 11.5,
                fontWeight: 600,
              }}
            >
              <Timer size={12} /> {formatElapsed(now - court.startedAt)}
            </span>
          )}
          <button
            onClick={onToggleMode}
            title="Toggle King of the Court mode"
            style={{
              fontSize: 10.5,
              fontWeight: 600,
              padding: "4px 9px",
              borderRadius: 999,
              border: `1px solid ${court.mode === "kingOfCourt" ? "var(--optic)" : "var(--line-strong)"}`,
              background: court.mode === "kingOfCourt" ? "rgba(215,255,61,0.14)" : "transparent",
              color: court.mode === "kingOfCourt" ? "var(--optic)" : "var(--sage)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Crown size={11} /> {court.mode === "kingOfCourt" ? "King of Court" : "Standard"}
          </button>
          {(isLive || isHalfSeated) && (
            <button
              onClick={onClear}
              title="Clear court"
              style={{ background: "transparent", border: "none", color: "var(--sage)", padding: 4 }}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {!isLive && !isHalfSeated ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            color: "var(--sage)",
            padding: "10px 0",
          }}
        >
          <Square size={26} strokeWidth={1.5} />
          <p style={{ fontSize: 13, textAlign: "center" }}>
            {canFill ? "Court's open — ready to fill" : flexAvailable ? "Waiting on one more flex player" : "Not enough players waiting"}
          </p>
          <button
            onClick={onFill}
            disabled={!canFill}
            style={{
              background: canFill ? "var(--optic)" : "rgba(244,251,238,0.06)",
              color: canFill ? "var(--court-deep)" : "var(--sage-dim)",
              border: "none",
              borderRadius: 999,
              padding: "9px 20px",
              fontWeight: 700,
              fontSize: 13.5,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Users size={15} /> Fill court
          </button>
        </div>
      ) : isHalfSeated ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, justifyContent: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(215,255,61,0.1)",
              border: "1px solid rgba(215,255,61,0.3)",
              borderRadius: "var(--radius-md)",
              padding: "8px 12px",
            }}
          >
            <Crown size={14} color="var(--optic)" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: "var(--chalk)", lineHeight: 1.4 }}>
              <strong style={{ color: "var(--optic)" }}>Staying on:</strong> won last game, holding the court
            </p>
          </div>
          <TeamRow names={seatedTeam} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--sage)" }}>
            <div style={{ flex: 1, borderTop: "1px dashed var(--line-strong)" }} />
            <span style={{ fontSize: 11 }}>vs.</span>
            <div style={{ flex: 1, borderTop: "1px dashed var(--line-strong)" }} />
          </div>
          <button
            onClick={onFillOpenSeat}
            disabled={!flexAvailable}
            style={{
              background: flexAvailable ? "var(--coral)" : "rgba(244,251,238,0.06)",
              color: flexAvailable ? "var(--court-deep)" : "var(--sage-dim)",
              border: "none",
              borderRadius: 999,
              padding: "9px 0",
              fontWeight: 700,
              fontSize: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Users size={15} /> {flexAvailable ? "Sub in flex player(s)" : "Waiting on a challenger"}
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <TeamRow names={teamAPlayers} />
              <button
                onClick={() => setPendingWinner("A")}
                style={{
                  border: "none",
                  borderRadius: 999,
                  padding: "10px 16px",
                  background: "var(--optic)",
                  color: "var(--court-deep)",
                  fontWeight: 800,
                  fontSize: 13,
                }}
              >
                A wins
              </button>
            </div>
            <div
              style={{
                height: 1,
                background: "var(--line)",
                margin: "2px 0",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <TeamRow names={teamBPlayers} />
              <button
                onClick={() => setPendingWinner("B")}
                style={{
                  border: "none",
                  borderRadius: 999,
                  padding: "10px 16px",
                  background: "var(--coral)",
                  color: "var(--court-deep)",
                  fontWeight: 800,
                  fontSize: 13,
                }}
              >
                B wins
              </button>
            </div>
          </div>

          <p style={{ marginTop: "auto", fontSize: 12, color: "var(--sage)", textAlign: "center" }}>
            Tap the winning team to finish the match.
          </p>
        </>
      )}

      {pendingWinner && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Start next match"
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(4, 12, 16, 0.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 10,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 260,
              background: "var(--surface-raised)",
              border: "1px solid var(--line-strong)",
              borderRadius: "var(--radius-lg)",
              padding: 16,
              boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <strong style={{ color: "var(--chalk)", fontSize: 15 }}>Start next match?</strong>
              <span style={{ color: "var(--sage)", fontSize: 12.5 }}>
                {pendingWinner === "A" ? "Side A" : "Side B"} won this round.
              </span>
            </div>

            <button
              onClick={startNextMatch}
              style={{
                border: "none",
                borderRadius: 999,
                padding: "11px 14px",
                background: "var(--optic)",
                color: "var(--court-deep)",
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              Start next match
            </button>

            <button
              onClick={() => setPendingWinner(null)}
              style={{
                border: "1px solid var(--line-strong)",
                borderRadius: 999,
                padding: "10px 14px",
                background: "transparent",
                color: "var(--sage)",
                fontWeight: 700,
                fontSize: 12.5,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {removable && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          title="Remove added court"
          style={{
            marginTop: "auto",
            border: "1px solid rgba(255,107,74,0.35)",
            background: "rgba(255,107,74,0.08)",
            color: "var(--coral)",
            borderRadius: 999,
            padding: "8px 12px",
            fontWeight: 700,
            fontSize: 12.5,
            alignSelf: "flex-start",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <X size={14} /> Remove court
        </button>
      )}
    </div>
  );
}
