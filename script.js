const state = {
  players: [
    { name: 'Player 1', stats: { points: 0, aces: 0, doubleFaults: 0 } },
    { name: 'Player 2', stats: { points: 0, aces: 0, doubleFaults: 0 } },
  ],
  initialServer: 0,
  serverIndex: 0,
  numSets: 3,
  targetSetsToWin: 2,
  sets: [],
  currentSetIndex: 0,
  currentGamePoints: [0, 0],
  matchStarted: false,
  matchOver: false,
  history: [],
  pointTimeline: [],
  chart: null,
};

const pointLabels = ['0', '15', '30', '40', 'Ad'];

const startButton = document.getElementById('start');
const p1Point = document.getElementById('p1-point');
const p2Point = document.getElementById('p2-point');
const aceBtn = document.getElementById('ace');
const doubleFaultBtn = document.getElementById('double-fault');
const undoBtn = document.getElementById('undo');

function clone(data) {
  return JSON.parse(JSON.stringify(data));
}

function pushHistory() {
  state.history.push(clone({
    players: state.players,
    initialServer: state.initialServer,
    serverIndex: state.serverIndex,
    numSets: state.numSets,
    targetSetsToWin: state.targetSetsToWin,
    sets: state.sets,
    currentSetIndex: state.currentSetIndex,
    currentGamePoints: state.currentGamePoints,
    matchStarted: state.matchStarted,
    matchOver: state.matchOver,
    pointTimeline: state.pointTimeline,
  }));
}

function popHistory() {
  if (!state.history.length) return;
  const prev = state.history.pop();
  Object.assign(state, clone(prev));
  toggleControls(!state.matchOver);
  render();
}

function resetState() {
  state.sets = [createNormalSet()];
  state.currentSetIndex = 0;
  state.currentGamePoints = [0, 0];
  state.matchStarted = true;
  state.matchOver = false;
  state.history = [];
  state.pointTimeline = [];
  state.chart?.destroy();
  state.chart = null;
  state.serverIndex = state.initialServer;
}

function createNormalSet() {
  return {
    games: [0, 0],
    status: 'normal',
    tieBreakPoints: [0, 0],
    tieBreakSummary: null,
    winner: null,
  };
}

function createSuperSet() {
  return {
    games: [0, 0],
    status: 'super',
    tieBreakPoints: [0, 0],
    tieBreakSummary: null,
    winner: null,
  };
}

function startMatch() {
  const p1 = document.getElementById('player1').value.trim() || 'Player 1';
  const p2 = document.getElementById('player2').value.trim() || 'Player 2';
  state.players[0].name = p1;
  state.players[1].name = p2;
  state.players.forEach((p) => (p.stats = { points: 0, aces: 0, doubleFaults: 0 }));

  state.initialServer = Number(document.getElementById('server').value);
  state.serverIndex = Number(document.getElementById('server').value);
  state.numSets = Number(document.getElementById('sets').value);
  state.targetSetsToWin = state.numSets === 2 ? 2 : Math.ceil(state.numSets / 2);

  resetState();
  render();
  toggleControls(true);
}

function toggleControls(enabled) {
  [p1Point, p2Point, aceBtn, doubleFaultBtn, undoBtn].forEach(
    (btn) => (btn.disabled = !enabled)
  );
}

function recordTimeline() {
  const totalPoints = [state.players[0].stats.points, state.players[1].stats.points];
  state.pointTimeline.push({
    index: state.pointTimeline.length + 1,
    p1: totalPoints[0],
    p2: totalPoints[1],
  });
}

function applyPoint(winner, { ace = false, doubleFault = false } = {}) {
  if (!state.matchStarted || state.matchOver) return;
  pushHistory();

  state.players[winner].stats.points += 1;
  if (ace) state.players[winner].stats.aces += 1;
  if (doubleFault) state.players[state.serverIndex].stats.doubleFaults += 1;

  const set = state.sets[state.currentSetIndex];

  if (set.status === 'normal') {
    handleStandardPoint(winner, set);
  } else {
    handleTieBreakPoint(winner, set);
  }

  recordTimeline();
  render();
}

