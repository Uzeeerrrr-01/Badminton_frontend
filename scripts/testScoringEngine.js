import {
  checkWinner,
  initializeMatchState,
  scorePoint,
  undoLastPoint,
  recordLet,
} from "../lib/scoringEngine.js";

console.log("=== RUNNING SCORING ENGINE TESTS ===");

// 1. Test checkWinner edge cases
console.log("1. Testing checkWinner edge cases:");
console.assert(checkWinner(10, 8) === null, "10-8 should not be game over");
console.assert(checkWinner(11, 8) === "A", "11-8 should be Team A win");
console.assert(checkWinner(8, 11) === "B", "8-11 should be Team B win");
console.assert(checkWinner(10, 10) === null, "10-10 deuce should not be game over");
console.assert(checkWinner(11, 10) === null, "11-10 in deuce should not be game over (need 2-point lead)");
console.assert(checkWinner(12, 10) === "A", "12-10 should be Team A win (2-point lead)");
console.assert(checkWinner(11, 11) === null, "11-11 should not be game over");
console.assert(checkWinner(12, 12) === null, "12-12 should not be game over");
console.assert(checkWinner(13, 11) === "A", "13-11 should be Team A win");
console.assert(checkWinner(13, 13) === null, "13-13 should not be game over");
console.assert(checkWinner(14, 13) === null, "14-13 should not be game over");
console.assert(checkWinner(14, 14) === null, "14-14 sudden death ready, not over yet");
console.assert(checkWinner(15, 14) === "A", "15-14 sudden death next point wins for A");
console.assert(checkWinner(14, 15) === "B", "14-15 sudden death next point wins for B");
console.log("checkWinner tests PASSED!");

// 2. Test Singles Match Flow
console.log("\n2. Testing Singles Match Flow:");
const p1 = [{ id: "p1", name: "Viktor Axelsen", gender: "Male" }];
const p2 = [{ id: "p2", name: "Lee Zii Jia", gender: "Male" }];

let state = initializeMatchState({
  category: "Men's Singles",
  teamAPlayers: p1,
  teamBPlayers: p2,
  tossWinner: "A",
  tossChoice: "serve",
});

console.assert(state.scoreA === 0 && state.scoreB === 0, "Initial score 0-0");
console.assert(state.servingTeam === "A", "Team A serves first");
console.assert(state.serviceCourt === "right", "0 is even, right court");

// Team A wins rally -> score 1-0
state = scorePoint(state, "A", "Men's Singles", p1, p2);
console.assert(state.scoreA === 1 && state.scoreB === 0, "Score should be 1-0");
console.assert(state.servingTeam === "A", "Team A retains serve");
console.assert(state.serviceCourt === "left", "1 is odd, left court");

// Team B wins rally -> score 1-1
state = scorePoint(state, "B", "Men's Singles", p1, p2);
console.assert(state.scoreA === 1 && state.scoreB === 1, "Score should be 1-1");
console.assert(state.servingTeam === "B", "Team B now serves");
console.assert(state.serviceCourt === "left", "Team B score is 1 (odd), left court");

// Undo test
state = undoLastPoint(state);
console.assert(state.scoreA === 1 && state.scoreB === 0, "Undo should restore score to 1-0");
console.assert(state.servingTeam === "A", "Undo restores serving team A");
console.assert(state.serviceCourt === "left", "Undo restores left court");

console.log("Singles tests PASSED!");

// 3. Test Doubles Rotation Rules
console.log("\n3. Testing Doubles Rotation Rules:");
const teamA = [
  { id: "a1", name: "Kevin Sanjaya", gender: "Male" },
  { id: "a2", name: "Marcus Gideon", gender: "Male" },
];
const teamB = [
  { id: "b1", name: "Hendry Setiawan", gender: "Male" },
  { id: "b2", name: "Mohammad Ahsan", gender: "Male" },
];

let dState = initializeMatchState({
  category: "Men's Doubles",
  teamAPlayers: teamA,
  teamBPlayers: teamB,
  tossWinner: "A",
  tossChoice: "serve",
  initialServerId: "a1",
  initialReceiverId: "b1",
});

console.assert(dState.servingPlayerId === "a1", "Initial server a1");
console.assert(dState.teamAPositions.right === "a1", "a1 starts in right court");
console.assert(dState.teamAPositions.left === "a2", "a2 starts in left court");
console.assert(dState.teamBPositions.right === "b1", "b1 starts in right court");
console.assert(dState.teamBPositions.left === "b2", "b2 starts in left court");

// Serving team A wins point -> 1-0
// Rule: a1 serves again from left court! Team A players swap courts!
dState = scorePoint(dState, "A", "Men's Doubles", teamA, teamB);
console.assert(dState.scoreA === 1 && dState.scoreB === 0, "Score is 1-0");
console.assert(dState.servingPlayerId === "a1", "Same server a1");
console.assert(dState.serviceCourt === "left", "Score 1 is odd, so left court");
console.assert(dState.teamAPositions.left === "a1", "a1 moved to left court");
console.assert(dState.teamAPositions.right === "a2", "a2 moved to right court");
console.assert(dState.teamBPositions.right === "b1", "Receiving team b1 stayed in right court");
console.assert(dState.teamBPositions.left === "b2", "Receiving team b2 stayed in left court");

// Receiving team B wins point -> 1-1
// Rule: Team B gets point. Neither team swaps courts!
// Team B score is 1 (odd) -> server is whoever is currently in the LEFT court for Team B (which is b2!)
dState = scorePoint(dState, "B", "Men's Doubles", teamA, teamB);
console.assert(dState.scoreA === 1 && dState.scoreB === 1, "Score is 1-1");
console.assert(dState.servingTeam === "B", "Serving team is now B");
console.assert(dState.serviceCourt === "left", "Score 1 is odd, server is in left court");
console.assert(dState.servingPlayerId === "b2", "b2 is in left court and becomes server");

console.log("Doubles rules and court rotations PASSED!");

// 4. Test LET action
dState = recordLet(dState);
console.assert(dState.scoreA === 1 && dState.scoreB === 1, "LET does not change score");
console.assert(dState.history.at(-1).event.includes("LET"), "LET recorded in history");
console.log("LET tests PASSED!");

console.log("\nALL SCORING ENGINE TESTS PASSED SUCCESSFULLY! 🔥");
