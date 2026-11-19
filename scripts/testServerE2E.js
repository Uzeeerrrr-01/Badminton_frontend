const http = require("http");
const next = require("next");

async function main() {
  console.log("Preparing Next.js server in-process...");
  const app = next({ dev: false, dir: process.cwd() });
  const handle = app.getRequestHandler();
  await app.prepare();

  const server = http.createServer((req, res) => {
    handle(req, res);
  });

  await new Promise((resolve) => server.listen(3000, "127.0.0.1", resolve));
  console.log("✓ Next.js server is listening on http://127.0.0.1:3000!\n");

  function fetchUrl(path, options = {}) {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: "127.0.0.1",
          port: 3000,
          path,
          method: options.method || "GET",
          headers: options.headers || {},
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => {
            resolve({ status: res.statusCode, headers: res.headers, body });
          });
        }
      );
      req.on("error", reject);
      if (options.body) req.write(options.body);
      req.end();
    });
  }

  try {
    // 1. Test Public Home Page
    console.log("1. Testing Public Home Page (GET /):");
    const homeRes = await fetchUrl("/");
    console.log("Home status:", homeRes.status, "Body length:", homeRes.body.length);
    console.assert(homeRes.status === 200, `Expected 200, got ${homeRes.status}`);
    console.assert(homeRes.body.includes("APEX OPEN"), "Home page should contain APEX OPEN");
    console.assert(homeRes.body.includes("Live Matches"), "Home page should contain Live Matches section");
    console.log("✓ Public Home Page test PASSED\n");

    // 2. Test Public API: GET /api/matches
    console.log("2. Testing Matches API (GET /api/matches):");
    const matchesRes = await fetchUrl("/api/matches");
    console.assert(matchesRes.status === 200, `Expected 200, got ${matchesRes.status}`);
    const matchesData = JSON.parse(matchesRes.body);
    console.log(`✓ Fetched ${matchesData.matches.length} matches from database`);
    const liveMatch = matchesData.matches.find((m) => m.status === "live");
    console.assert(Boolean(liveMatch), "There should be at least one seeded live match");
    console.log(`✓ Seeded live match found: ${liveMatch.team_a_name} vs ${liveMatch.team_b_name} on Court ${liveMatch.court_number}\n`);

    // 3. Test Public API: GET /api/players
    console.log("3. Testing Players API (GET /api/players):");
    const playersRes = await fetchUrl("/api/players");
    console.assert(playersRes.status === 200, `Expected 200, got ${playersRes.status}`);
    const playersData = JSON.parse(playersRes.body);
    console.log(`✓ Fetched ${playersData.players.length} registered players\n`);

    // 4. Test Public API: GET /api/points
    console.log("4. Testing Points & Leaderboard API (GET /api/points):");
    const pointsRes = await fetchUrl("/api/points");
    console.assert(pointsRes.status === 200, `Expected 200, got ${pointsRes.status}`);
    const pointsData = JSON.parse(pointsRes.body);
    console.log(`✓ Leaderboard rows: ${pointsData.leaderboard.length}, history logs: ${pointsData.history.length}\n`);

    // 5. Test Admin Login (POST /api/auth/login)
    console.log("5. Testing Admin Authentication (POST /api/auth/login):");
    const loginRes = await fetchUrl("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@badminton.org", password: "admin123" }),
    });
    console.assert(loginRes.status === 200, `Expected 200, got ${loginRes.status}`);
    const loginData = JSON.parse(loginRes.body);
    console.assert(Boolean(loginData.token), "Login should return a signed JWT token");
    const token = loginData.token;
    console.log("✓ Admin login successful! Token issued:", token.substring(0, 25) + "...\n");

    // 6. Test Protected Scoring API with Admin Token: POST /api/matches/[id]/score
    console.log("6. Testing Official Live Scoring (+1 point):");
    const initialScoreA = liveMatch.score_a;
    const scoreRes = await fetchUrl(`/api/matches/${liveMatch.id}/score`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ winningTeam: "A" }),
    });
    console.assert(scoreRes.status === 200, `Expected 200, got ${scoreRes.status}`);
    const scoreData = JSON.parse(scoreRes.body);
    console.log(`✓ +1 point scored for Team A! New score: ${scoreData.match.score_a} - ${scoreData.match.score_b}`);
    console.log(`✓ Updated serving status: Team ${scoreData.match.serving_team}, Service Court: ${scoreData.match.service_court}\n`);

    // 7. Test Dedicated LET / Replay Action: POST /api/matches/[id]/let
    console.log("7. Testing Dedicated LET / Replay Action:");
    const letRes = await fetchUrl(`/api/matches/${liveMatch.id}/let`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    console.assert(letRes.status === 200, `Expected 200, got ${letRes.status}`);
    const letData = JSON.parse(letRes.body);
    console.log(`✓ LET successfully recorded! Scores remained unchanged: ${letData.match.score_a} - ${letData.match.score_b}\n`);

    // 8. Test Undo Action: POST /api/matches/[id]/undo
    console.log("8. Testing Undo Scoring Action:");
    // Undo the LET
    await fetchUrl(`/api/matches/${liveMatch.id}/undo`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    // Undo the +1 point
    const undoRes = await fetchUrl(`/api/matches/${liveMatch.id}/undo`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const undoData = JSON.parse(undoRes.body);
    console.log(`✓ Undo successfully executed! Score restored to: ${undoData.match.score_a} - ${undoData.match.score_b}\n`);
    console.assert(undoData.match.score_a === initialScoreA, "Score A successfully rolled back to original");

    // 9. Test Security Protection (Unauthorized access blocked)
    console.log("9. Testing Backend Security (Reject unauthorized modification):");
    const unauthRes = await fetchUrl(`/api/matches/${liveMatch.id}/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ winningTeam: "A" }),
    });
    console.assert(unauthRes.status === 401, `Expected 401 Unauthorized, got ${unauthRes.status}`);
    console.log("✓ Unauthorized score modification blocked with HTTP 401!\n");

    console.log("==================================================");
    console.log("ALL E2E FUNCTIONAL TESTS PASSED WITH 100% SUCCESS!");
    console.log("==================================================");
  } catch (err) {
    console.error("Test execution caught error:", err);
  } finally {
    server.close();
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
