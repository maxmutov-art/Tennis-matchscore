// ===============================
// MATCH STATE
// ===============================
let matchType = 1;    // 1,2,3,5
let setsToWin = 1;    // 1,2,3

const MAX_SETS = 5;

let playerA = {
    name: "",
    sets: [0,0,0,0,0],
    setScores: [null, null, null, null, null],
    games: 0,
    points: 0,

    // stats
    totalPointsWon: 0,
    aces: 0,
    doubleFaults: 0
};

let playerB = {
    name: "",
    sets: [0,0,0,0,0],
    setScores: [null, null, null, null, null],
    games: 0,
    points: 0,

    totalPointsWon: 0,
    aces: 0,
    doubleFaults: 0
};


let currentSet = 0;      // index 0 = Set 1
let currentServer = "A"; // 'A' or 'B'

let inTiebreak = false;
let inSuperTiebreak = false;
let matchOver = false;

const pointLabels = ["0", "15", "30", "40", "Ad"];

let history = []; // for undo


// ===============================
// HELPERS
// ===============================
function cloneState() {
    return JSON.stringify({
        matchType,
        setsToWin,
        playerA,
        playerB,
        currentSet,
        currentServer,
        inTiebreak,
        inSuperTiebreak,
        matchOver
    });
}

function restoreState(snapshot) {
    const s = JSON.parse(snapshot);
    matchType = s.matchType;
    setsToWin = s.setsToWin;
    playerA = s.playerA;
    playerB = s.playerB;
    currentSet = s.currentSet;
    currentServer = s.currentServer;
    inTiebreak = s.inTiebreak;
    inSuperTiebreak = s.inSuperTiebreak;
    matchOver = s.matchOver;
}

function otherPlayer(id) {
    return id === "A" ? "B" : "A";
}

function countSetsWon(player) {
    return player.sets.reduce((acc, v) => acc + (v ? 1 : 0), 0);
}

function saveState() {
    history.push(cloneState());
}


// ===============================
// START MATCH
// ===============================
function startMatch() {
    playerA.name = document.getElementById("nameAInput").value || "Player A";
    playerB.name = document.getElementById("nameBInput").value || "Player B";

    // match type
    matchType = parseInt(
        document.querySelector("input[name='matchType']:checked").value,
        10
    );

    if (matchType === 1) setsToWin = 1;
    else if (matchType === 2) setsToWin = 2;
    else if (matchType === 3) setsToWin = 2;
    else if (matchType === 5) setsToWin = 3;

    // first server
    currentServer = document.querySelector(
        "input[name='firstServer']:checked"
    ).value;

    // reset whole match state (на всякий случай)
    playerA.sets = [0, 0, 0, 0, 0];
    playerA.setScores = [null, null, null, null, null];
    playerA.games = 0;
    playerA.points = 0;

    playerB.sets = [0, 0, 0, 0, 0];
    playerB.setScores = [null, null, null, null, null];
    playerB.games = 0;
    playerB.points = 0;

    currentSet = 0;
    inTiebreak = false;
    inSuperTiebreak = false;
    matchOver = false;
    history = [];

    document.getElementById("setupBox").classList.add("hidden");
    document.getElementById("scoreboard").classList.remove("hidden");

    updateUI();
}


// ===============================
// POINT WON (normal, ace, double fault)
// ===============================
function pointWon(playerId) {
    if (matchOver) return;

    saveState();

    if (inSuperTiebreak) {
        superTiebreakPoint(playerId);
        updateUI();
        return;
    }

    if (inTiebreak) {
        tiebreakPoint(playerId);
        updateUI();
        return;
    }

    normalPoint(playerId);
    updateUI();
}

