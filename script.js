// ===============================
// MATCH STATE
// ===============================
let matchType = 1;    // 1,2,3,5
let setsToWin = 1;    // 1,2,3
const MAX_SETS = 5;

let playerA = {
    name: "",
    sets: [0, 0, 0, 0, 0],          // 1 = won set
    setScores: [null, null, null, null, null], // games per set
    games: 0,
    points: 0,
    totalPointsWon: 0,
    aces: 0,
    doubleFaults: 0
};

let playerB = {
    name: "",
    sets: [0, 0, 0, 0, 0],
    setScores: [null, null, null, null, null],
    games: 0,
    points: 0,
    totalPointsWon: 0,
    aces: 0,
    doubleFaults: 0
};

let currentSet = 0;          // 0 = Set 1
let currentServer = "A";     // 'A' or 'B'
let inTiebreak = false;
let inSuperTiebreak = false;
let matchOver = false;

const pointLabels = ["0", "15", "30", "40", "Ad"];

let history = [];            // for undo

// MOMENTUM: per point events
// each event = { winner:'A'|'B', server:'A'|'B', type:'normal'|'ace'|'df', value:+1/-1, cumulative:number }
let momentumEvents = [];
// index in momentumEvents where each game ended
let gameBoundaries = [];


// ===============================
// HELPERS
// ===============================
function otherPlayer(id) {
    return id === "A" ? "B" : "A";
}

function countSetsWon(player) {
    return player.sets.reduce((acc, v) => acc + (v ? 1 : 0), 0);
}

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
        matchOver,
        momentumEvents,
        gameBoundaries
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
    momentumEvents = s.momentumEvents || [];
    gameBoundaries = s.gameBoundaries || [];
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

    // reset full state
    playerA.sets = [0, 0, 0, 0, 0];
    playerA.setScores = [null, null, null, null, null];
    playerA.games = 0;
    playerA.points = 0;
    playerA.totalPointsWon = 0;
    playerA.aces = 0;
    playerA.doubleFaults = 0;

    playerB.sets = [0, 0, 0, 0, 0];
    playerB.setScores = [null, null, null, null, null];
    playerB.games = 0;
    playerB.points = 0;
    playerB.totalPointsWon = 0;
    playerB.aces = 0;
    playerB.doubleFaults = 0;

    currentSet = 0;
    inTiebreak = false;
    inSuperTiebreak = false;
    matchOver = false;
    history = [];
    momentumEvents = [];
    gameBoundaries = [];

    const setup = document.getElementById("setupBox");
    if (setup) setup.classList.add("hidden");
    const board = document.getElementById("scoreboard");
    if (board) board.classList.remove("hidden");

    // hide stats / momentum if they exist
    const statsBox = document.getElementById("statsBox");
    if (statsBox) statsBox.classList.add("hidden");
    const momentumBox = document.getElementById("momentumBox");
    if (momentumBox) momentumBox.classList.add("hidden");

    updateUI();
}


// ===============================
// POINT REGISTRATION (stats + momentum)
// ===============================
function registerPoint(winnerId, serverId, type) {
    const winner = winnerId === "A" ? playerA : playerB;
    const server = serverId === "A" ? playerA : playerB;

    // stats
    winner.totalPointsWon++;
    if (type === "ace") {
        server.aces++;
    } else if (type === "df") {
        server.doubleFaults++;
    }

    // momentum
    const lastCum = momentumEvents.length
        ? momentumEvents[momentumEvents.length - 1].cumulative
        : 0;
    const delta = winnerId === "A" ? 1 : -1;

    momentumEvents.push({
        winner: winnerId,
        server: serverId,
        type,                 // "normal", "ace", "df"
        value: delta,
        cumulative: lastCum + delta
    });
}


// ===============================
// POINT WON ENTRY
// ===============================
function pointWon(winnerId, type = "normal") {
    if (matchOver) return;

    saveState();
    registerPoint(winnerId, currentServer, type);

    if (inSuperTiebreak) {
        superTiebreakPoint(winnerId);
        updateUI();
        return;
    }

    if (inTiebreak) {
        tiebreakPoint(winnerId);
        updateUI();
        return;
    }

    normalPointScoring(winnerId);
    updateUI();
}


