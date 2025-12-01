// -------------------------
// MATCH STATE
// -------------------------
let playerA = { name: "Miles", sets: [0, 0], game: 0 };
let playerB = { name: "Leo",   sets: [0, 0], game: 0 };

let currentServer = "A"; // or "B"

// -------------------------
// MAIN UPDATE FUNCTION
// -------------------------
function updateUI() {
    // Names
    document.getElementById("nameA").textContent = playerA.name;
    document.getElementById("nameB").textContent = playerB.name;

    // Game score
    document.getElementById("gameA").textContent = playerA.game;
    document.getElementById("gameB").textContent = playerB.game;

    // Set scores (first two sets)
    document.getElementById("setA1").textContent = playerA.sets[0] ?? "-";
    document.getElementById("setA2").textContent = playerA.sets[1] ?? "-";

    document.getElementById("setB1").textContent = playerB.sets[0] ?? "-";
    document.getElementById("setB2").textContent = playerB.sets[1] ?? "-";

    // Serve indicator
    updateServeIndicator();
}

// -------------------------
// SERVE INDICATOR
// -------------------------
function updateServeIndicator() {
    document.getElementById("serveA").style.opacity = currentServer === "A" ? 1 : 0;
    document.getElementById("serveB").style.opacity = currentServer === "B" ? 1 : 0;
}

// -------------------------
// CHANGE SERVER
// -------------------------
function changeServer() {
    currentServer = currentServer === "A" ? "B" : "A";
    updateUI();
}

// -------------------------
// POINT WON LOGIC
// -------------------------
function pointWon(player) {
    let p = player === "A" ? playerA : playerB;

    p.game++;

    // Simple game logic: first to 4 wins a game
    if (p.game >= 4) {
        winGame(player);
    }

    updateUI();
}

function winGame(player) {
    let p = player === "A" ? playerA : playerB;

    p.sets[0]++;

    // Reset game scores
    playerA.game = 0;
    playerB.game = 0;

    updateUI();
}

// -------------------------
// RESET MATCH
// -------------------------
function resetMatch() {
    playerA = { name: "Miles", sets: [0, 0], game: 0 };
    playerB = { name: "Leo",   sets: [0, 0], game: 0 };
    currentServer = "A";
    updateUI();
}

// Initial load
updateUI();
