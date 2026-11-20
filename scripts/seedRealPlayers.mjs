import path from "path";
import { DatabaseSync } from "node:sqlite";

const csvData = `Player No.,Player Name,Gender,Department,Singles,Doubles,Doubles Partner,Mixed Doubles,Mixed Partner,Notes
1,Aamir Sable,Male,BVOC 1st Year,,Yes,Irfan Shaikh,,,
2,Abdul Ahad Khan,Male,Ex Intern,Yes,Yes,Akshat gupta,,,
3,Abdulla Shaikh,Male,IT,Yes,,,,,
4,Abhijeet Sawant,Male,Ex Intern,Yes,Yes,Vinayak Gupta,Yes,Iffat Shaikh,
5,Affan Khan,Male,BVOC 2nd Year,Yes,Yes,Sami,Yes,Affan,
6,Ali Mapari,Male,BVOC 1st Year,Yes,Yes,Tushar sutar,Yes,Atifa Ansari,
7,Alijah Malik,Female,BVOC 1st Year,Yes,Yes,Nafeesa,Yes,Praveen,
8,Amit Kanojiya,Male,Ex Intern,Yes,Yes,Chinmay,Yes,Sanchita Dalvi,
9,Ammar Juwle,Male,BVOC 1st Year,,Yes,Abdurehman,,,
10,Anam Choudhary,Female,BVOC 1st Year,Yes,Yes,Tamanna,,,
11,Anjali Yadav,Female,HR,Yes,Yes,Kainat,Yes,Aquib hingwala,
12,Aquib Hingwala,Male,Ex Intern,Yes,Yes,Nouman Khan,Yes,Anjali HR,
13,Awwab Sonday,Male,IT,Yes,Yes,Zaid Achhwaa,Yes,Anjali Yadav,
14,Devinshree Marathe,Female,NIT,,Yes,Sanchita Dalvi,Yes,Vinayak,
15,Faraaz Kurawle,Male,IT,Yes,Yes,Vishwajeet,,,
16,Faraz Khan,Male,BVOC 1st Year,Yes,,,,,
17,Farhan Tolkar,Male,BVOC 2nd Year,Yes,,,,,
18,Farhat Shaikh,Female,BVOC 1st Year,,Yes,Roheen Ansari,Yes,Irfaan,
19,Iffat Shaikh,Female,BVOC 2nd Year,Yes,Yes,Sajiya,Yes,Abhijeet Sir,
20,Ikrama Ghavte,Male,BVOC 1st Year,,Yes,Junaid Khan,,,
21,Irfan Shaikh,Male,BVOC 2nd Year,Yes,Yes,Aamir sable,Yes,farhat,
22,Junaid Khan,Male,BVOC 1st Year,,Yes,Ikrama Ghavte,,,Partner named but Mix not selected
23,Kainat Khan,Female,BVOC 1st Year,Yes,Yes,Anjali,Yes,Mirza Ubaid,
24,Karan Kanakarajan,Male,HR,Yes,,,,,
25,Mansi Sarode,Female,IT,Yes,,,,,
26,Mariya Shaikh,Female,Ex Intern,Yes,Yes,Siddhi,Yes,Nouman,
27,Mirza Beg,Male,BVOC 1st Year,Yes,Yes,mohammed ayan,,,
28,Mohammed Ayan Sayed,Male,BVOC 1st Year,Yes,Yes,Ubaid,,,
29,Mohammed Jagda,Male,IT,,Yes,Raj Sharma,,,
30,Mohammed Qutbuddin Kotkunde,Male,NIT,,Yes,Any,Yes,Any,
31,Nouman Khan,Male,IT,Yes,Yes,Aquib Hingwala,Yes,Mariya,
32,Piyush Pandey,Male,IT,Yes,Yes,Shams Ali Shaikh,Yes,Siddhi ghanekar,
33,Piyush Patwa,Male,BVOC 2nd Year,Yes,,,,,
34,Prashant Patil,Male,IT,Yes,Yes,saeed,,,
35,Pravin Chettiar,Male,BVOC 2nd Year,Yes,Yes,Suffiyan khan,Yes,Alijah,
36,Raj Sharma,Male,IT,,Yes,Mohammad jagda,,,
37,Roheen Ansari,Female,BVOC 1st Year,,Yes,Farhat,Yes,Affan,
38,Saad Ranasaria,Male,BVOC 1st Year,Yes,Yes,Aamir,Yes,Alisha,
39,Saeed Siddiqui,Male,NIT,Yes,Yes,Shamsh Ali,,,
40,Sami Shaikh,Male,BVOC 1st Year,Yes,Yes,Affan Khan,Yes,,Mixed partner not given
41,Sanchita Dalvi,Female,NIT,,Yes,Devinshree Marathe,Yes,Amit Kanojiya,
42,Sanika Bangar,Female,IT,Yes,,,,,
43,Sanskar Ashan,Male,BVOC 2nd Year,Yes,Yes,Piyush patwa,,,
44,Shah Alisha Khatoon,Female,BVOC 1st Year,,Yes,saeed sir,,,
45,Siddhi Ghanekar,Female,HR,Yes,Yes,MariyaShaikh,Yes,PiyushPandey,
46,Sufiyan Khan,Male,Marketing Junction,Yes,Yes,Pravin,Yes,Tasmiya,
47,Taha Choudhary,Male,BVOC 2nd Year,Yes,Yes,Uzer sayyed,,,
48,Tamanna Ansari,Female,BVOC 2nd Year,,,,Yes,Mudassir Markania,
49,Uzer Sayed,Male,BVOC 2nd Year,,Yes,TAHA CHOUDHARY,Yes,Anam,
50,Vinayak Gupta,Male,IT,Yes,Yes,Abhijeet Sawant,Yes,Devinshree,
51,Viraj Adsul,Male,IT,,Yes,mudassir markania,,,
52,Vishwajeet Khandare,Male,IT,,Yes,Faraz kurawle,,,
53,Zaid Achhwa,Male,IT,Yes,Yes,Awwab Sonday,Yes,,Mixed partner not given`;

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(",");
    const num = parts[0]?.trim();
    const name = parts[1]?.trim();
    const gender = parts[2]?.trim();
    const dept = parts[3]?.trim();
    const singles = parts[4]?.trim()?.toLowerCase() === "yes";
    const doubles = parts[5]?.trim()?.toLowerCase() === "yes";
    const mixed = parts[7]?.trim()?.toLowerCase() === "yes";

    const categories = [];
    if (singles) {
      categories.push(gender === "Female" ? "Women's Singles" : "Men's Singles");
    }
    if (doubles) {
      categories.push(gender === "Female" ? "Women's Doubles" : "Men's Doubles");
    }
    if (mixed) {
      categories.push("Mixed Doubles");
    }

    const emailName = name.toLowerCase().replace(/[^a-z0-9]/g, ".");
    const email = `${emailName}@badminton.org`;

    rows.push({
      id: `ply-${num}`,
      player_id: `PLY-${String(num).padStart(3, "0")}`,
      full_name: name,
      gender: gender === "Female" ? "Female" : "Male",
      contact_email: email,
      contact_phone: dept ? `Dept: ${dept}` : null,
      eligible_categories: categories,
    });
  }
  return rows;
}

