import { beforeEach, describe, expect, it, vi } from 'vitest';

function buildDom() {
  document.body.innerHTML = `
    <div class="page">
      <section id="setup">
        <input id="player1" />
        <input id="player2" />
        <select id="server"><option value="0">0</option><option value="1">1</option></select>
        <select id="sets"><option value="1">1</option><option value="2">2</option><option value="3">3</option></select>
        <button id="start"></button>
      </section>
      <section id="scoreboard">
        <div id="match-status"></div>
        <div id="score-table"></div>
        <div id="current-points"></div>
        <button id="p1-point"></button>
        <button id="p2-point"></button>
        <button id="ace"></button>
        <button id="double-fault"></button>
        <button id="undo"></button>
        <span id="p1-name"></span>
        <span id="p2-name"></span>
      </section>
      <section id="statistics">
        <h3 id="stat-p1-name"></h3>
        <h3 id="stat-p2-name"></h3>
        <span id="p1-points"></span>
        <span id="p2-points"></span>
        <span id="p1-aces"></span>
        <span id="p2-aces"></span>
        <span id="p1-df"></span>
        <span id="p2-df"></span>
      </section>
      <section id="chart-card">
        <canvas id="progression-chart"></canvas>
      </section>
    </div>
  `;
}

async function loadMatchScript() {
  vi.resetModules();
  buildDom();
  await import('./script.js');
}

describe('tennis match scoreboard', () => {
  beforeEach(async () => {
    await loadMatchScript();
  });

  it('plays a single-set match decided by a super tiebreak', () => {
    document.getElementById('player1').value = 'Alice';
    document.getElementById('player2').value = 'Bob';
    document.getElementById('sets').value = '1';
    document.getElementById('server').value = '0';

    document.getElementById('start').click();
    const { state, applyPoint } = window.__matchAPI;

    const winGame = (playerIndex) => {
      for (let i = 0; i < 4; i += 1) {
        applyPoint(playerIndex);
      }
    };

    for (let i = 0; i < 6; i += 1) {
      winGame(0);
      winGame(1);
    }

    expect(state.sets[state.currentSetIndex].status).toBe('super');

    for (let i = 0; i < 9; i += 1) {
      applyPoint(0);
      applyPoint(1);
    }

    applyPoint(0);
    applyPoint(0);

    expect(state.matchOver).toBe(true);
    expect(state.sets[0].tieBreakSummary).toBe('11-9');
    expect(state.sets[0].winner).toBe(0);
  });

  it('records double faults for the serving player and awards the receiver', () => {
    document.getElementById('sets').value = '3';
    document.getElementById('server').value = '0';
    document.getElementById('start').click();

    const { state, applyPoint } = window.__matchAPI;

    for (let i = 0; i < 4; i += 1) {
      applyPoint(1, { doubleFault: true });
    }

    expect(state.players[0].stats.doubleFaults).toBe(4);
    expect(state.players[1].stats.points).toBe(4);
    expect(state.sets[0].games[1]).toBe(1);
    expect(state.serverIndex).toBe(1);
  });
});
