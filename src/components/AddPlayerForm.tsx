import { useState } from "react";
import { UserPlus } from "lucide-react";
import { useSession } from "../engine/useSession";

export default function AddPlayerForm() {
  const { addPlayer } = useSession();
  const [name, setName] = useState("");
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState("");

  function submitSingle(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addPlayer(name.trim());
    setName("");
  }

  function submitBulk() {
    const names = bulkText
      .split("\n")
      .map((n) => n.trim())
      .filter(Boolean);
    names.forEach((n) => addPlayer(n));
    setBulkText("");
    setBulkMode(false);
  }

  if (bulkMode) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <textarea
          autoFocus
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          placeholder={"One name per line\nMaria Cruz\nJun Tan\nAlex Reyes"}
          rows={4}
          style={{
            background: "var(--court-deep)",
            border: "1px solid var(--line-strong)",
            borderRadius: "var(--radius-md)",
            padding: 10,
            color: "var(--chalk)",
            fontSize: 13.5,
            resize: "vertical",
            fontFamily: "var(--font-body)",
          }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={submitBulk}
            style={{
              flex: 1,
              background: "var(--optic)",
              color: "var(--court-deep)",
              border: "none",
              borderRadius: 999,
              padding: "9px 0",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            Add all
          </button>
          <button
            onClick={() => setBulkMode(false)}
            style={{
              background: "transparent",
              border: "1px solid var(--line-strong)",
              color: "var(--sage)",
              borderRadius: 999,
              padding: "9px 16px",
              fontSize: 13,
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submitSingle}
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto auto",
        gap: 8,
        alignItems: "center",
      }}
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Player name"
        style={{
          background: "var(--court-deep)",
          border: "1px solid var(--line-strong)",
          borderRadius: 999,
          padding: "10px 16px",
          color: "var(--chalk)",
          fontSize: 13.5,
          minWidth: 0,
        }}
      />
      <button
        type="submit"
        style={{
          background: "var(--optic)",
          color: "var(--court-deep)",
          border: "none",
          borderRadius: 999,
          padding: "10px 16px",
          fontWeight: 700,
          fontSize: 13,
          display: "flex",
          alignItems: "center",
          gap: 6,
          whiteSpace: "nowrap",
          height: 40,
        }}
      >
        <UserPlus size={15} /> Add
      </button>
      <button
        type="button"
        onClick={() => setBulkMode(true)}
        style={{
          background: "transparent",
          border: "1px solid var(--line-strong)",
          color: "var(--sage)",
          borderRadius: 999,
          padding: "10px 14px",
          fontSize: 12.5,
          whiteSpace: "nowrap",
          height: 40,
        }}
      >
        Bulk add
      </button>
    </form>
  );
}
