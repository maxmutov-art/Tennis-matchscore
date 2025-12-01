// -------------------------
// MATCH STATE
// -------------------------
let playerA = { name: "Miles", sets: [0, 0], games: 0, points: 0 };
let playerB = { name: "Leo",   sets: [0, 0], games: 0, points: 0 };

let currentServer = "A";

// STANDARD TENNIS POINTS
const pointLabels = ["0", "15", "30", "40", "Ad"];

// -------------------------
// NAME CHANGE
// -------------------------
function changeName(player, newName) {
    if (player === "A") playerA.name = newName;
    if (player === "B") playerB.name = newName;
    updateUI();
}

// -------------------------
// POINT WON LOGIC
// -------------------------
function pointWon(player) {
    let p = player === "A" ? playerA : playerB;
    let o = player === "A" ? playerB : playerA;

    // NORMAL POINT PROGRESSION
    if (p.points <= 2) {
        p.points++; // 0 → 15 → 30 → 40
    } 
    else if (p.points === 3) {
        // They are at 40
        if (o.points < 3) {
            // Opponent < 40 → GAME
            winGame(player);
            return;
        }
        if (o.points === 3) {
            // 40–40 → Deuce → AD
            p.points = 4; // AD
        } 
        else if (o.points === 4) {
            // Opponent has AD → back to deuce
            o.points = 3;
        }
    } 
    else if (p.points === 4) {
        // They already have AD → GAME
        winGame(player);
        return;
    }

    updateUI();
}

// -------------------------
// WIN GAME → UPDATE SET
// -------------------------
function winGame(player) {
    let p = player === "A" ? playerA : playerB;
    let o = player === "A" ? playerB : playerA;

    p.games++;

    // Reset points
    playerA.points = 0;
    playerB.points = 0;

    // CHECK SET WIN
    if (
        (p.games >= 6 && p.games - o.games >= 2) || // 6–0 to 6–4
        p.games === 7                              // 7–5 or 7–6
    ) {
        winSet(player);
    }

    updateUI();
}

// -------------------------
// WIN SET
// -------------------------
function winSet(player) {
    let p = player === "A" ? playerA : playerB;

    // Increase set
    if (p.sets[0] === 0) p.sets[0] = 1;
    else p.sets[1] = 1;

    // Reset games
    playerA.games = 0;
    playerB.games = 0;

    // Reset points
    playerA.points = 0;
    playerB.points = 0;
}

// -------------------------
// CHANGE SERVER
// -------------------------
function changeServer() {
    currentServer = currentServer === "A" ? "B" : "A";
    updateUI();
}

// -------------------------
// RESET MATCH
// -------------------------
function resetMatch() {
    playerA = { name: "Miles", sets: [0, 0], games: 0, points: 0 };
    playerB = { name: "Leo",   sets: [0, 0], games: 0, points: 0 };
    currentServer = "A";
    updateUI();
}

// -------------------------
// UI UPDATE
// -------------------------
function updateUI() {
    // Names
    document.getElementById("nameA").textContent = playerA.name;
    document.getElementById("nameB").textContent = playerB.name;

    // Set scores
    document.getElementById("setA1").textContent = playerA.sets[0] || "-";
    document.getElementById("setA2").textContent = playerA.sets[1] || "-";

    document.getElementById("setB1").textContent = playerB.sets[0] || "-";
    document.getElementById("setB2").textContent = playerB.sets[1] || "-";

    // Game scores
    document.getElementById("gameA").textContent = pointLabels[playerA.points];
    document.getElementById("gameB").textContent = pointLabels[playerB.points];

    // SERVER DOT
    document.getElementById("serveA").style.opacity = currentServer === "A" ? 1 : 0;
    document.getElementById("serveB").style.opacity = currentServer === "B" ? 1 : 0;
}

// Initial load
updateUI();
