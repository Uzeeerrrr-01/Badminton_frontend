/**
 * Official Badminton Scoring Engine (11-point tournament format)
 * Based on Badminton Singles Main Rules and Badminton Doubles Rules & Regulations.
 *
 * Scoring Rules:
 * - 1 game per match (shortened format).
 * - Rally point scoring (1 point per rally).
 * - First to 11 points wins (e.g., 11-0 to 11-9).
 * - At 10-10 (Deuce), must win by 2 clear points.
 * - At 14-14 (Sudden Death), next point wins (max score 15-14).
 *
 * Singles Service Court:
 * - Even score (0, 2, 4...) -> Right service court.
 * - Odd score (1, 3, 5...) -> Left service court.
 *
 * Doubles Service Court & Rotation:
 * - Even team score -> Server serves from Right service court.
 * - Odd team score -> Server serves from Left service court.
 * - If serving team wins rally:
 *     - Awards 1 point.
 *     - Same server serves again from the other court (serving team players swap courts).
 *     - Receiving team players DO NOT swap courts.
 * - If receiving team wins rally:
 *     - Awards 1 point.
 *     - Receiving team becomes serving team.
 *     - NEITHER team changes courts.
 *     - The player standing in the court matching the team's new score serves.
 */

export const MATCH_STATUS = {
  SCHEDULED: "scheduled",
  READY: "ready",
  LIVE: "live",
  PAUSED: "paused",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export const CATEGORIES = {
  MENS_SINGLES: "Men's Singles",
  WOMENS_SINGLES: "Women's Singles",
  MENS_DOUBLES: "Men's Doubles",
  WOMENS_DOUBLES: "Women's Doubles",
  MIXED_DOUBLES: "Mixed Doubles",
};

export const ROUNDS = [
  "Round of 32",
  "Round of 16",
  "Quarter-finals",
  "Semi-finals",
  "Final",
];

export function isDoublesCategory(category) {
  if (!category) return false;
  const c = category.toLowerCase();
  return c.includes("doubles") || c.includes("mixed");
}

/**
 * Checks if the game has ended and returns winner ('A' | 'B' | null)
 * 11-point format with deuce at 10-10, 2-point lead required, sudden death at 14-14 (max 15-14).
 */
export function checkWinner(scoreA, scoreB) {
  const higher = Math.max(scoreA, scoreB);
  const lower = Math.min(scoreA, scoreB);
  const diff = higher - lower;

  // Normal win condition: reached 11 and lower is 9 or less
  if (higher >= 11 && lower <= 9) {
    return scoreA > scoreB ? "A" : "B";
  }

  // Deuce territory (10-10 onwards)
  if (higher >= 10 && lower >= 10) {
    // Sudden death at 14-14: next point wins (15-14)
    if (higher === 15) {
      return scoreA > scoreB ? "A" : "B";
    }
    // 2-point lead condition (e.g. 12-10, 13-11, 14-12)
    if (diff >= 2 && higher >= 11) {
      return scoreA > scoreB ? "A" : "B";
    }
  }

  return null;
}

/**
 * Initializes match state after toss configuration
 */
export function initializeMatchState({
  category,
  teamAPlayers, // array of player objects [{ id, name, gender }]
  teamBPlayers, // array of player objects [{ id, name, gender }]
  tossWinner = "A", // 'A' | 'B'
  tossChoice = "serve", // 'serve' | 'receive'
  courtSideA = "left", // 'left' | 'right' court side
  initialServerId = null,
  initialReceiverId = null,
}) {
  const isDoubles = isDoublesCategory(category);

  // Determine initial serving team
  const servingTeam =
    tossWinner === "A"
      ? tossChoice === "serve"
        ? "A"
        : "B"
      : tossChoice === "serve"
      ? "B"
      : "A";

  const receivingTeam = servingTeam === "A" ? "B" : "A";

  // Pick default servers if not provided
  const sPlayers = servingTeam === "A" ? teamAPlayers : teamBPlayers;
  const rPlayers = receivingTeam === "A" ? teamAPlayers : teamBPlayers;

  const serverId = initialServerId || sPlayers[0]?.id;
  const receiverId = initialReceiverId || rPlayers[0]?.id;

  // Set initial court positions
  // In badminton, at 0-0 (even), server must be on the right court
  let teamAPositions = {};
  let teamBPositions = {};

  if (!isDoubles) {
    teamAPositions = {
      right: teamAPlayers[0]?.id || null,
      left: null,
    };
    teamBPositions = {
      right: teamBPlayers[0]?.id || null,
      left: null,
    };
  } else {
    // Doubles:
    if (servingTeam === "A") {
      const partnerA = teamAPlayers.find((p) => p.id !== serverId) || teamAPlayers[1];
      teamAPositions = {
        right: serverId, // Server starts on right (0 is even)
        left: partnerA?.id || null,
      };

      const partnerB = teamBPlayers.find((p) => p.id !== receiverId) || teamBPlayers[1];
      teamBPositions = {
        right: receiverId, // Receiver starts on right to receive diagonally
        left: partnerB?.id || null,
      };
    } else {
      const partnerB = teamBPlayers.find((p) => p.id !== serverId) || teamBPlayers[1];
      teamBPositions = {
        right: serverId,
        left: partnerB?.id || null,
      };

      const partnerA = teamAPlayers.find((p) => p.id !== receiverId) || teamAPlayers[1];
      teamAPositions = {
        right: receiverId,
        left: partnerA?.id || null,
      };
    }
  }

  const initialSnapshot = {
    scoreA: 0,
    scoreB: 0,
    servingTeam,
    servingPlayerId: serverId,
    receivingPlayerId: receiverId,
    serviceCourt: "right", // 0 is even -> right court
    teamAPositions,
    teamBPositions,
    courtSideA,
    isGameOver: false,
    winner: null,
    history: [], // list of event snapshots for undo
  };

  return initialSnapshot;
}

/**
 * Handles scoring a point for team 'A' or team 'B'
 * Returns new updated state and event log entry.
 */
export function scorePoint(currentState, winningTeam, category, teamAPlayers, teamBPlayers, faultReason = null) {
  if (currentState.isGameOver) {
    throw new Error("Match is already completed. No additional points allowed.");
  }

  const isDoubles = isDoublesCategory(category);

  const newScoreA = winningTeam === "A" ? currentState.scoreA + 1 : currentState.scoreA;
  const newScoreB = winningTeam === "B" ? currentState.scoreB + 1 : currentState.scoreB;

  const winner = checkWinner(newScoreA, newScoreB);
  const isGameOver = Boolean(winner);

  let newServingTeam = currentState.servingTeam;
  let newServingPlayerId = currentState.servingPlayerId;
  let newReceivingPlayerId = currentState.receivingPlayerId;
  let newServiceCourt = currentState.serviceCourt;
  let newTeamAPositions = { ...currentState.teamAPositions };
  let newTeamBPositions = { ...currentState.teamBPositions };

  if (!isDoubles) {
    // SINGLES
    newServingTeam = winningTeam;
    const serverScore = winningTeam === "A" ? newScoreA : newScoreB;
    newServiceCourt = serverScore % 2 === 0 ? "right" : "left";

    newServingPlayerId =
      winningTeam === "A" ? teamAPlayers[0]?.id : teamBPlayers[0]?.id;
    newReceivingPlayerId =
      winningTeam === "A" ? teamBPlayers[0]?.id : teamAPlayers[0]?.id;

    if (winningTeam === "A") {
      newTeamAPositions = {
        [newServiceCourt]: newServingPlayerId,
        [newServiceCourt === "right" ? "left" : "right"]: null,
      };
      newTeamBPositions = {
        [newServiceCourt]: newReceivingPlayerId,
        [newServiceCourt === "right" ? "left" : "right"]: null,
      };
    } else {
      newTeamBPositions = {
        [newServiceCourt]: newServingPlayerId,
        [newServiceCourt === "right" ? "left" : "right"]: null,
      };
      newTeamAPositions = {
        [newServiceCourt]: newReceivingPlayerId,
        [newServiceCourt === "right" ? "left" : "right"]: null,
      };
    }
  } else {
    // DOUBLES
    const servingTeamWon = winningTeam === currentState.servingTeam;

    if (servingTeamWon) {
      // 1. Serving team won the rally:
      // - Same server serves again.
      // - Serving team players SWAP service courts.
      // - Receiving team players stay in their current courts.
      newServingTeam = currentState.servingTeam;
      newServingPlayerId = currentState.servingPlayerId;

      if (newServingTeam === "A") {
        newTeamAPositions = {
          right: currentState.teamAPositions.left,
          left: currentState.teamAPositions.right,
        };
        newTeamBPositions = { ...currentState.teamBPositions };
      } else {
        newTeamBPositions = {
          right: currentState.teamBPositions.left,
          left: currentState.teamBPositions.right,
        };
        newTeamAPositions = { ...currentState.teamAPositions };
      }

      const serverScore = newServingTeam === "A" ? newScoreA : newScoreB;
      newServiceCourt = serverScore % 2 === 0 ? "right" : "left";

      // The receiver is the player on receiving team standing in the diagonal target court (same court label)
      const targetReceivingPositions =
        newServingTeam === "A" ? newTeamBPositions : newTeamAPositions;
      newReceivingPlayerId = targetReceivingPositions[newServiceCourt];
    } else {
      // 2. Receiving team won the rally:
      // - Receiving team gains point and becomes new serving team.
      // - NEITHER team swaps courts!
      // - Server is the player of the new serving team who is currently standing in the court matching new score.
      newServingTeam = winningTeam;
      const newServerTeamScore = newServingTeam === "A" ? newScoreA : newScoreB;
      newServiceCourt = newServerTeamScore % 2 === 0 ? "right" : "left";

      const positions =
        newServingTeam === "A" ? newTeamAPositions : newTeamBPositions;
      newServingPlayerId = positions[newServiceCourt];

      const opponentPositions =
        newServingTeam === "A" ? newTeamBPositions : newTeamAPositions;
      newReceivingPlayerId = opponentPositions[newServiceCourt];
    }
  }

  const snapshot = {
    scoreA: newScoreA, // Running score AFTER the point
    scoreB: newScoreB,
    prevScoreA: currentState.scoreA,
    prevScoreB: currentState.scoreB,
    winningTeam,
    faultReason: faultReason || null,
    servingTeam: newServingTeam,
    servingPlayerId: newServingPlayerId,
    receivingPlayerId: newReceivingPlayerId,
    serviceCourt: newServiceCourt,
    teamAPositions: { ...newTeamAPositions },
    teamBPositions: { ...newTeamBPositions },
    prevServingTeam: currentState.servingTeam,
    prevServingPlayerId: currentState.servingPlayerId,
    prevReceivingPlayerId: currentState.receivingPlayerId,
    prevServiceCourt: currentState.serviceCourt,
    prevTeamAPositions: { ...currentState.teamAPositions },
    prevTeamBPositions: { ...currentState.teamBPositions },
    isGameOver,
    winner,
    timestamp: Date.now(),
    event: faultReason ? `+1 point to Team ${winningTeam} (${faultReason})` : `+1 point to Team ${winningTeam}`,
  };

  const updatedHistory = [...(currentState.history || []), snapshot];

  return {
    scoreA: newScoreA,
    scoreB: newScoreB,
    servingTeam: newServingTeam,
    servingPlayerId: newServingPlayerId,
    receivingPlayerId: newReceivingPlayerId,
    serviceCourt: newServiceCourt,
    teamAPositions: newTeamAPositions,
    teamBPositions: newTeamBPositions,
    courtSideA: currentState.courtSideA,
    isGameOver,
    winner,
    history: updatedHistory,
  };
}

/**
 * Reverses last scoring event (Undo)
 */
export function undoLastPoint(currentState) {
  if (!currentState.history || currentState.history.length === 0) {
    return currentState; // Nothing to undo
  }

  const history = [...currentState.history];
  const lastState = history.pop();

  const scoreA = lastState.prevScoreA !== undefined 
    ? lastState.prevScoreA 
    : (history.length > 0 ? (history[history.length - 1].scoreA ?? 0) : 0);
  const scoreB = lastState.prevScoreB !== undefined 
    ? lastState.prevScoreB 
    : (history.length > 0 ? (history[history.length - 1].scoreB ?? 0) : 0);

  return {
    ...currentState,
    scoreA,
    scoreB,
    servingTeam: lastState.prevServingTeam !== undefined ? lastState.prevServingTeam : lastState.servingTeam,
    servingPlayerId: lastState.prevServingPlayerId !== undefined ? lastState.prevServingPlayerId : lastState.servingPlayerId,
    receivingPlayerId: lastState.prevReceivingPlayerId !== undefined ? lastState.prevReceivingPlayerId : lastState.receivingPlayerId,
    serviceCourt: lastState.prevServiceCourt !== undefined ? lastState.prevServiceCourt : lastState.serviceCourt,
    teamAPositions: lastState.prevTeamAPositions || lastState.teamAPositions,
    teamBPositions: lastState.prevTeamBPositions || lastState.teamBPositions,
    isGameOver: false,
    winner: null,
    history,
  };
}

/**
 * Records a LET / Replay
 * Does not change scores or positions; appends event to history log
 */
export function recordLet(currentState) {
  const letEvent = {
    scoreA: currentState.scoreA,
    scoreB: currentState.scoreB,
    servingTeam: currentState.servingTeam,
    servingPlayerId: currentState.servingPlayerId,
    receivingPlayerId: currentState.receivingPlayerId,
    serviceCourt: currentState.serviceCourt,
    teamAPositions: { ...currentState.teamAPositions },
    teamBPositions: { ...currentState.teamBPositions },
    isGameOver: currentState.isGameOver,
    winner: currentState.winner,
    timestamp: Date.now(),
    event: "LET / Rally Replayed (Umpire decision)",
  };

  return {
    ...currentState,
    history: [...(currentState.history || []), letEvent],
  };
}