// ===============================
// NORMAL POINT LOGIC (15-30-40-AD)
// ===============================
function normalPointScoring(playerId) {
    const p = playerId === "A" ? playerA : playerB;
    const o = playerId === "A" ? playerB : playerA;

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
            // deuce → advantage
            p.points = 4;
            return;
        }
        if (o.points === 4) {
            // opponent Ad → back to deuce
            o.points = 3;
            return;
        }
    }

    // p has AD → game
    if (p.points === 4) {
        winGame(playerId);
        return;
    }
}


// ===============================
// TIEBREAK POINT (to 7, win by 2)
// ===============================
function tiebreakPoint(playerId) {
    const p = playerId === "A" ? playerA : playerB;
    const o = playerId === "A" ? playerB : playerA;

    p.points++;

    if (p.points >= 7 && p.points - o.points >= 2) {
        winSet(playerId, "tiebreak");
    }
}


// ===============================
// SUPER TIEBREAK POINT (to 10, win by 2)
// ===============================
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
    // server wins point, type = "ace"
    pointWon(currentServer, "ace");
}

function recordDoubleFault() {
    if (matchOver) return;
    const receiver = otherPlayer(currentServer);
    // receiver wins point, type = "df"
    pointWon(receiver, "df");
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

    // mark end of game for momentum graph
    gameBoundaries.push(momentumEvents.length);

    // 6–6 → decide tiebreak / super tiebreak
    if (p.games === 6 && o.games === 6) {
        // 1 set → super tiebreak at 6–6 in first set
        if (matchType === 1 && currentSet === 0) {
            startSuperTiebreak();
            return;
        }

        // 2 sets: if sets later are 1–1 → super tie would come after
        // (here мы просто играем обычный тай-брейк в этом сете)
        startTiebreak();
        return;
    }

    // normal set end: 6:x (diff>=2) or 7:x
    if (
        (p.games >= 6 && p.games - o.games >= 2) ||
        p.games === 7
    ) {
        winSet(playerId, "normal");
        return;
    }

    // next game: alternate server
    currentServer = otherPlayer(currentServer);
}

function winSet(playerId, mode) {
    const winner = playerId === "A" ? playerA : playerB;
    const loser  = playerId === "A" ? playerB : playerA;

    let gamesA = playerA.games;
    let gamesB = playerB.games;

    // for tie-break, winner gets +1 game (7–6)
    if (mode === "tiebreak") {
        if (playerId === "A") {
            gamesA = playerA.games + 1;
            gamesB = playerB.games;
        } else {
            gamesB = playerB.games + 1;
            gamesA = playerA.games;
        }

        // mark end of "game" for momentum graph too
        gameBoundaries.push(momentumEvents.length);
    }

    // super tie-break: use tiebreak points as "games" (e.g., 10–8)
    if (mode === "supertiebreak") {
        gamesA = playerA.points;
        gamesB = playerB.points;

        gameBoundaries.push(momentumEvents.length);
    }

    // store real set scores
    playerA.setScores[currentSet] = gamesA;
    playerB.setScores[currentSet] = gamesB;

    // store who won set
    if (gamesA > gamesB) {
        playerA.sets[currentSet] = 1;
        playerB.sets[currentSet] = 0;
    } else if (gamesB > gamesA) {
        playerB.sets[currentSet] = 1;
        playerA.sets[currentSet] = 0;
    }

    // reset games/points
    playerA.games = 0;
    playerB.games = 0;
    playerA.points = 0;
    playerB.points = 0;

    inTiebreak = false;
    inSuperTiebreak = false;

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

    // next set
    currentSet++;
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
    const statusEl = document.getElementById("matchStatus");
    if (statusEl) statusEl.textContent = `${winnerName} wins!`;

    // STATS BOX (if present)
    const statsBox = document.getElementById("statsBox");
    if (statsBox) {
        statsBox.classList.remove("hidden");

        const nA = document.getElementById("statsNameA");
        const nB = document.getElementById("statsNameB");
        const pA = document.getElementById("statsPointsA");
        const pB = document.getElementById("statsPointsB");
        const aA = document.getElementById("statsAcesA");
        const aB = document.getElementById("statsAcesB");
        const dA = document.getElementById("statsDfA");
        const dB = document.getElementById("statsDfB");

        if (nA) nA.textContent = playerA.name;
        if (nB) nB.textContent = playerB.name;
        if (pA) pA.textContent = playerA.totalPointsWon;
        if (pB) pB.textContent = playerB.totalPointsWon;
        if (aA) aA.textContent = playerA.aces;
        if (aB) aB.textContent = playerB.aces;
        if (dA) dA.textContent = playerA.doubleFaults;
        if (dB) dB.textContent = playerB.doubleFaults;
    }

    // MOMENTUM BOX (if present)
    const momentumBox = document.getElementById("momentumBox");
    if (momentumBox) {
        momentumBox.classList.remove("hidden");
        drawMomentumGraph();
    }
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
    const nameAEl = document.getElementById("nameA");
    const nameBEl = document.getElementById("nameB");
    if (nameAEl) nameAEl.textContent = playerA.name;
    if (nameBEl) nameBEl.textContent = playerB.name;

    // buttons labels
    const btnA = document.getElementById("btnPointA");
    const btnB = document.getElementById("btnPointB");
    if (btnA) btnA.textContent = `Point ${playerA.name}`;
    if (btnB) btnB.textContent = `Point ${playerB.name}`;

    // set scores (real games per set or "-")
    const setA1 = document.getElementById("setA1");
    const setA2 = document.getElementById("setA2");
    const setB1 = document.getElementById("setB1");
    const setB2 = document.getElementById("setB2");

    if (setA1) setA1.textContent =
        playerA.setScores[0] != null ? playerA.setScores[0] : "-";
    if (setA2) setA2.textContent =
        playerA.setScores[1] != null ? playerA.setScores[1] : "-";

    if (setB1) setB1.textContent =
        playerB.setScores[0] != null ? playerB.setScores[0] : "-";
    if (setB2) setB2.textContent =
        playerB.setScores[1] != null ? playerB.setScores[1] : "-";

    // current games
    const gA = document.getElementById("gamesA");
    const gB = document.getElementById("gamesB");
    if (gA) gA.textContent = playerA.games;
    if (gB) gB.textContent = playerB.games;

    // points — numeric in tie/supertie, tennis labels otherwise
    const pA = document.getElementById("pointsA");
    const pB = document.getElementById("pointsB");

    if (pA) {
        pA.textContent =
            inTiebreak || inSuperTiebreak
                ? playerA.points
                : pointLabels[playerA.points];
    }
    if (pB) {
        pB.textContent =
            inTiebreak || inSuperTiebreak
                ? playerB.points
                : pointLabels[playerB.points];
    }

    // server indicator
    const sA = document.getElementById("serveA");
    const sB = document.getElementById("serveB");
    if (sA) sA.style.opacity = currentServer === "A" ? 1 : 0;
    if (sB) sB.style.opacity = currentServer === "B" ? 1 : 0;
}


