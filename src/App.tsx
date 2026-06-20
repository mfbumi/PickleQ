import { useState, type ReactNode } from "react";
import { SessionProvider } from "./engine/SessionStore";
import { useSession } from "./engine/useSession";
import { selectNextGroup } from "./engine/rotation";
import SessionBar from "./components/SessionBar";
import CourtCard from "./components/CourtCard";
import QueueRack from "./components/QueueRack";
import CourtCostCalculator from "./components/CourtCostCalculator";
import AddPlayerForm from "./components/AddPlayerForm";
import PlayerRoster from "./components/PlayerRoster";
import Leaderboard from "./components/Leaderboard";
import SettingsPanel from "./components/SettingsPanel";
import { Minus, Plus, Settings2, Trophy, Users } from "lucide-react";

type SidePanel = "roster" | "leaderboard" | "settings";
type Screen = "landing" | "menu" | "dashboard";

function HeroPill({ children }: { children: ReactNode }) {
  return <span className="hero-pill">{children}</span>;
}

function buildUpcomingMatches(
  waitingPlayers: ReturnType<typeof useSession>["waitingPlayers"],
  settings: ReturnType<typeof useSession>["state"]["settings"],
  count = 2
) {
  const upcoming = [] as ReturnType<typeof selectNextGroup>[];
  let remaining = [...waitingPlayers];

  for (let i = 0; i < count; i += 1) {
    const nextMatch = selectNextGroup(remaining, settings);
    upcoming.push(nextMatch);

    if (nextMatch.group.length === 0) break;
    const usedIds = new Set(nextMatch.group.map((player) => player.id));
    remaining = remaining.filter((player) => !usedIds.has(player.id));
  }

  return upcoming;
}

function MainApp({ initialPanel = "roster", courtCount }: { initialPanel?: SidePanel; courtCount: number }) {
  const {
    state,
    waitingPlayers,
    flexPlayers,
    addCourt,
    removeCourt,
    fillCourt,
    fillOpenSeat,
    endMatch,
    clearCourt,
    setCourtMode,
    toggleRest,
  } = useSession();
  const [panel, setPanel] = useState<SidePanel>(initialPanel);
  const [visibleCourtCount, setVisibleCourtCount] = useState(courtCount);

  const restingPlayers = state.players.filter((player) => player.checkedIn && player.status === "resting");
  const seatsPerGroup = state.settings.gameMode === "doubles" ? 4 : 2;
  const visibleCourts = state.courts.slice(0, Math.max(1, Math.min(visibleCourtCount, state.courts.length)));
  const previewCount = visibleCourts.length;
  const upcomingMatches = buildUpcomingMatches(waitingPlayers, state.settings, previewCount);

  function handleAddCourt() {
    addCourt();
    setVisibleCourtCount((count) => count + 1);
  }

  function handleRemoveCourt(id: string) {
    removeCourt(id);
    setVisibleCourtCount((count) => Math.max(courtCount, count - 1));
  }

  function canFillCourt(): boolean {
    const { group } = selectNextGroup(waitingPlayers, state.settings);
    return group.length >= seatsPerGroup;
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <SessionBar />

      <main className="app-main">
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {visibleCourts.map((court, index) => {
              const removable = index >= courtCount;
              return (
                <CourtCard
                  key={court.id}
                  court={court}
                  players={state.players}
                  canFill={canFillCourt()}
                  flexAvailable={flexPlayers.length > 0}
                  onFill={() => fillCourt(court.id)}
                  onFillOpenSeat={() => fillOpenSeat(court.id)}
                  onEnd={(winner) => endMatch(court.id, winner)}
                  onClear={() => clearCourt(court.id)}
                  onToggleMode={() => setCourtMode(court.id, court.mode === "kingOfCourt" ? "standard" : "kingOfCourt")}
                  removable={removable}
                  onRemove={removable ? () => handleRemoveCourt(court.id) : undefined}
                />
              );
            })}

            <button
              type="button"
              onClick={handleAddCourt}
              style={{
                minHeight: 220,
                borderRadius: "var(--radius-lg)",
                border: "1px dashed rgba(244,251,238,0.24)",
                background: "rgba(244,251,238,0.04)",
                color: "var(--chalk)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              <span
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: "var(--optic)",
                  color: "var(--court-deep)",
                  fontSize: 24,
                  lineHeight: 1,
                }}
              >
                +
              </span>
              <span>Add another court</span>
            </button>
          </div>

          <QueueRack
            waiting={waitingPlayers}
            flex={flexPlayers}
            resting={restingPlayers}
            seatsPerGroup={seatsPerGroup}
            previewCount={previewCount}
            upcomingMatches={upcomingMatches}
            onTogglePlayer={toggleRest}
          />
        </div>

        <aside
          className="app-aside"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--radius-lg)",
            padding: 18,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <CourtCostCalculator />

          <div style={{ display: "flex", gap: 6, background: "var(--court-deep)", borderRadius: 999, padding: 4 }}>
            <TabButton active={panel === "roster"} onClick={() => setPanel("roster")} icon={<Users size={13} />} label="Players" />
            <TabButton active={panel === "leaderboard"} onClick={() => setPanel("leaderboard")} icon={<Trophy size={13} />} label="Standings" />
            <TabButton active={panel === "settings"} onClick={() => setPanel("settings")} icon={<Settings2 size={13} />} label="Settings" />
          </div>

          {panel === "roster" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <AddPlayerForm />
              <PlayerRoster players={state.players} />
            </div>
          )}
          {panel === "leaderboard" && <Leaderboard players={state.players} />}
          {panel === "settings" && <SettingsPanel />}
        </aside>
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        padding: "7px 0",
        borderRadius: 999,
        border: "none",
        background: active ? "var(--optic)" : "transparent",
        color: active ? "var(--court-deep)" : "var(--sage)",
        fontWeight: 700,
        fontSize: 11.5,
      }}
    >
      {icon} {label}
    </button>
  );
}

