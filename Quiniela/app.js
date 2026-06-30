/* =========================================================
   QUINIELA MUNDIAL 2026 — lógica principal
   ========================================================= */

const STORAGE_KEY = 'quiniela_mundial_2026_v1';

const ROUND_DEFS = [
  { id: 'r32',   name: 'Dieciseisavos de Final', tag: 'R32', count: 16 },
  { id: 'r16',   name: 'Octavos de Final',       tag: 'R16', count: 8  },
  { id: 'qf',    name: 'Cuartos de Final',       tag: 'QF',  count: 4  },
  { id: 'sf',    name: 'Semifinales',            tag: 'SF',  count: 2  },
  { id: 'final', name: 'Gran Final',             tag: 'F',   count: 1  },
];

const POINTS_EXACT = 3;
const POINTS_CLOSEST = 1;
const RULETA_THRESHOLD = 4; // si la diferencia total mínima supera esto, nadie estuvo cerca

const PLAYER_KEYS = ['p1', 'p2', 'p3'];
const PLAYER_COLORS = ['#E8B73C', '#2BA89A', '#E8643C'];

const PRIZES = [
  'comprar Tortrix para todos 🌽',
  'comprar agua para todos 💧',
  'comprar Tortrix y agua para todos 😂',
  'invitar un refresco a cada quien 🥤',
];

let state = null;
let currentWheelMatchId = null;

/* ---------------- Cruce oficial de Dieciseisavos (R32) ----------------
   Orden verificado (FIFA / CBS Sports / Fox Sports, 30 jun 2026).
   Los partidos quedan emparejados en parejas consecutivas (1-2, 3-4, 5-6...)
   para que el cruce de Octavos, Cuartos, Semis y Final salga automático
   y respete el camino oficial: equipos del mismo lado del cuadro no se
   cruzan hasta semifinales. */
const R32_SEEDS = [
  { a: 'Alemania',          b: 'Paraguay',             real: { a: 1, b: 1 }, penalty: 'B' }, // Paraguay avanza por penales
  { a: 'Francia',           b: 'Suecia' },
  { a: 'Sudáfrica',         b: 'Canadá',               real: { a: 0, b: 1 } },
  { a: 'Países Bajos',      b: 'Marruecos',            real: { a: 1, b: 1 }, penalty: 'B' }, // Marruecos avanza por penales
  { a: 'Portugal',          b: 'Croacia' },
  { a: 'España',            b: 'Austria' },
  { a: 'Estados Unidos',    b: 'Bosnia y Herzegovina' },
  { a: 'Bélgica',           b: 'Senegal' },
  { a: 'Brasil',            b: 'Japón',                real: { a: 2, b: 1 } },
  { a: 'Costa de Marfil',   b: 'Noruega',              real: { a: 1, b: 2 } },
  { a: 'México',            b: 'Ecuador' },
  { a: 'Inglaterra',        b: 'Congo RD' },
  { a: 'Argentina',         b: 'Cabo Verde' },
  { a: 'Australia',         b: 'Egipto' },
  { a: 'Suiza',             b: 'Argelia' },
  { a: 'Colombia',          b: 'Ghana' },
];

/* ---------------- Estado / almacenamiento ---------------- */

