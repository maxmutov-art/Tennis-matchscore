// =====================================================
// MATCH VARIABLES
// =====================================================
let matchType = 1; // 1,2,3,5 sets
let setsToWin = 1;

let playerA = { name: "", sets: [0,0,0,0,0], games: 0, points: 0 };
let playerB = { name: "", sets: [0,0,0,0,0], games: 0, points: 0 };

let currentSet = 0;
let currentServer = "A";

let inTiebreak = false;
let inSuperTiebreak = false;

const pointLabels = ["0", "15", "30", "40", "Ad"];

let history = []; // For undo


// =====================================================
// START MATCH
// =====================================================
function startMatch() {
    playerA.name = document.getElementById("nameAInput").value || "Player A";
    playerB.name = document.getElementById("nameBInput").value || "Player B";

    matchType = parseInt(document.querySelector("input[name='matchType']:checked").value);

    if (matchType === 1) setsToWin = 1;
    if (matchType === 2) setsToWin = 2; 
    if (matchType === 3) setsToWin = 2;
    if (matchType === 5) setsToWin = 3;

    document.getElementById("setupBox").classList.add("hidden");
    document.getElementById("scoreboard").classList.remove("hidden");

    updateUI();
}


// =====================================================
// POINT WON
// =====================================================
function pointWon(player) {
    saveState(); // for undo

    let p = player === "A" ? playerA : playerB;
    let o = player === "A" ? playerB : playerA;

    // SUPER TIEBREAK LOGIC
    if (inSuperTiebreak) {
        p.points++;
        checkSuperTiebreak(player);
        updateUI();
        return;
    }

    // STANDARD TIEBREAK LOGIC
    if (inTiebreak) {
        p.points++;
        checkTiebreak(player);
        updateUI();
        return;
    }

    // NORMAL POINTS
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
            o.points = 3; // Back to deuce
        }
    } else if (p.points === 4) {
        winGame(player);
        return;
    }

    updateUI();
}


// =====================================================
// GAME WIN
// =====================================================
function winGame(player) {
    let p = player === "A" ? playerA : playerB;
    let o = player === "A" ? playerB : playerA;

    p.games++;

    playerA.points = 0;
    playerB.points = 0;

    // TIEBREAK CHECK
    if (p.games === 6 && o.games === 6) {
        if (matchType === 1) {
            startSuperTiebreak();
            return;
        }

        if (matchType === 2 && currentSet === 1 && playerA.sets[0] === 1 && playerB.sets[0] === 1) {
            startSuperTiebreak();
            return;
        }

        startTiebreak();
        return;
    }

    // SET WIN
    if (
        (p.games >= 6 && p.games - o.games >= 2) ||
        p.games === 7
    ) {
        winSet(player);
        return;
    }

    updateUI();
}


// =====================================================
// SET WIN
// =====================================================
function winSet(player) {
    let p = player === "A" ? playerA : playerB;

    p.sets[currentSet] = 1;

    playerA.games = 0;
    playerB.games = 0;

    currentSet++;

    inTiebreak = false;
    inSuperTiebreak = false;

    if (countSets(playerA) === setsToWin) {
        endMatch("A");
        return;
    }
    if (countSets(playerB) === setsToWin) {
        endMatch("B");
        return;
    }

    updateUI();
}


// =====================================================
// TIEBREAK START
// =====================================================
function startTiebreak() {
    inTiebreak = true;
    playerA.points = 0;
    playerB.points = 0;
    updateUI();
}

function checkTiebreak(player) {
    let p = player === "A" ? playerA : playerB;
    let o = player === "A" ? playerB : playerA;

    if (p.points >= 7 && p.points - o.points >= 2) {
        winSet(player);
    }
}


// =====================================================
// SUPER TIEBREAK
// =====================================================
function startSuperTiebreak() {
    inSuperTiebreak = true;
    playerA.points = 0;
    playerB.points = 0;
    updateUI();
}

function checkSuperTiebreak(player) {
    let p = player === "A" ? playerA : playerB;
    let o = player === "A" ? playerB : playerA;

    if (p.points >= 10 && p.points - o.points >= 2) {
        winSet(player);
    }
}


// =====================================================
// END MATCH
// =====================================================
function endMatch(player) {
    document.getElementById("matchStatus").textContent =
        player === "A" ? `${playerA.name} wins!` : `${playerB.name} wins!`;
}


// =====================================================
// UNDO
// =====================================================
function saveState() {
    history.push(JSON.stringify({
        playerA: JSON.parse(JSON.stringify(playerA)),
        playerB: JSON.parse(JSON.stringify(playerB)),
        currentSet,
        currentServer,
        inTiebreak,
        inSuperTiebreak
    }));
}

function undo() {
    if (history.length === 0) return;

    let prev = JSON.parse(history.pop());

    playerA = prev.playerA;
    playerB = prev.playerB;
    currentSet = prev.currentSet;
    currentServer = prev.currentServer;
    inTiebreak = prev.inTiebreak;
    inSuperTiebreak = prev.inSuperTiebreak;

    updateUI();
}


// =====================================================
// UI UPDATE
// =====================================================
function updateUI() {
    document.getElementById("nameA").textContent = playerA.name;
    document.getElementById("nameB").textContent = playerB.name;

    document.getElementById("setA1").textContent = playerA.sets[0] ? 1 : 0;
    document.getElementById("setA2").textContent = playerA.sets[1] ? 1 : "-";

    document.getElementById("setB1").textContent = playerB.sets[0] ? 1 : 0;
    document.getElementById("setB2").textContent = playerB.sets[1] ? 1 : "-";

    document.getElementById("gamesA").textContent = playerA.games;
    document.getElementById("gamesB").textContent = playerB.games;

    document.getElementById("pointsA").textContent =
        inTiebreak || inSuperTiebreak ? playerA.points : pointLabels[playerA.points];

    document.getElementById("pointsB").textContent =
        inTiebreak || inSuperTiebreak ? playerB.points : pointLabels[playerB.points];

    document.getElementById("serveA").style.opacity =
        currentServer === "A" ? 1 : 0;
    document.getElementById("serveB").style.opacity =
        currentServer === "B" ? 1 : 0;
}


// =====================================================
// HELPERS
// =====================================================
function countSets(player) {
    return player.sets.reduce((a,b) => a + (b ? 1 : 0), 0);
}

function changeServer() {
    currentServer = currentServer === "A" ? "B" : "A";
    updateUI();
}

function resetMatch() {
    location.reload();
}
