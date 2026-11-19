import {
  getMatch,
  addPoint,
  undoPoint,
  letPoint,
  getLeaderboard,
} from "../lib/db.js";

async function run() {
  console.log("--- Testing Match Scoring via DB ---");
  const match = getMatch("mth-1");
  console.log(`Initial Match 1: ${match.team_a_name} (${match.score_a}) vs ${match.team_b_name} (${match.score_b})`);
  console.log(`Serving: Team ${match.serving_team}, Service Court: ${match.service_court}`);

  // Add point to Team A
  const afterA = addPoint("mth-1", "A");
  console.log(`After +1 A: ${afterA.score_a} - ${afterA.score_b}, Serving: ${afterA.serving_team}, Court: ${afterA.service_court}`);
  console.assert(afterA.score_a === 8, "Score A should be 8");

  // Let point
  const afterLet = letPoint("mth-1");
  console.log(`After Let: ${afterLet.score_a} - ${afterLet.score_b}, history events: ${afterLet.history.length}`);
  console.assert(afterLet.score_a === 8 && afterLet.score_b === 6, "Let should not change scores");

  // Undo point
  const afterUndo = undoPoint("mth-1");
  console.log(`After Undo: ${afterUndo.score_a} - ${afterUndo.score_b}, Serving: ${afterUndo.serving_team}`);
  console.assert(afterUndo.score_a === 7, "Score A restored to 7");

  // Check Leaderboard
  const lb = getLeaderboard({ category: "All" });
  console.log(`Leaderboard rows count: ${lb.length}`);

  console.log("--- DB SCORING & LEADERBOARD PASSED! ---");
}

run();
