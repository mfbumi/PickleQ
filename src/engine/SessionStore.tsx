import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import type { Court, MatchRecord, Player, SessionSettings, SessionState } from "./types";
import { selectKingOfCourtReplacements, selectNextGroup } from "./rotation";
import { uid } from "./utils";

const STORAGE_KEY = "rallyq.session.v1";

const defaultSettings: SessionSettings = {
  gameMode: "doubles",
  pointsToWin: 11,
  defaultCourtMode: "standard",
  skillBalancing: true,
  avoidRepeatPartners: true,
};

function makeCourts(count: number, mode = defaultSettings.defaultCourtMode): Court[] {
  return Array.from({ length: count }, (_, i) => ({
    id: uid("court"),
    label: `Court ${i + 1}`,
    mode,
    teamA: null,
    teamB: null,
    scoreA: 0,
    scoreB: 0,
    startedAt: null,
    active: true,
  }));
}

function freshState(): SessionState {
  return {
    name: "Saturday Open Play",
    players: [],
    courts: makeCourts(4),
    history: [],
    settings: { ...defaultSettings },
    startedAt: Date.now(),
  };
}

function loadState(): SessionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const parsed = JSON.parse(raw) as SessionState;
    if (!parsed.courts || !parsed.players) return freshState();
    return parsed;
  } catch {
    return freshState();
  }
}

export interface SessionContextValue {
  state: SessionState;
  // players
  addPlayer: (name: string, rating?: number) => void;
  removePlayer: (id: string) => void;
  toggleCheckIn: (id: string) => void;
  toggleRest: (id: string) => void;
  // courts
  addCourt: () => void;
  removeCourt: (id: string) => void;
  setCourtMode: (id: string, mode: Court["mode"]) => void;
  fillCourt: (courtId: string) => void;
  fillOpenSeat: (courtId: string) => void;
  updateScore: (courtId: string, team: "A" | "B", delta: number) => void;
  endMatch: (courtId: string, winner?: "A" | "B") => void;
  clearCourt: (courtId: string) => void;
  // settings
  updateSettings: (patch: Partial<SessionSettings>) => void;
  renameSession: (name: string) => void;
  resetSession: () => void;
  // derived
  waitingPlayers: Player[];
  flexPlayers: Player[];
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addPlayer = useCallback((name: string, rating?: number) => {
    setState((s) => {
      const now = Date.now();
      const player: Player = {
        id: uid("p"),
        name: name.trim(),
        rating,
        gamesPlayed: 0,
        gamesWon: 0,
        status: "waiting",
        waitingSince: now,
        partnerHistory: [],
        opponentHistory: [],
        checkedIn: true,
        joinedAt: now,
      };
      return { ...s, players: [...s.players, player] };
    });
  }, []);