function handleStandardPoint(winner, set) {
  const opponent = winner === 0 ? 1 : 0;
  const points = state.currentGamePoints;

  const winnerPoints = points[winner];
  const opponentPoints = points[opponent];

  if (winnerPoints >= 3 && winnerPoints === opponentPoints) {
    // From deuce to advantage
    points[winner] += 1;
    return;
  }

  if (winnerPoints === 4) {
    // Winner had advantage
    finishGame(winner, set);
    return;
  }

  if (winnerPoints === 3 && opponentPoints < 3) {
    // 40 vs <=30
    finishGame(winner, set);
    return;
  }

  if (winnerPoints === 3 && opponentPoints === 4) {
    // Opponent advantage, back to deuce
    points[winner] = 3;
    points[opponent] = 3;
    return;
  }

  points[winner] += 1;
}

function handleTieBreakPoint(winner, set) {
  const target = set.status === 'super' ? 10 : 7;
  set.tieBreakPoints[winner] += 1;
  const wPoints = set.tieBreakPoints[winner];
  const oPoints = set.tieBreakPoints[winner === 0 ? 1 : 0];
  if (wPoints >= target && wPoints - oPoints >= 2) {
    set.tieBreakSummary = `${wPoints}-${oPoints}`;
    finishSet(winner, true);
  }
}

function finishGame(winner, set) {
  set.games[winner] += 1;
  state.currentGamePoints = [0, 0];
  toggleServer();

  const games = set.games;
  const diff = Math.abs(games[0] - games[1]);

  if (state.numSets === 1 && games[0] === 6 && games[1] === 6) {
    set.status = 'super';
    return;
  }

  if (games[winner] >= 6 && diff >= 2) {
    finishSet(winner, false);
    return;
  }

  if (games[0] === 6 && games[1] === 6) {
    set.status = 'tiebreak';
    set.tieBreakPoints = [0, 0];
  }
}

function finishSet(winner, fromTiebreak) {
  const set = state.sets[state.currentSetIndex];
  const losing = winner === 0 ? 1 : 0;
  if (fromTiebreak && !set.tieBreakSummary) {
    const wPoints = set.tieBreakPoints[winner];
    const oPoints = set.tieBreakPoints[losing];
    set.tieBreakSummary = `${wPoints}-${oPoints}`;
  }

  if (set.status !== 'normal' && set.games[0] === 0 && set.games[1] === 0) {
    // Deciding super tiebreak set (played entirely as a breaker)
    set.games[winner] = 1;
    set.games[losing] = 0;
  } else if (fromTiebreak && set.games[winner] === set.games[losing]) {
    // Standard set decided by a tiebreak at 6-6 (or 6-6 super breaker in 1-set format)
    set.games[winner] += 1;
  }

  set.winner = winner;
  state.currentSetIndex += 1;

  const setWins = countSetWins();
  if (setWins[winner] >= state.targetSetsToWin) {
    state.matchOver = true;
    renderChart();
    return;
  }

  if (state.numSets === 2 && setWins[0] === 1 && setWins[1] === 1) {
    state.sets.push(createSuperSet());
  } else {
    state.sets.push(createNormalSet());
  }

  state.serverIndex = (state.initialServer + state.currentSetIndex) % 2;
  state.currentGamePoints = [0, 0];
}

function countSetWins() {
  const wins = [0, 0];
  state.sets.forEach((set) => {
    if (set.winner === 0) wins[0] += 1;
    if (set.winner === 1) wins[1] += 1;
  });
  return wins;
}

function toggleServer() {
  state.serverIndex = state.serverIndex === 0 ? 1 : 0;
}

function renderScoreTable() {
  const scoreTable = document.getElementById('score-table');
  scoreTable.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'header';
  header.appendChild(createCell('Player'));
  const columns = Math.max(state.numSets, state.sets.length);
  for (let i = 0; i < columns; i++) {
    header.appendChild(createCell(`Set ${i + 1}`));
  }
  scoreTable.appendChild(header);

  [0, 1].forEach((idx) => {
    const row = document.createElement('div');
    row.className = 'row';
    const nameCell = createCell(state.players[idx].name, 'player-name');
    row.appendChild(nameCell);

    for (let i = 0; i < columns; i++) {
      const set = state.sets[i];
      const text = set ? formatSetCell(set, idx) : '-';
      row.appendChild(createCell(text));
    }

    scoreTable.appendChild(row);
  });
}