function createDefaultState() {
  const matches = {};
  ROUND_DEFS.forEach(round => {
    for (let i = 1; i <= round.count; i++) {
      const id = `${round.id}-${i}`;
      const seed = round.id === 'r32' ? R32_SEEDS[i - 1] : null;
      matches[id] = {
        id,
        round: round.id,
        index: i,
        teamA: seed ? seed.a : '',
        teamB: seed ? seed.b : '',
        real: seed && seed.real ? { a: seed.real.a, b: seed.real.b } : { a: null, b: null },
        penaltyWinner: seed && seed.penalty ? seed.penalty : null,
        predictions: {
          p1: { a: null, b: null },
          p2: { a: null, b: null },
          p3: { a: null, b: null },
        },
      };
    }
  });
  return {
    names: ['', '', ''],
    matches,
    punishments: {}, // matchId -> { playerIndex, prize }
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.matches) return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ---------------- Helpers de bracket ---------------- */

function prevRoundId(roundId) {
  const idx = ROUND_DEFS.findIndex(r => r.id === roundId);
  return idx > 0 ? ROUND_DEFS[idx - 1].id : null;
}

function getMatchTeams(id) {
  const m = state.matches[id];
  if (m.round === 'r32') {
    return {
      a: m.teamA && m.teamA.trim() ? m.teamA.trim() : null,
      b: m.teamB && m.teamB.trim() ? m.teamB.trim() : null,
    };
  }
  const prev = prevRoundId(m.round);
  const feederA = `${prev}-${2 * m.index - 1}`;
  const feederB = `${prev}-${2 * m.index}`;
  return {
    a: getWinnerName(feederA),
    b: getWinnerName(feederB),
  };
}

function getWinnerName(id) {
  const m = state.matches[id];
  const teams = getMatchTeams(id);
  if (m.real.a === null || m.real.b === null || m.real.a === '' || m.real.b === '') return null;
  const a = Number(m.real.a), b = Number(m.real.b);
  if (a > b) return teams.a;
  if (b > a) return teams.b;
  if (m.penaltyWinner === 'A') return teams.a;
  if (m.penaltyWinner === 'B') return teams.b;
  return null; // empate sin definir penales todavía
}

function isMatchReady(id) {
  const teams = getMatchTeams(id);
  return !!teams.a && !!teams.b;
}

/* ---------------- Evaluación de apuestas ---------------- */

function evaluateMatch(id) {
  const m = state.matches[id];
  if (m.real.a === null || m.real.b === null || m.real.a === '' || m.real.b === '') return null;
  const realA = Number(m.real.a), realB = Number(m.real.b);

  const bets = PLAYER_KEYS
    .map(k => ({ key: k, a: m.predictions[k].a, b: m.predictions[k].b }))
    .filter(b => b.a !== null && b.b !== null && b.a !== '' && b.b !== '');

  if (bets.length === 0) return { exact: [], closest: [], worst: [], needsRuleta: false, bets: [] };

  const withDist = bets.map(b => ({
    key: b.key,
    dist: Math.abs(Number(b.a) - realA) + Math.abs(Number(b.b) - realB),
  }));

  const exact = withDist.filter(b => b.dist === 0).map(b => b.key);
  const minDist = Math.min(...withDist.map(b => b.dist));
  const maxDist = Math.max(...withDist.map(b => b.dist));
  const closest = exact.length > 0 ? [] : withDist.filter(b => b.dist === minDist).map(b => b.key);
  // El/los que más se alejaron del resultado real son quienes tiran la ruleta de castigo.
  // Si todos acertaron igual (o solo hay un apostador), no hay "peor".
  const worst = bets.length > 1 && maxDist > minDist ? withDist.filter(b => b.dist === maxDist).map(b => b.key) : [];
  const needsRuleta = exact.length === 0 && minDist > RULETA_THRESHOLD;

  return { exact, closest, worst, needsRuleta, bets };
}

function computeScores() {
  const totals = { p1: 0, p2: 0, p3: 0 };
  Object.keys(state.matches).forEach(id => {
    const result = evaluateMatch(id);
    if (!result) return;
    result.exact.forEach(k => totals[k] += POINTS_EXACT);
    result.closest.forEach(k => totals[k] += POINTS_CLOSEST);
  });
  return totals;
}

/* ---------------- Render ---------------- */

function render() {
  renderScoreboard();
  renderRounds();
}

function renderScoreboard() {
  const totals = computeScores();
  const board = document.getElementById('scoreboard');
  const maxScore = Math.max(totals.p1, totals.p2, totals.p3);
  board.innerHTML = PLAYER_KEYS.map((k, i) => {
    const name = state.names[i] || `Jugador ${i + 1}`;
    const isLead = totals[k] === maxScore && maxScore > 0;
    return `
      <div class="score-chip ${isLead ? 'lead' : ''}">
        <span class="sc-name">${escapeHtml(name)}</span>
        <span class="sc-pts">${totals[k]}</span>
      </div>`;
  }).join('');
}

function renderRounds() {
  const container = document.getElementById('rounds');
  container.innerHTML = ROUND_DEFS.map(round => {
    const cards = [];
    for (let i = 1; i <= round.count; i++) {
      cards.push(renderMatchCard(`${round.id}-${i}`));
    }
    return `
      <section class="round-section">
        <div class="round-heading">
          <h2>${round.name}</h2>
          <span class="round-tag">${round.tag}</span>
        </div>
        <div class="match-grid">${cards.join('')}</div>
      </section>`;
  }).join('');
}

function renderMatchCard(id) {
  const m = state.matches[id];
  const teams = getMatchTeams(id);
  const ready = isMatchReady(id);
  const winnerName = getWinnerName(id);
  const result = evaluateMatch(id);
  const isTie = m.real.a !== null && m.real.b !== null && m.real.a !== '' && m.real.b !== ''
    && Number(m.real.a) === Number(m.real.b);

  const teamsHtml = m.round === 'r32'
    ? `
      <div class="teams-row">
        <input class="team-name-input" type="text" placeholder="Equipo local"
          value="${escapeAttr(m.teamA)}" data-match="${id}" data-field="teamA" maxlength="22">
        <span class="vs-divider">VS</span>
        <input class="team-name-input" type="text" placeholder="Equipo visitante"
          value="${escapeAttr(m.teamB)}" data-match="${id}" data-field="teamB" maxlength="22">
      </div>`
    : `
      <div class="teams-row">
        <span class="team-static ${!teams.a ? 'pending' : ''}">${teams.a ? escapeHtml(teams.a) : 'Por definir'}</span>
        <span class="vs-divider">VS</span>
        <span class="team-static ${!teams.b ? 'pending' : ''}">${teams.b ? escapeHtml(teams.b) : 'Por definir'}</span>
      </div>`;

  const realRow = `
    <div class="real-result-row">
      <label>Resultado real</label>
      <input class="score-input" type="number" min="0" max="30" ${ready ? '' : 'disabled'}
        value="${m.real.a !== null ? m.real.a : ''}" data-match="${id}" data-field="realA">
      <span class="score-sep">–</span>
      <input class="score-input" type="number" min="0" max="30" ${ready ? '' : 'disabled'}
        value="${m.real.b !== null ? m.real.b : ''}" data-match="${id}" data-field="realB">
    </div>`;

  const penaltyRow = isTie ? `
    <div class="penalty-row">
      <span>¿Quién avanzó en penales?</span>
      <label><input type="radio" name="pen-${id}" value="A" data-match="${id}" data-field="penaltyWinner" ${m.penaltyWinner === 'A' ? 'checked' : ''}> ${teams.a ? escapeHtml(teams.a) : 'Local'}</label>
      <label><input type="radio" name="pen-${id}" value="B" data-match="${id}" data-field="penaltyWinner" ${m.penaltyWinner === 'B' ? 'checked' : ''}> ${teams.b ? escapeHtml(teams.b) : 'Visitante'}</label>
    </div>` : '';

  const predictionsHtml = ready ? `
    <div class="predictions">
      ${PLAYER_KEYS.map((k, i) => `
        <div class="pred-row">
          <span class="pred-name">${escapeHtml(state.names[i] || `Jugador ${i + 1}`)}</span>
          <input class="score-input" type="number" min="0" max="30"
            value="${m.predictions[k].a !== null ? m.predictions[k].a : ''}"
            data-match="${id}" data-field="predA" data-player="${k}">
          <span class="score-sep">–</span>
          <input class="score-input" type="number" min="0" max="30"
            value="${m.predictions[k].b !== null ? m.predictions[k].b : ''}"
            data-match="${id}" data-field="predB" data-player="${k}">
        </div>`).join('')}
    </div>` : `<p class="not-ready">Esperando que se definan los equipos…</p>`;

  let evalHtml = '';
  if (result) {
    const badges = [];
    result.exact.forEach(k => badges.push(`<span class="badge badge-exact">🎯 ${escapeHtml(playerName(k))} — resultado exacto (+${POINTS_EXACT})</span>`));
    result.closest.forEach(k => badges.push(`<span class="badge badge-closest">👏 ${escapeHtml(playerName(k))} — el más cercano (+${POINTS_CLOSEST})</span>`));
    if (winnerName) badges.push(`<span class="badge badge-winner">🏆 Avanza ${escapeHtml(winnerName)}</span>`);
    if (result.needsRuleta && !state.punishments[id]) {
      badges.push(`<span class="badge badge-ruleta">😬 Nadie estuvo cerca</span>`);
    }
    if (result.worst.length > 0 && !state.punishments[id]) {
      const worstNames = result.worst.map(k => playerName(k)).join(' y ');
      badges.push(`<span class="badge badge-worst">📉 ${escapeHtml(worstNames)} — quedó más lejos</span>`);
    }
    evalHtml = `<div class="eval-box">${badges.join('')}</div>`;
  }

  const punishment = state.punishments[id];
  let ruletaFooter;
  if (punishment) {
    ruletaFooter = `<div class="castigo-tag">🥤 Castigo de hoy: <strong>${escapeHtml(playerName(PLAYER_KEYS[punishment.playerIndex]))}</strong> debe ${punishment.prize} <button class="ruleta-mini" data-spin="${id}" title="Volver a girar">🔁</button></div>`;
  } else if (!result) {
    ruletaFooter = `<button class="ruleta-mini" disabled>🎡 Ruleta (falta el resultado real)</button>`;
  } else if (result.worst.length === 0) {
    ruletaFooter = `<button class="ruleta-mini" disabled>🎡 Ruleta (nadie quedó como peor pronóstico)</button>`;
  } else {
    ruletaFooter = `<button class="ruleta-mini" data-spin="${id}">🎡 Tirar ruleta de castigo</button>`;
  }

  return `
    <div class="match-card ${winnerName ? 'decided' : ''}">
      <span class="match-num">Partido ${m.index}</span>
      ${teamsHtml}
      ${realRow}
      ${penaltyRow}
      ${predictionsHtml}
      ${evalHtml}
      <div class="card-footer">${ruletaFooter}</div>
    </div>`;
}

function playerName(key) {
  const i = PLAYER_KEYS.indexOf(key);
  return state.names[i] || `Jugador ${i + 1}`;
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escapeAttr(str) { return escapeHtml(str); }

/* ---------------- Eventos ---------------- */

function handleFieldChange(target) {
  const matchId = target.dataset.match;
  const field = target.dataset.field;
  if (!matchId || !field) return;
  const m = state.matches[matchId];

  if (field === 'teamA' || field === 'teamB') {
    m[field] = target.value;
  } else if (field === 'realA') {
    m.real.a = target.value === '' ? null : Math.max(0, Math.min(30, Number(target.value)));
    if (m.real.a === null || Number(m.real.a) !== Number(m.real.b)) m.penaltyWinner = null;
  } else if (field === 'realB') {
    m.real.b = target.value === '' ? null : Math.max(0, Math.min(30, Number(target.value)));
    if (m.real.b === null || Number(m.real.a) !== Number(m.real.b)) m.penaltyWinner = null;
  } else if (field === 'penaltyWinner') {
    m.penaltyWinner = target.value;
  } else if (field === 'predA') {
    m.predictions[target.dataset.player].a = target.value === '' ? null : Math.max(0, Math.min(30, Number(target.value)));
  } else if (field === 'predB') {
    m.predictions[target.dataset.player].b = target.value === '' ? null : Math.max(0, Math.min(30, Number(target.value)));
  }

  saveState();
  render();
}

document.addEventListener('change', e => {
  if (e.target.closest('#rounds')) handleFieldChange(e.target);
});

document.getElementById('rounds').addEventListener('click', e => {
  const spinBtn = e.target.closest('[data-spin]');
  if (spinBtn) openWheel(spinBtn.dataset.spin);
});

/* ---------------- Setup de nombres ---------------- */

function showSetup(prefill) {
  document.getElementById('setupOverlay').classList.remove('hidden');
  document.getElementById('name1').value = prefill ? state.names[0] : '';
  document.getElementById('name2').value = prefill ? state.names[1] : '';
  document.getElementById('name3').value = prefill ? state.names[2] : '';
}
function hideSetup() {
  document.getElementById('setupOverlay').classList.add('hidden');
}

document.getElementById('startBtn').addEventListener('click', () => {
  const n1 = document.getElementById('name1').value.trim();
  const n2 = document.getElementById('name2').value.trim();
  const n3 = document.getElementById('name3').value.trim();
  state.names = [n1 || 'Jugador 1', n2 || 'Jugador 2', n3 || 'Jugador 3'];
  saveState();
  hideSetup();
  render();
});

document.getElementById('editNamesBtn').addEventListener('click', () => showSetup(true));

document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('¿Seguro que quieres borrar toda la quiniela (nombres, predicciones y resultados)?')) {
    localStorage.removeItem(STORAGE_KEY);
    state = createDefaultState();
    showSetup(false);
  }
});

