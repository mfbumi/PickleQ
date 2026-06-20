import { AlertTriangle, ListOrdered } from "lucide-react";
import type { Player } from "../engine/types";
import type { NextGroupResult } from "../engine/rotation";
import PaddleChip from "./PaddleChip";
import { estimatedWaitLabel } from "../engine/rotation";

interface QueueRackProps {
  waiting: Player[];
  flex: Player[];
  resting: Player[];
  seatsPerGroup: number;
  previewCount: number;
  upcomingMatches: NextGroupResult[];
  onTogglePlayer: (id: string) => void;
}

export default function QueueRack({ waiting, flex, resting, seatsPerGroup, previewCount, upcomingMatches, onTogglePlayer }: QueueRackProps) {
  const flexIds = new Set(flex.map((p) => p.id));
  const sorted = [...waiting].sort((a, b) => a.waitingSince - b.waitingSince);
  const core = sorted.filter((p) => !flexIds.has(p.id));

  return (
    <div
      style={{
        background: "var(--court-deep)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-lg)",
        padding: 18,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ListOrdered size={16} color="var(--sage)" />
          <h3 style={{ fontSize: 14.5, color: "var(--chalk)" }}>The Rack — waiting to play</h3>
        </div>
        <span className="mono" style={{ fontSize: 12, color: "var(--sage)" }}>
          {waiting.length} waiting
        </span>
      </div>

      <div
        style={{
          background: "rgba(215,255,61,0.14)",
          border: "1px solid rgba(215,255,61,0.34)",
          borderRadius: "var(--radius-md)",
          padding: 14,
          marginBottom: 14,
          boxShadow: "inset 0 0 0 1px rgba(244,251,238,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
          <div>
            <p style={{ fontSize: 12, color: "var(--sage)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Next {previewCount} matches
            </p>
            <p style={{ fontSize: 14, color: "var(--chalk)", fontWeight: 700, marginTop: 3 }}>
              {upcomingMatches[0]?.group.length ? "Queue visible ahead of every court" : "Waiting for more players"}
            </p>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {Array.from({ length: Math.max(1, previewCount) }, (_, index) => (
              <span
                key={`slot-${index}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: 70,
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: "rgba(244,251,238,0.08)",
                  color: "var(--chalk)",
                  border: "1px solid rgba(244,251,238,0.14)",
                  fontSize: 11.5,
                  fontWeight: 800,
                }}
              >
                Next up {index + 1}
              </span>
            ))}
          </div>
        </div>

        {upcomingMatches.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {upcomingMatches.slice(0, 2).map((match, index) => {
              const matchIds = new Set(match.group.map((player) => player.id));
              const ready = match.group.length >= seatsPerGroup;
              const label = index === 0 ? "Game 1" : "Game 2";
              return (
                <div
                  key={`${label}-${match.group.map((player) => player.id).join("-") || index}`}
                  style={{
                    background: "rgba(8,44,33,0.35)",
                    border: "1px solid rgba(244,251,238,0.1)",
                    borderRadius: "var(--radius-md)",
                    padding: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
                    <p style={{ fontSize: 11.5, color: "var(--sage)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
                    <span className="mono" style={{ fontSize: 11.5, color: "var(--optic)" }}>
                      {match.group.length}/{seatsPerGroup}
                    </span>
                  </div>

                  {ready ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {match.teamA.map((player) => (
                          <PaddleChip key={player.id} player={player} variant={matchIds.has(player.id) ? "next" : "waiting"} />
                        ))}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--sage)" }}>
                        <div style={{ flex: 1, borderTop: "1px dashed var(--line-strong)" }} />
                        <span style={{ fontSize: 11 }}>vs.</span>
                        <div style={{ flex: 1, borderTop: "1px dashed var(--line-strong)" }} />
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {match.teamB.map((player) => (
                          <PaddleChip key={player.id} player={player} variant={matchIds.has(player.id) ? "next" : "waiting"} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: 12.5, color: "var(--sage)", lineHeight: 1.5 }}>
                      Need {seatsPerGroup - match.group.length} more player{seatsPerGroup - match.group.length > 1 ? "s" : ""} to lock this match.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 12.5, color: "var(--chalk)", lineHeight: 1.5, fontWeight: 600 }}>
              {waiting.length === 0 ? "No one is queued yet." : "Add a few more players and the next court lineup appears here."}
            </p>
            <p style={{ fontSize: 12, color: "var(--sage)", lineHeight: 1.5 }}>
              This preview always matches the number of courts you selected. Display only — not clickable.
            </p>
          </div>
        )}
      </div>

      {flex.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            background: "rgba(255,107,74,0.08)",
            border: "1px solid rgba(255,107,74,0.3)",
            borderRadius: "var(--radius-md)",
            padding: "10px 14px",
            marginBottom: 14,
          }}
        >
          <AlertTriangle size={16} color="var(--coral)" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontSize: 12.5, color: "var(--chalk)", lineHeight: 1.5 }}>
            <strong style={{ color: "var(--coral)" }}>
              {flex.length} flex player{flex.length > 1 ? "s" : ""}
            </strong>{" "}
            — not enough for a full group right now. They're first in line to sub into the next court
            that opens, or into King of the Court seats. Nobody's stuck waiting on an empty rule.
          </p>
        </div>
      )}

      {core.length === 0 && flex.length === 0 ? (
        <p style={{ fontSize: 13, color: "var(--sage-dim)", padding: "8px 2px" }}>
          The rack is empty — check players in to get them queued.
        </p>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: resting.length ? 16 : 0 }}>
          {core.map((p, i) => (
            <PaddleChip
              key={p.id}
              player={p}
              variant={i < seatsPerGroup ? "next" : "waiting"}
              positionLabel={estimatedWaitLabel(i, seatsPerGroup)}
              onClick={() => onTogglePlayer(p.id)}
            />
          ))}
          {flex.map((p) => (
            <PaddleChip key={p.id} player={p} variant="flex" onClick={() => onTogglePlayer(p.id)} />
          ))}
        </div>
      )}

      {resting.length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: "var(--sage-dim)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Resting
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {resting.map((p) => (
              <PaddleChip key={p.id} player={p} variant="resting" onClick={() => onTogglePlayer(p.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