// ===============================
// MOMENTUM GRAPH DRAWING
// ===============================
function drawMomentumGraph() {
    const canvas = document.getElementById("momentumCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const mid = H / 2;

    ctx.clearRect(0, 0, W, H);

    // Baseline (0 momentum)
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, mid);
    ctx.lineTo(W, mid);
    ctx.stroke();

    if (momentumEvents.length === 0) return;

    const n = momentumEvents.length;
    const stepX = n > 1 ? W / (n - 1) : 0;

    // collect cumulative values
    const values = momentumEvents.map(e => e.cumulative);
    const maxAbs = Math.max(
        1,
        Math.abs(Math.min(...values)),
        Math.abs(Math.max(...values))
    );
    const scaleY = (H * 0.4) / maxAbs; // 40% of height for max

    // draw segments
    ctx.lineWidth = 2;

    for (let i = 1; i < n; i++) {
        const prev = momentumEvents[i - 1];
        const curr = momentumEvents[i];

        const x1 = (i - 1) * stepX;
        const y1 = mid - prev.cumulative * scaleY;
        const x2 = i * stepX;
        const y2 = mid - curr.cumulative * scaleY;

        // red segment for double fault, green otherwise
        ctx.strokeStyle = curr.type === "df" ? "#ff4444" : "#4BCF47";

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    // draw Ace markers ("A" in yellow)
    ctx.font = "bold 12px system-ui";
    ctx.fillStyle = "#ffd447"; // yellow
    for (let i = 0; i < n; i++) {
        const ev = momentumEvents[i];
        if (ev.type === "ace") {
            const x = i * stepX;
            const y = mid - ev.cumulative * scaleY;
            ctx.fillText("A", x + 3, y - 6);
        }
    }

    // draw dashed vertical lines at game boundaries
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;

    gameBoundaries.forEach(idx => {
        if (idx <= 0 || idx >= n) return;
        const x = idx * stepX;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
    });

    ctx.restore();
}