// обычное очко (15–30–40–Ad)
function normalPoint(playerId) {
    const p = playerId === "A" ? playerA : playerB;
    const o = playerId === "A" ? playerB : playerA;

    // === POINT WON STATISTIC ===
    p.totalPointsWon++;

    // 0 → 15 → 30 → 40
    if (p.points <= 2) {
        p.points++; 
        return;
    }

    // p is at 40
    if (p.points === 3) {
        if (o.points < 3) {
            // 40 vs <=30 → game
            winGame(playerId);
            return;
        }

        if (o.points === 3) {
            // 40–40 (deuce) → advantage
            p.points = 4;
            return;
        }

        if (o.points === 4) {
            // opponent has AD → back to deuce
            o.points = 3;
            return;
        }
    }

    // p has AD → wins game
    if (p.points === 4) {
        winGame(playerId);
        return;
    }
}


// стандартный тай-брейк до 7
function tiebreakPoint(playerId) {
    const p = playerId === "A" ? playerA : playerB;
    const o = playerId === "A" ? playerB : playerA;

    p.points++;

    if (p.points >= 7 && p.points - o.points >= 2) {
        winSet(playerId, "tiebreak");
    }
}

// супер-тай-брейк до 10
function superTiebreakPoint(playerId) {
    const p = playerId === "A" ? playerA : playerB;
    const o = playerId === "A" ? playerB : playerA;

    p.points++;

    if (p.points >= 10 && p.points - o.points >= 2) {
        winSet(playerId, "supertiebreak");
    }
}


// ===============================
// ACE / DOUBLE FAULT (for current server)
// ===============================
function recordAce() {
    if (matchOver) return;
    saveState();
    const p = currentServer === "A" ? playerA : playerB;
    p.aces++;
    pointWon(currentServer);
}


function recordDoubleFault() {
    if (matchOver) return;
    saveState();
    const p = currentServer === "A" ? playerA : playerB;
    const receiver = currentServer === "A" ? playerB : playerA;
    p.doubleFaults++;
    pointWon(receiver === playerA ? "A" : "B");
}



// ===============================
// GAME & SET LOGIC
// ===============================
function winGame(playerId) {
    const p = playerId === "A" ? playerA : playerB;
    const o = playerId === "A" ? playerB : playerA;

    p.games++;
    playerA.points = 0;
    playerB.points = 0;

    // 6–6 -> решаем, что делать
    if (p.games === 6 && o.games === 6) {
        // 1 set -> сразу супер-тай-брейк
        if (matchType === 1 && currentSet === 0) {
            startSuperTiebreak();
            return;
        }

        // 2 sets, счёт по сетам 1–1 => супер-тай как отдельный "сет"
        // (делаем классический тай в этом сете, супер будет потом)
        // остальные случаи — обычный тай-брейк
        startTiebreak();
        return;
    }

    // обычное окончание сета (6:x или 7:x)
    if (
        (p.games >= 6 && p.games - o.games >= 2) ||
        p.games === 7
    ) {
        winSet(playerId, "normal");
        return;
    }

    // следующий гейм — другой подающий
    currentServer = otherPlayer(currentServer);
}

function winSet(playerId, mode) {
    const winner = playerId === "A" ? playerA : playerB;
    const loser  = playerId === "A" ? playerB : playerA;

    let gamesA = playerA.games;
    let gamesB = playerB.games;

    // если это тай-брейк,winner получает +1 гейм (7–6)
    if (mode === "tiebreak") {
        if (playerId === "A") {
            gamesA = playerA.games + 1;
            gamesB = playerB.games;
        } else {
            gamesB = playerB.games + 1;
            gamesA = playerA.games;
        }
    }

    // супер-тайбрейк — пишем реальные очки (10–8 и т.п.)
    if (mode === "supertiebreak") {
        gamesA = playerA.points;
        gamesB = playerB.points;
    }

    // сохраняем счёт по геймам в этом сете
    playerA.setScores[currentSet] = gamesA;
    playerB.setScores[currentSet] = gamesB;

    // отмечаем, кто выиграл сет
    if (gamesA > gamesB) {
        playerA.sets[currentSet] = 1;
        playerB.sets[currentSet] = 0;
    } else if (gamesB > gamesA) {
        playerB.sets[currentSet] = 1;
        playerA.sets[currentSet] = 0;
    }

    // обнуляем игры/очки
    playerA.games = 0;
    playerB.games = 0;
    playerA.points = 0;
    playerB.points = 0;

    inTiebreak = false;
    inSuperTiebreak = false;

    // проверяем матч
    const setsA = countSetsWon(playerA);
    const setsB = countSetsWon(playerB);

    if (setsA >= setsToWin) {
        endMatch("A");
        return;
    }
    if (setsB >= setsToWin) {
        endMatch("B");
        return;
    }

    // готовимся к следующему сету
    currentSet++;
    // подающий на следующий гейм — просто чередуем (упрощённый вариант)
    currentServer = otherPlayer(currentServer);
}

