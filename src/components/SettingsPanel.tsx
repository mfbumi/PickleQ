import { useSession } from "../engine/useSession";

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: () => void; label: string; hint: string }) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        cursor: "pointer",
        padding: "8px 0",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ accentColor: "var(--optic)", marginTop: 3 }}
      />
      <span>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--chalk)" }}>{label}</p>
        <p style={{ fontSize: 11.5, color: "var(--sage)", marginTop: 2 }}>{hint}</p>
      </span>
    </label>
  );
}

export default function SettingsPanel() {
  const { state, updateSettings } = useSession();
  const { settings } = state;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 6 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11, color: "var(--sage)", display: "block", marginBottom: 5 }}>Game mode</label>
          <select
            value={settings.gameMode}
            onChange={(e) => updateSettings({ gameMode: e.target.value as "doubles" | "singles" })}
            style={{
              width: "100%",
              background: "var(--court-deep)",
              border: "1px solid var(--line-strong)",
              borderRadius: "var(--radius-sm)",
              padding: "8px 10px",
              color: "var(--chalk)",
              fontSize: 13,
            }}
          >
            <option value="doubles">Doubles</option>
            <option value="singles">Singles</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11, color: "var(--sage)", display: "block", marginBottom: 5 }}>Points to win</label>
          <select
            value={settings.pointsToWin}
            onChange={(e) => updateSettings({ pointsToWin: Number(e.target.value) })}
            style={{
              width: "100%",
              background: "var(--court-deep)",
              border: "1px solid var(--line-strong)",
              borderRadius: "var(--radius-sm)",
              padding: "8px 10px",
              color: "var(--chalk)",
              fontSize: 13,
            }}
          >
            <option value={11}>11</option>
            <option value={15}>15</option>
            <option value={21}>21</option>
          </select>
        </div>
      </div>

      <Toggle
        checked={settings.skillBalancing}
        onChange={() => updateSettings({ skillBalancing: !settings.skillBalancing })}
        label="Balance by skill"
        hint="When rating players, keeps teams close in average skill."
      />
      <Toggle
        checked={settings.avoidRepeatPartners}
        onChange={() => updateSettings({ avoidRepeatPartners: !settings.avoidRepeatPartners })}
        label="Mix up partners"
        hint="Avoids pairing the same two people again right away."
      />
    </div>
  );
}