/* ---------------- Ruleta de castigo ----------------
   El jugador que tira la ruleta ya está definido: es quien más se alejó
   del resultado real en ese partido (lo calcula evaluateMatch). La ruleta
   gira entre los posibles castigos, no entre los jugadores. */

let currentWheelLoserKey = null;

function openWheel(matchId) {
  const result = evaluateMatch(matchId);
  if (!result) {
    alert('Primero hay que poner el resultado real de este partido.');
    return;
  }
  if (result.worst.length === 0) {
    alert('En este partido nadie quedó claramente como el peor pronóstico (empate o solo apostó una persona).');
    return;
  }
  // Si hay empate entre los peores, se sortea quién de ellos tira la ruleta.
  currentWheelLoserKey = result.worst[Math.floor(Math.random() * result.worst.length)];
  currentWheelMatchId = matchId;

  document.getElementById('wheelLoserName').textContent = playerName(currentWheelLoserKey);
  buildWheelSegments();
  document.getElementById('wheelResult').textContent = '';
  const wheel = document.getElementById('wheel');
  wheel.style.transition = 'none';
  wheel.style.transform = 'rotate(0deg)';
  // forzar reflow para que el próximo giro sí anime
  void wheel.offsetWidth;
  wheel.style.transition = '';
  document.getElementById('wheelModal').classList.remove('hidden');
}