function startTiebreak() {
    inTiebreak = true;
    inSuperTiebreak = false;
    playerA.points = 0;
    playerB.points = 0;
}

function startSuperTiebreak() {
    inSuperTiebreak = true;
    inTiebreak = false;
    playerA.points = 0;
    playerB.points = 0;
}


// ===============================
// END / RESET / UNDO
// ===============================
function endMatch(winnerId) {
    matchOver = true;

    const winnerName = winnerId === "A" ? playerA.name : playerB.name;
    document.getElementById("matchStatus").textContent = `${winnerName} wins!`;

    // SHOW STATS BOX
    const stats = document.getElementById("statsBox");
    stats.classList.remove("hidden");

    // UPDATE PLAYER NAMES
    document.getElementById("statsNameA").textContent = playerA.name;
    document.getElementById("statsNameB").textContent = playerB.name;

    // UPDATE POINTS WON
    document.getElementById("statsPointsA").textContent = playerA.totalPointsWon;
    document.getElementById("statsPointsB").textContent = playerB.totalPointsWon;

    // UPDATE ACES
    document.getElementById("statsAcesA").textContent = playerA.aces;
    document.getElementById("statsAcesB").textContent = playerB.aces;

    // UPDATE DOUBLE FAULTS
    document.getElementById("statsDfA").textContent = playerA.doubleFaults;
    document.getElementById("statsDfB").textContent = playerB.doubleFaults;
}


function resetMatch() {
    location.reload();
}

function undo() {
    if (history.length === 0) return;
    const snapshot = history.pop();
    restoreState(snapshot);
    updateUI();
}


// ===============================
// UI UPDATE
// ===============================
function updateUI() {
    // names
    document.getElementById("nameA").textContent = playerA.name;
    document.getElementById("nameB").textContent = playerB.name;

    // кнопки с именами
    document.getElementById("btnPointA").textContent = `Point ${playerA.name}`;
    document.getElementById("btnPointB").textContent = `Point ${playerB.name}`;

    // set scores (реальные счёты геймов, например 6–1)
    document.getElementById("setA1").textContent =
        playerA.setScores[0] != null ? playerA.setScores[0] : "-";
    document.getElementById("setA2").textContent =
        playerA.setScores[1] != null ? playerA.setScores[1] : "-";

    document.getElementById("setB1").textContent =
        playerB.setScores[0] != null ? playerB.setScores[0] : "-";
    document.getElementById("setB2").textContent =
        playerB.setScores[1] != null ? playerB.setScores[1] : "-";

    // current games
    document.getElementById("gamesA").textContent = playerA.games;
    document.getElementById("gamesB").textContent = playerB.games;

    // points (в тай-брейке показываем 0–1–2… вместо 15–30–40)
    document.getElementById("pointsA").textContent =
        inTiebreak || inSuperTiebreak
            ? playerA.points
            : pointLabels[playerA.points];

    document.getElementById("pointsB").textContent =
        inTiebreak || inSuperTiebreak
            ? playerB.points
            : pointLabels[playerB.points];

    // server indicator
    document.getElementById("serveA").style.opacity =
        currentServer === "A" ? 1 : 0;
    document.getElementById("serveB").style.opacity =
        currentServer === "B" ? 1 : 0;
}
