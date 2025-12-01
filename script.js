// =======================================
// MATCH STATE
// =======================================
let pendingNameA = "";
let pendingNameB = "";

let playerA = { name: "", sets: [0, 0], games: 0, points: 0 };
let playerB = { name: "", sets: [0, 0], games: 0, points: 0 };

let currentServer = "A";

const pointLabels = ["0", "15", "30", "40", "Ad"];

// =======================================
// START MATCH (names locked)
// =======================================
function startMatch() {
    playerA.name = pendingNameA || "Player A";
    playerB.name = pendingNameB || "Player B";

    document.getElementById("nameA").textContent = playerA.name;
    document.getElementById("nameB").textContent = playerB.name;

    document.querySelector(".setup-box").classList.add("hidden");
    document.getElementById("scoreboard").classList.remove("hidden");

    updateUI();
}

// =======================================
// POINT WON
// =======================================
function pointWon(player) {
    let p = player === "A" ? playerA : playerB;
    let o = player === "A" ? playerB : playerA;

    if (p.points <= 2) {
        p.points++;
    } else if (p.points === 3) {
        if (o.points < 3) {
            winGame(player);
            return;
        }
        if (o.points === 3) {
            p.points = 4; // AD
        } else if (o.points === 4) {
            o.points = 3; // back to deuce
        }
    } else if (p.points === 4) {
        winGame(player);
        return;
    }

    updateUI();
}

// =======================================
// WIN GAME
// =======================================
function winGame(player) {
    let p = player === "A" ? playerA : playerB;
    let o = player === "A" ? playerB : playerA;

    p.games++;

    playerA.points = 0;
    playerB.points = 0;

    // Check set win
    if (
        (p.games >= 6 && p.games - o.games >= 2) ||
        p.games === 7
    ) {
        winSet(player);
        return;
    }

    updateUI();
}

// =======================================
// WIN SET
// =======================================
function winSet(player) {
    let p = player === "A" ? playerA : playerB;

    if (p.sets[0] === 0) p.sets[0] = 1;
    else p.sets[1] = 1;

    playerA.games = 0;
    playerB.games = 0;

    updateUI();
}

// =======================================
// CHANGE SERVER
// =======================================
function changeServer() {
    currentServer = currentServer === "A" ? "B" : "A";
    updateUI();
}

// =======================================
// RESET MATCH
// =======================================
function resetMatch() {
    location.reload();
}

// =======================================
// UPDATE UI
// =======================================
function updateUI() {
    // Names
    document.getElementById("nameA").textContent = playerA.name;
    document.getElementById("nameB").textContent = playerB.name;

    // Sets
    document.getElementById("setA1").textContent = playerA.sets[0] || "-";
    document.getElementById("setA2").textContent = playerA.sets[1] || "-";

    document.getElementById("setB1").textContent = playerB.sets[0] || "-";
    document.getElementById("setB2").textContent = playerB.sets[1] || "-";

    // Games
    document.getElementById("gamesA").textContent = playerA.games;
    document.getElementById("gamesB").textContent = playerB.games;

    // Points
    document.getElementById("pointsA").textContent = pointLabels[playerA.points];
    document.getElementById("pointsB").textContent = pointLabels[playerB.points];

    // Server indicator
    document.getElementById("serveA").style.opacity = currentServer === "A" ? 1 : 0;
    document.getElementById("serveB").style.opacity = currentServer === "B" ? 1 : 0;
}
