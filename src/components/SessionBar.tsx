import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { useSession } from "../engine/useSession";
import { formatElapsed } from "../engine/utils";

export default function SessionBar() {
  const { state, renameSession } = useSession();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(state.name);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const checkedInCount = state.players.filter((p) => p.checkedIn).length;
  const activeCourts = state.courts.filter((c) => c.teamA && c.teamB).length;

  function commit() {
    if (draft.trim()) renameSession(draft.trim());
    setEditing(false);
  }

  return (
    <header
      className="session-bar"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 28px",
        borderBottom: "1px solid var(--line)",
        background: "var(--court-deep)",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Logo />
        <div style={{ width: 1, height: 26, background: "var(--line-strong)" }} />
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: "1px solid var(--optic)",
              color: "var(--chalk)",
              fontSize: 16,
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              padding: "2px 0",
            }}
          />
        ) : (
          <h1
            onClick={() => setEditing(true)}
            style={{ fontSize: 16, fontWeight: 600, color: "var(--chalk)", cursor: "pointer" }}
            title="Click to rename session"
          >
            {state.name}
          </h1>
        )}
      </div>

      <div className="session-stats" style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 12.5, color: "var(--sage)" }}>
        <span className="mono" style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Timer size={13} /> {formatElapsed(now - state.startedAt)}
        </span>
        <span>
          <strong style={{ color: "var(--chalk)" }}>{checkedInCount}</strong> checked in
        </span>
        <span>
          <strong style={{ color: "var(--chalk)" }}>{activeCourts}</strong>/{state.courts.length} courts live
        </span>
      </div>
    </header>
  );
}

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="var(--optic)" />
        <circle cx="9" cy="9" r="1.2" fill="var(--court-deep)" />
        <circle cx="14" cy="8.5" r="1.2" fill="var(--court-deep)" />
        <circle cx="16" cy="13" r="1.2" fill="var(--court-deep)" />
        <circle cx="11" cy="14" r="1.2" fill="var(--court-deep)" />
        <circle cx="8" cy="15" r="1.2" fill="var(--court-deep)" />
      </svg>
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16, color: "var(--chalk)" }}>
        Rally<span style={{ color: "var(--optic)" }}>Q</span>
      </span>
    </div>
  );
}
