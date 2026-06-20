import { useEffect, useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { useSession } from "../engine/useSession";

const money = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 2,
});

function parseNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function CourtCostCalculator() {
  const { state } = useSession();
  const checkedInPlayers = state.players.filter((player) => player.checkedIn).length;
  const [hourlyRate, setHourlyRate] = useState("0");
  const [hoursUsed, setHoursUsed] = useState("0");
  const [playerCount, setPlayerCount] = useState(String(Math.max(checkedInPlayers, 1)));

  useEffect(() => {
    setPlayerCount((current) => {
      const currentValue = parseNumber(current);
      if (currentValue <= 0 || currentValue === checkedInPlayers) {
        return String(Math.max(checkedInPlayers, 1));
      }
      return current;
    });
  }, [checkedInPlayers]);

  const rate = parseNumber(hourlyRate);
  const hours = parseNumber(hoursUsed);
  const players = Math.max(parseNumber(playerCount), 1);
  const total = rate * hours;
  const eachPays = players > 0 ? total / players : 0;

  const summary = useMemo(
    () => [
      { label: "Total court cost", value: money.format(total) },
      { label: "Each player pays", value: money.format(eachPays) },
    ],
    [eachPays, total]
  );

  return (
    <section
      style={{
        background: "var(--court-deep)",
        border: "1px solid var(--line)",
        borderRadius: "var(--radius-lg)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Calculator size={16} color="var(--optic)" />
        <div>
          <h3 style={{ fontSize: 14.5, color: "var(--chalk)" }}>Court cost split</h3>
          <p style={{ fontSize: 11.5, color: "var(--sage)", marginTop: 2 }}>
            Divide the court fee across the players you want.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <Field
          label="Price per hour"
          value={hourlyRate}
          onChange={setHourlyRate}
          placeholder="0.00"
          type="number"
          step="0.01"
          min="0"
        />
        <Field
          label="Hours used"
          value={hoursUsed}
          onChange={setHoursUsed}
          placeholder="0"
          type="number"
          step="0.25"
          min="0"
        />
        <Field
          label="Players splitting"
          value={playerCount}
          onChange={setPlayerCount}
          placeholder={String(Math.max(checkedInPlayers, 1))}
          type="number"
          step="1"
          min="1"
          hint={`Defaults to ${Math.max(checkedInPlayers, 1)} checked-in player${checkedInPlayers === 1 ? "" : "s"}`}
        />
      </div>

      <div
        style={{
          display: "grid",
          gap: 10,
          padding: 12,
          borderRadius: "var(--radius-md)",
          background: "rgba(244,251,238,0.05)",
          border: "1px solid rgba(244,251,238,0.1)",
        }}
      >
        {summary.map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontSize: 12, color: "var(--sage)" }}>{item.label}</span>
            <strong style={{ fontSize: 14, color: "var(--chalk)" }}>{item.value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type,
  step,
  min,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type: string;
  step?: string;
  min?: string;
  hint?: string;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontSize: 11, color: "var(--sage)" }}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        step={step}
        min={min}
        style={{
          width: "100%",
          background: "var(--court-deep)",
          border: "1px solid var(--line-strong)",
          borderRadius: "var(--radius-sm)",
          padding: "9px 10px",
          color: "var(--chalk)",
          fontSize: 13,
        }}
      />
      {hint && <span style={{ fontSize: 11, color: "var(--sage-dim)" }}>{hint}</span>}
    </label>
  );
}