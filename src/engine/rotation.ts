import type { Player, SessionSettings } from "./types";

/**
 * THE CORE PROBLEM THIS SOLVES
 * ------------------------------------------------------------------
 * PickleQ (and paddle-stack queues generally) break down when the
 * number of waiting players isn't a clean multiple of 4 (doubles) or
 * 2 (singles). You end up with a "leftover" player and no clear rule
 * for what happens to them — so the organizer has to eyeball it.
 *
 * This engine never leaves that ambiguous:
 *   1. It always proposes the fairest possible full group for a court
 *      (least games played, then longest wait, then partner variety).
 *   2. If the waiting pool can't form a clean group, the true
 *      remainder is explicitly tagged as "flex" players — never just
 *      silently stuck at the back of an undifferentiated line.
 *   3. Flex players are actively first-priority candidates to sub into
 *      the *next* court that opens up, or to fill seat 3/4 in
 *      King-of-the-Court mode, where only 2 seats turn over at a time
 *      (which structurally absorbs odd numbers, since 2 leaves / 2
 *      joins per cycle, not 4).
 *   4. Fairness score recalculates continuously, so nobody can get
 *      stuck on the bench for the whole session — the longer someone
 *      waits, the more their score climbs, guaranteeing rotation.
 */

const SEATS_PER_TEAM = (mode: "doubles" | "singles") => (mode === "doubles" ? 2 : 1);
const SEATS_PER_GROUP = (mode: "doubles" | "singles") => SEATS_PER_TEAM(mode) * 2;

/** Lower score = should play sooner. Games played dominates; wait time breaks ties. */
export function fairnessScore(p: Player, now: number): number {
  const waitMinutes = (now - p.waitingSince) / 60000;
  // Each extra game played costs 100 points; each minute waited earns back 1.
  // This makes "games played" the primary sort key, "time waited" the tiebreaker,
  // while still guaranteeing that a long enough wait eventually wins out.
  return p.gamesPlayed * 100 - waitMinutes;
}

export function sortByFairness(players: Player[], now: number): Player[] {
  return [...players].sort((a, b) => fairnessScore(a, now) - fairnessScore(b, now));
}

/** Has player a already partnered with player b recently? */
function recentlyPartnered(a: Player, b: Player, lookback = 2): boolean {
  return a.partnerHistory.slice(-lookback).includes(b.id) || b.partnerHistory.slice(-lookback).includes(a.id);
}
function recentlyOpposed(a: Player, b: Player, lookback = 2): boolean {
  return a.opponentHistory.slice(-lookback).includes(b.id) || b.opponentHistory.slice(-lookback).includes(a.id);
}

export interface NextGroupResult {
  /** Players selected to fill the court right now (full group). Empty if not enough. */
  group: Player[];
  /** Best pairing of `group` into two teams, balancing skill + avoiding repeat partners. */
  teamA: Player[];
  teamB: Player[];
  /** True remainder: players who cannot be seated this round because there
   *  aren't enough waiting players to fill another whole group. These are
   *  the players the engine explicitly flags as "flex". */
  flex: Player[];
}

/**
 * Selects the fairest full group (4 for doubles, 2 for singles) from the
 * waiting pool, and splits the true remainder out as explicit "flex" players
 * instead of leaving them ambiguously queued.
 */
export function selectNextGroup(
  waitingPlayers: Player[],
  settings: SessionSettings,
  now: number = Date.now()
): NextGroupResult {
  const seatsNeeded = SEATS_PER_GROUP(settings.gameMode);
  const ranked = sortByFairness(waitingPlayers, now);

  if (ranked.length < seatsNeeded) {
    return { group: [], teamA: [], teamB: [], flex: ranked };
  }

  // Always take the top N fairest players as the group.
  const group = ranked.slice(0, seatsNeeded);
  const flex = ranked.slice(seatsNeeded);

  const { teamA, teamB } = splitIntoTeams(group, settings);

  return { group, teamA, teamB, flex };
}