function MainMenu({ courtCount, maxCourts, onDecrease, onIncrease, onStart }: { courtCount: number; maxCourts: number; onDecrease: () => void; onIncrease: () => void; onStart: () => void }) {
  return (
    <main className="landing-page">
      <div className="landing-backdrop" aria-hidden="true" />

      <section className="landing-hero menu-shell">
        <HeroPill>Main menu</HeroPill>
        <h1>Pikolkoga Gaw</h1>
        <p className="landing-copy">mas daghan pa raba ta ug pickleball players kaysa kahoy</p>

        <div className="court-selector">
          <span className="court-selector-label">How many courts do you want to use?</span>

          <div className="court-stepper">
            <button
              type="button"
              className="court-stepper-btn"
              onClick={onDecrease}
              disabled={courtCount <= 1}
              aria-label="Decrease court count"
            >
              <Minus size={18} />
            </button>

            <div className="court-count">
              <span className="court-count-value">{courtCount}</span>
              <span className="court-count-label">{courtCount === 1 ? "court" : "courts"}</span>
            </div>

            <button
              type="button"
              className="court-stepper-btn"
              onClick={onIncrease}
              disabled={courtCount >= maxCourts}
              aria-label="Increase court count"
            >
              <Plus size={18} />
            </button>
          </div>

          <button className="landing-cta landing-cta-wide" type="button" onClick={onStart}>
            Sugod nata gaw , Pindota lang ko
          </button>
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [courtCount, setCourtCount] = useState(1);

  return (
    <SessionProvider>
      {screen === "landing" && (
        <main className="landing-page">
          <div className="landing-backdrop" aria-hidden="true" />

          <section className="landing-hero">
            <HeroPill>Pickleball energy, stripped to the core</HeroPill>
            <h1>Pikolkoga Gaw</h1>
            <p className="landing-copy">mas daghan pa raba ta ug pickleball players kaysa kahoy</p>
            <button className="landing-cta" type="button" onClick={() => setScreen("menu") }>
              Sugod nata gaw , Pindota lang ko
            </button>
          </section>
        </main>
      )}

      {screen === "menu" && (
        <MainMenu
          courtCount={courtCount}
          maxCourts={4}
          onDecrease={() => setCourtCount((value) => Math.max(1, value - 1))}
          onIncrease={() => setCourtCount((value) => Math.min(4, value + 1))}
          onStart={() => setScreen("dashboard")}
        />
      )}

      {screen === "dashboard" && <MainApp initialPanel="roster" courtCount={courtCount} />}
    </SessionProvider>
  );
}