const players = parseCSV(csvData);
console.log(`Parsed ${players.length} real players.`);

const dbPaths = [
  path.join(process.cwd(), "Badminton_frontend", "data", "badminton.sqlite"),
  path.join(process.cwd(), "data", "badminton.sqlite"),
];

for (const dbPath of dbPaths) {
  try {
    const db = new DatabaseSync(dbPath);

    // 1. Clear demo data from players, teams, matches, tournament_points, points_history
    db.exec("DELETE FROM matches;");
    db.exec("DELETE FROM teams;");
    db.exec("DELETE FROM tournament_points;");
    db.exec("DELETE FROM points_history;");
    db.exec("DELETE FROM players;");

    // 2. Insert real 53 players
    const insertStmt = db.prepare(`
      INSERT INTO players (
        id, player_id, full_name, gender, contact_email, contact_phone,
        registration_status, eligible_categories, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'Active', ?, ?, ?)
    `);

    const now = new Date().toISOString();
    for (const p of players) {
      insertStmt.run(
        p.id,
        p.player_id,
        p.full_name,
        p.gender,
        p.contact_email,
        p.contact_phone,
        JSON.stringify(p.eligible_categories),
        now,
        now
      );
    }

    console.log(`[Success] Seeded ${players.length} real players into ${dbPath}`);
  } catch (err) {
    console.error(`[Error] on ${dbPath}:`, err.message);
  }
}