/** Splits a group into two balanced teams, avoiding repeat partners/opponents when possible. */
function splitIntoTeams(group: Player[], settings: SessionSettings): { teamA: Player[]; teamB: Player[] } {
  if (group.length === 2) {
    return { teamA: [group[0]], teamB: [group[1]] };
  }
  // Doubles: try every pairing of 4 into 2x2, score each, pick the best.
  const [p0, p1, p2, p3] = group;
  const pairings: [Player[], Player[]][] = [
    [[p0, p1], [p2, p3]],
    [[p0, p2], [p1, p3]],
    [[p0, p3], [p1, p2]],
  ];

  let best = pairings[0];
  let bestScore = Infinity;

  for (const [a, b] of pairings) {
    let score = 0;
    if (settings.avoidRepeatPartners) {
      if (recentlyPartnered(a[0], a[1])) score += 10;
      if (recentlyPartnered(b[0], b[1])) score += 10;
      if (recentlyOpposed(a[0], b[0]) || recentlyOpposed(a[1], b[1])) score += 3;
      if (recentlyOpposed(a[0], b[1]) || recentlyOpposed(a[1], b[0])) score += 3;
    }
    if (settings.skillBalancing) {
      const ratingA = avgRating(a);
      const ratingB = avgRating(b);
      score += Math.abs(ratingA - ratingB) * 5;
    }
    if (score < bestScore) {
      bestScore = score;
      best = [a, b];
    }
  }

  return { teamA: best[0], teamB: best[1] };
}

function avgRating(players: Player[]): number {
  const rated = players.filter((p) => typeof p.rating === "number");
  if (rated.length === 0) return 3.5;
  return rated.reduce((s, p) => s + (p.rating ?? 3.5), 0) / rated.length;
}

/**
 * KING OF THE COURT resolution.
 * Only the losing team's 2 (or 1, in singles) seats rotate out.
 * The winning team stays. This is the second odd-number fix: because
 * only a partial seat-count turns over each cycle instead of a full 4,
 * a lone flex player can cleanly slot into exactly the seats freed,
 * rather than needing to wait for 3 other people to assemble.
 */
export function selectKingOfCourtReplacements(
  waitingPlayers: Player[],
  seatsToFill: number,
  _settings: SessionSettings,
  now: number = Date.now()
): { incoming: Player[]; flex: Player[] } {
  const ranked = sortByFairness(waitingPlayers, now);
  const incoming = ranked.slice(0, seatsToFill);
  const flex = ranked.slice(seatsToFill);
  return { incoming, flex };
}

/**
 * Identifies players who should be badged as "flex" right now across the
 * whole session — i.e. true odd-ones-out who can't form a full next group
 * anywhere. Used to drive the Flex Tray UI so the organizer (and players)
 * always have an explicit, visible answer instead of an ambiguous line.
 */
export function computeFlexPool(waitingPlayers: Player[], settings: Pick<SessionSettings, "gameMode">): Player[] {
  const seatsNeeded = SEATS_PER_GROUP(settings.gameMode);
  const remainder = waitingPlayers.length % seatsNeeded;
  if (remainder === 0) return [];
  const now = Date.now();
  // The longest-waiting players get priority for courts, so the *most
  // recently arrived* are the structural remainder/flex candidates —
  // they're closest to the front for the *next* sub-in opportunity.
  const ranked = sortByFairness(waitingPlayers, now);
  return ranked.slice(ranked.length - remainder);
}

export function estimatedWaitLabel(position: number, seatsPerGroup: number, avgGameMinutes = 12): string {
  const groupsAhead = Math.floor(position / seatsPerGroup);
  const minutes = groupsAhead * avgGameMinutes;
  if (minutes <= 0) return "Up next";
  if (minutes < 60) return `~${minutes} min`;
  return `~${Math.round(minutes / 60)} hr`;
}
