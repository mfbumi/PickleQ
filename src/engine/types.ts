export type PlayerStatus = "waiting" | "playing" | "resting" | "flex";

export interface Player {
  id: string;
  name: string;
  rating?: number; // optional self-rated skill, 1.0-6.0
  gamesPlayed: number;
  gamesWon: number;
  status: PlayerStatus;
  /** timestamp (ms) the player most recently became "waiting" */
  waitingSince: number;
  /** ids of players this person has partnered with, most recent last */
  partnerHistory: string[];
  /** ids of players this person has faced, most recent last */
  opponentHistory: string[];
  checkedIn: boolean;
  joinedAt: number;
}

export type CourtMode = "standard" | "kingOfCourt";

export interface CourtTeam {
  playerIds: [string, string];
}

export interface Court {
  id: string;
  label: string; // "Court 1"
  mode: CourtMode;
  teamA: CourtTeam | null;
  teamB: CourtTeam | null;
  scoreA: number;
  scoreB: number;
  startedAt: number | null;
  active: boolean; // false = court closed/unused
}

export interface MatchRecord {
  id: string;
  courtId: string;
  courtLabel: string;
  teamA: string[];
  teamB: string[];
  scoreA: number;
  scoreB: number;
  winner: "A" | "B" | null;
  startedAt: number;
  endedAt: number;
}

export type GameMode = "doubles" | "singles";

export interface SessionSettings {
  gameMode: GameMode;
  pointsToWin: number;
  defaultCourtMode: CourtMode;
  skillBalancing: boolean;
  avoidRepeatPartners: boolean;
}

export interface SessionState {
  name: string;
  players: Player[];
  courts: Court[];
  history: MatchRecord[];
  settings: SessionSettings;
  startedAt: number;
}