function formatSetCell(set, playerIndex) {
  const opponent = playerIndex === 0 ? 1 : 0;
  const base = `${set.games[playerIndex]}`;
  if (set.tieBreakSummary) {
    const indicator = playerIndex === 0 ? set.tieBreakSummary : reverseScore(set.tieBreakSummary);
    return `${base} (${indicator})`;
  }

  if (set.status !== 'normal') {
    return `${set.tieBreakPoints[playerIndex]}`;
  }

  if (set.games[0] === 0 && set.games[1] === 0 && set === state.sets[state.currentSetIndex]) {
    return '0';
  }

  return `${base}`;
}

function reverseScore(score) {
  const [a, b] = score.split('-');
  return `${b}-${a}`;
}

function createCell(text, className = '') {
  const cell = document.createElement('div');
  cell.className = `cell ${className}`;
  cell.textContent = text;
  return cell;
}

function renderPoints() {
  const set = state.sets[state.currentSetIndex];
  const container = document.getElementById('current-points');
  if (!set) {
    container.innerHTML = '<div class="label">Awaiting match start</div>';
    return;
  }
  const isTieBreak = set.status !== 'normal';

  const p1 = isTieBreak ? set.tieBreakPoints[0] : pointLabels[state.currentGamePoints[0]];
  const p2 = isTieBreak ? set.tieBreakPoints[1] : pointLabels[state.currentGamePoints[1]];
  const type = set.status === 'super' ? 'Super Tiebreak' : set.status === 'tiebreak' ? 'Tiebreak' : 'Game';

  container.innerHTML = `
    <div class="label">Current ${type}</div>
    <div class="value">${p1} - ${p2}</div>
    <div class="label">Server: ${state.players[state.serverIndex].name}</div>
  `;
}

function renderStatus() {
  const status = document.getElementById('match-status');
  if (!state.matchStarted) {
    status.textContent = 'Set up the match to begin.';
    return;
  }

  if (state.matchOver) {
    const winner = countSetWins()[0] > countSetWins()[1] ? 0 : 1;
    status.textContent = `${state.players[winner].name} wins the match!`;
    toggleControls(false);
  } else {
    status.textContent = 'Match in progress';
  }
}

function renderStats() {
  document.getElementById('p1-name').textContent = state.players[0].name;
  document.getElementById('p2-name').textContent = state.players[1].name;
  document.getElementById('stat-p1-name').textContent = state.players[0].name;
  document.getElementById('stat-p2-name').textContent = state.players[1].name;

  document.getElementById('p1-points').textContent = state.players[0].stats.points;
  document.getElementById('p2-points').textContent = state.players[1].stats.points;
  document.getElementById('p1-aces').textContent = state.players[0].stats.aces;
  document.getElementById('p2-aces').textContent = state.players[1].stats.aces;
  document.getElementById('p1-df').textContent = state.players[0].stats.doubleFaults;
  document.getElementById('p2-df').textContent = state.players[1].stats.doubleFaults;
}

function renderChart() {
  if (!state.matchOver || !state.pointTimeline.length) return;
  const ctx = document.getElementById('progression-chart');
  state.chart?.destroy();
  state.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: state.pointTimeline.map((p) => p.index),
      datasets: [
        {
          label: state.players[0].name,
          data: state.pointTimeline.map((p) => p.p1),
          borderColor: '#2dd6c1',
          tension: 0.2,
        },
        {
          label: state.players[1].name,
          data: state.pointTimeline.map((p) => p.p2),
          borderColor: '#ff8f70',
          tension: 0.2,
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          labels: { color: '#e6ebff' },
        },
      },
      scales: {
        x: { title: { display: true, text: 'Points Played', color: '#aab5d6' }, ticks: { color: '#aab5d6' } },
        y: { title: { display: true, text: 'Cumulative Points', color: '#aab5d6' }, ticks: { color: '#aab5d6' }, beginAtZero: true },
      },
    },
  });
}

function render() {
  renderScoreTable();
  renderPoints();
  renderStatus();
  renderStats();
}

if (typeof window !== 'undefined') {
  window.__matchAPI = {
    state,
    startMatch,
    applyPoint,
    popHistory,
    render,
  };
}

startButton.addEventListener('click', startMatch);

p1Point.addEventListener('click', () => applyPoint(0));
p2Point.addEventListener('click', () => applyPoint(1));
aceBtn.addEventListener('click', () => applyPoint(state.serverIndex, { ace: true }));
doubleFaultBtn.addEventListener('click', () => applyPoint(state.serverIndex === 0 ? 1 : 0, { doubleFault: true }));
undoBtn.addEventListener('click', popHistory);

toggleControls(false);
render();