function buildWheelSegments() {
  const wheel = document.getElementById('wheel');
  const n = PRIZES.length;
  const sliceDeg = 360 / n;
  const colors = ['#E8B73C', '#2BA89A', '#E8643C', '#D7263D', '#6B4FA0', '#3D8FB0'];
  const gradientParts = PRIZES.map((p, i) =>
    `${colors[i % colors.length]} ${i * sliceDeg}deg ${(i + 1) * sliceDeg}deg`
  );
  wheel.style.background = `conic-gradient(${gradientParts.join(', ')})`;

  wheel.innerHTML = '';
  PRIZES.forEach((p, i) => {
    const angle = i * sliceDeg + sliceDeg / 2;
    const label = document.createElement('span');
    label.className = 'wheel-label';
    label.textContent = p.replace(/\s*[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
    label.style.transform = `rotate(${angle}deg) translate(62px) rotate(90deg) translateX(-50%)`;
    wheel.appendChild(label);
  });
}

document.getElementById('spinBtn').addEventListener('click', () => {
  const wheel = document.getElementById('wheel');
  const n = PRIZES.length;
  const prizeIndex = Math.floor(Math.random() * n);
  const sliceDeg = 360 / n;
  const segmentCenter = prizeIndex * sliceDeg + sliceDeg / 2;
  const extraTurns = 5 * 360;
  // El puntero está fijo arriba (0deg); rotamos para que el centro del segmento quede ahí.
  const finalRotation = extraTurns + (360 - segmentCenter);

  wheel.style.transform = `rotate(${finalRotation}deg)`;

  const onEnd = () => {
    wheel.removeEventListener('transitionend', onEnd);
    const prize = PRIZES[prizeIndex];
    const playerIndex = PLAYER_KEYS.indexOf(currentWheelLoserKey);
    state.punishments[currentWheelMatchId] = { playerIndex, prize };
    saveState();
    document.getElementById('wheelResult').textContent =
      `🎉 ¡${playerName(currentWheelLoserKey)} debe ${prize} hoy mismo!`;
    render();
  };
  wheel.addEventListener('transitionend', onEnd);
});

document.getElementById('closeWheelBtn').addEventListener('click', () => {
  document.getElementById('wheelModal').classList.add('hidden');
});

/* ---------------- Init ---------------- */

function init() {
  state = loadState() || createDefaultState();
  if (!state.names || state.names.every(n => !n || !n.trim())) {
    showSetup(false);
  } else {
    hideSetup();
  }
  render();
}

init();