  const removePlayer = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      players: s.players.filter((p) => p.id !== id),
      courts: s.courts.map((c) => ({
        ...c,
        teamA: c.teamA && (c.teamA.playerIds.includes(id) ? null : c.teamA),
        teamB: c.teamB && (c.teamB.playerIds.includes(id) ? null : c.teamB),
      })),
    }));
  }, []);

  const toggleCheckIn = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      players: s.players.map((p) =>
        p.id === id
          ? {
              ...p,
              checkedIn: !p.checkedIn,
              status: !p.checkedIn ? "waiting" : "resting",
              waitingSince: !p.checkedIn ? Date.now() : p.waitingSince,
            }
          : p
      ),
    }));
  }, []);

  const toggleRest = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      players: s.players.map((p) =>
        p.id === id
          ? {
              ...p,
              status: p.status === "resting" ? "waiting" : "resting",
              waitingSince: p.status === "resting" ? Date.now() : p.waitingSince,
            }
          : p
      ),
    }));
  }, []);

  const addCourt = useCallback(() => {
    setState((s) => ({ ...s, courts: [...s.courts, ...makeCourts(1, s.settings.defaultCourtMode)] }));
  }, []);

  const removeCourt = useCallback((id: string) => {
    setState((s) => {
      const court = s.courts.find((c) => c.id === id);
      const freed = new Set<string>();
      if (court?.teamA) court.teamA.playerIds.forEach((pid) => freed.add(pid));
      if (court?.teamB) court.teamB.playerIds.forEach((pid) => freed.add(pid));
      return {
        ...s,
        courts: s.courts.filter((c) => c.id !== id),
        players: s.players.map((p) =>
          freed.has(p.id) ? { ...p, status: "waiting", waitingSince: Date.now() } : p
        ),
      };
    });
  }, []);

  const setCourtMode = useCallback((id: string, mode: Court["mode"]) => {
    setState((s) => ({
      ...s,
      courts: s.courts.map((c) => (c.id === id ? { ...c, mode } : c)),
    }));
  }, []);

  const fillCourt = useCallback((courtId: string) => {
    setState((s) => {
      const court = s.courts.find((c) => c.id === courtId);
      if (!court || court.teamA || court.teamB) return s;

      const waiting = s.players.filter((p) => p.checkedIn && p.status === "waiting");
      const { group, teamA, teamB } = selectNextGroup(waiting, s.settings);
      if (group.length === 0) return s;

      const groupIds = new Set(group.map((p) => p.id));
      const now = Date.now();

      const updatedPlayers = s.players.map((p) => {
        if (!groupIds.has(p.id)) return p;
        const isTeamA = teamA.some((tp) => tp.id === p.id);
        const teammates = (isTeamA ? teamA : teamB).filter((tp) => tp.id !== p.id).map((tp) => tp.id);
        const opponents = (isTeamA ? teamB : teamA).map((tp) => tp.id);
        return {
          ...p,
          status: "playing" as const,
          partnerHistory: [...p.partnerHistory, ...teammates].slice(-6),
          opponentHistory: [...p.opponentHistory, ...opponents].slice(-6),
        };
      });

      const updatedCourts = s.courts.map((c) =>
        c.id === courtId
          ? {
              ...c,
              teamA: { playerIds: [teamA[0].id, teamA[1]?.id ?? teamA[0].id] as [string, string] },
              teamB: { playerIds: [teamB[0].id, teamB[1]?.id ?? teamB[0].id] as [string, string] },
              scoreA: 0,
              scoreB: 0,
              startedAt: now,
            }
          : c
      );

      return { ...s, players: updatedPlayers, courts: updatedCourts };
    });
  }, []);

  /**
   * Fills the single open side of a King-of-Court court that's sitting with
   * only one team seated (winners waiting on a replacement opponent). Pulls
   * the fairest available players — usually exactly the flex player(s) — into
   * the empty seats without disturbing the team that's already seated.
   */
  const fillOpenSeat = useCallback((courtId: string) => {
    setState((s) => {
      const court = s.courts.find((c) => c.id === courtId);
      if (!court) return s;
      const openSide: "teamA" | "teamB" | null = !court.teamA ? "teamA" : !court.teamB ? "teamB" : null;
      if (!openSide) return s;

      const seatedTeam = court.teamA ?? court.teamB;
      if (!seatedTeam) return s;

      const seatsNeeded = seatedTeam.playerIds[0] === seatedTeam.playerIds[1] ? 1 : 2;
      const waiting = s.players.filter((p) => p.checkedIn && p.status === "waiting");
      const ranked = [...waiting].sort((a, b) => {
        const scoreA = a.gamesPlayed * 100 - (Date.now() - a.waitingSince) / 60000;
        const scoreB = b.gamesPlayed * 100 - (Date.now() - b.waitingSince) / 60000;
        return scoreA - scoreB;
      });
      const incoming = ranked.slice(0, seatsNeeded);
      if (incoming.length < seatsNeeded) return s;

      const incomingIds = new Set(incoming.map((p) => p.id));
      const now = Date.now();

      const updatedPlayers = s.players.map((p) =>
        incomingIds.has(p.id) ? { ...p, status: "playing" as const } : p
      );

      const updatedCourts = s.courts.map((c) =>
        c.id === courtId
          ? {
              ...c,
              [openSide]: { playerIds: [incoming[0].id, incoming[1]?.id ?? incoming[0].id] },
              scoreA: 0,
              scoreB: 0,
              startedAt: now,
            }
          : c
      );

      return { ...s, players: updatedPlayers, courts: updatedCourts };
    });
  }, []);

  const updateScore = useCallback((courtId: string, team: "A" | "B", delta: number) => {
    setState((s) => ({
      ...s,
      courts: s.courts.map((c) => {
        if (c.id !== courtId) return c;
        if (team === "A") return { ...c, scoreA: Math.max(0, c.scoreA + delta) };
        return { ...c, scoreB: Math.max(0, c.scoreB + delta) };
      }),
    }));
  }, []);

  const endMatch = useCallback((courtId: string, winnerOverride?: "A" | "B") => {
    setState((s) => {
      const court = s.courts.find((c) => c.id === courtId);
      if (!court || !court.teamA || !court.teamB) return s;

      const winner: "A" | "B" | null =
        winnerOverride ?? (court.scoreA === court.scoreB ? null : court.scoreA > court.scoreB ? "A" : "B");

      const record: MatchRecord = {
        id: uid("m"),
        courtId: court.id,
        courtLabel: court.label,
        teamA: court.teamA.playerIds,
        teamB: court.teamB.playerIds,
        scoreA: court.scoreA,
        scoreB: court.scoreB,
        winner,
        startedAt: court.startedAt ?? Date.now(),
        endedAt: Date.now(),
      };

      const now = Date.now();
      const playingIds = new Set([...court.teamA.playerIds, ...court.teamB.playerIds]);
      const winningIds = new Set(winner === "A" ? court.teamA.playerIds : winner === "B" ? court.teamB.playerIds : []);

      let updatedCourts: typeof s.courts;
      let updatedPlayers = s.players.map((p) => {
        if (!playingIds.has(p.id)) return p;
        return {
          ...p,
          gamesPlayed: p.gamesPlayed + 1,
          gamesWon: p.gamesWon + (winningIds.has(p.id) ? 1 : 0),
        };
      });

      if (court.mode === "kingOfCourt" && winner) {
        // King of the Court: winners stay seated, losers rotate to the back.
        const losingIds = winner === "A" ? court.teamB!.playerIds : court.teamA!.playerIds;
        updatedPlayers = updatedPlayers.map((p) =>
          losingIds.includes(p.id) ? { ...p, status: "waiting" as const, waitingSince: now } : p
        );

        const waitingPool = updatedPlayers.filter(
          (p) => p.checkedIn && p.status === "waiting" && !losingIds.includes(p.id)
        );
        const { incoming } = selectKingOfCourtReplacements(waitingPool, losingIds.length, s.settings);
        const incomingIds = new Set(incoming.map((p) => p.id));

        updatedPlayers = updatedPlayers.map((p) =>
          incomingIds.has(p.id) ? { ...p, status: "playing" as const } : p
        );

        if (incoming.length === losingIds.length) {
          const newSide = winner === "A" ? "teamB" : "teamA";
          updatedCourts = s.courts.map((c) =>
            c.id === courtId
              ? {
                  ...c,
                  [newSide]: { playerIds: [incoming[0].id, incoming[1]?.id ?? incoming[0].id] },
                  scoreA: 0,
                  scoreB: 0,
                  startedAt: now,
                }
              : c
          );
        } else {
          // Not enough waiting players to fill the freed seats yet. The
          // winning team stays seated on the court — they don't lose their
          // spot just because a replacement hasn't arrived — and the
          // losing side's slot opens up, clearly showing "waiting on N
          // flex player(s)" instead of resetting the whole court.
          const winningSide = winner === "A" ? "teamA" : "teamB";
          const losingSide = winner === "A" ? "teamB" : "teamA";
          updatedCourts = s.courts.map((c) =>
            c.id === courtId
              ? {
                  ...c,
                  [winningSide]: c[winningSide],
                  [losingSide]: null,
                  scoreA: 0,
                  scoreB: 0,
                  startedAt: null,
                }
              : c
          );
        }
      } else {
        updatedPlayers = updatedPlayers.map((p) =>
          playingIds.has(p.id) ? { ...p, status: "waiting" as const, waitingSince: now } : p
        );
        updatedCourts = s.courts.map((c) =>
          c.id === courtId ? { ...c, teamA: null, teamB: null, scoreA: 0, scoreB: 0, startedAt: null } : c
        );
      }

      return {
        ...s,
        players: updatedPlayers,
        courts: updatedCourts,
        history: [record, ...s.history],
      };
    });
  }, []);

  const clearCourt = useCallback((courtId: string) => {
    setState((s) => {
      const court = s.courts.find((c) => c.id === courtId);
      const freed = new Set<string>();
      if (court?.teamA) court.teamA.playerIds.forEach((id) => freed.add(id));
      if (court?.teamB) court.teamB.playerIds.forEach((id) => freed.add(id));
      const now = Date.now();
      return {
        ...s,
        players: s.players.map((p) =>
          freed.has(p.id) ? { ...p, status: "waiting" as const, waitingSince: now } : p
        ),
        courts: s.courts.map((c) =>
          c.id === courtId ? { ...c, teamA: null, teamB: null, scoreA: 0, scoreB: 0, startedAt: null } : c
        ),
      };
    });
  }, []);

  const updateSettings = useCallback((patch: Partial<SessionSettings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const renameSession = useCallback((name: string) => {
    setState((s) => ({ ...s, name }));
  }, []);

  const resetSession = useCallback(() => {
    setState(freshState());
  }, []);

  const waitingPlayers = useMemo(
    () => state.players.filter((p) => p.checkedIn && p.status === "waiting"),
    [state.players]
  );

  const flexPlayers = useMemo(() => {
    const seatsNeeded = state.settings.gameMode === "doubles" ? 4 : 2;
    const remainder = waitingPlayers.length % seatsNeeded;
    if (remainder === 0) return [];
    const sorted = [...waitingPlayers].sort((a, b) => a.waitingSince - b.waitingSince);
    return sorted.slice(sorted.length - remainder);
  }, [waitingPlayers, state.settings.gameMode]);

  const value: SessionContextValue = {
    state,
    addPlayer,
    removePlayer,
    toggleCheckIn,
    toggleRest,
    addCourt,
    removeCourt,
    setCourtMode,
    fillCourt,
    fillOpenSeat,
    updateScore,
    endMatch,
    clearCourt,
    updateSettings,
    renameSession,
    resetSession,
    waitingPlayers,
    flexPlayers,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export { SessionContext };
