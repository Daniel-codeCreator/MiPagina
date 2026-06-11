const GROUPS_DATA = [
  { id: 'A', teams: [
    { name: 'México', flag: '🇲🇽' }, { name: 'Sudáfrica', flag: '🇿🇦' },
    { name: 'Corea del Sur', flag: '🇰🇷' }, { name: 'República Checa', flag: '🇨🇿' }
  ]},
  { id: 'B', teams: [
    { name: 'Canadá', flag: '🇨🇦' }, { name: 'Bosnia y Herzegovina', flag: '🇧🇦' },
    { name: 'Catar', flag: '🇶🇦' }, { name: 'Suiza', flag: '🇨🇭' }
  ]},
  { id: 'C', teams: [
    { name: 'Brasil', flag: '🇧🇷' }, { name: 'Marruecos', flag: '🇲🇦' },
    { name: 'Haití', flag: '🇭🇹' }, { name: 'Escocia', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' }
  ]},
  { id: 'D', teams: [
    { name: 'Estados Unidos', flag: '🇺🇸' }, { name: 'Paraguay', flag: '🇵🇾' },
    { name: 'Australia', flag: '🇦🇺' }, { name: 'Turquía', flag: '🇹🇷' }
  ]},
  { id: 'E', teams: [
    { name: 'Alemania', flag: '🇩🇪' }, { name: 'Curazao', flag: '🇨🇼' },
    { name: 'Costa de Marfil', flag: '🇨🇮' }, { name: 'Ecuador', flag: '🇪🇨' }
  ]},
  { id: 'F', teams: [
    { name: 'Países Bajos', flag: '🇳🇱' }, { name: 'Japón', flag: '🇯🇵' },
    { name: 'Suecia', flag: '🇸🇪' }, { name: 'Túnez', flag: '🇹🇳' }
  ]},
  { id: 'G', teams: [
    { name: 'Bélgica', flag: '🇧🇪' }, { name: 'Egipto', flag: '🇪🇬' },
    { name: 'Irán', flag: '🇮🇷' }, { name: 'Nueva Zelanda', flag: '🇳🇿' }
  ]},
  { id: 'H', teams: [
    { name: 'España', flag: '🇪🇸' }, { name: 'Cabo Verde', flag: '🇨🇻' },
    { name: 'Arabia Saudita', flag: '🇸🇦' }, { name: 'Uruguay', flag: '🇺🇾' }
  ]},
  { id: 'I', teams: [
    { name: 'Francia', flag: '🇫🇷' }, { name: 'Senegal', flag: '🇸🇳' },
    { name: 'Irak', flag: '🇮🇶' }, { name: 'Noruega', flag: '🇳🇴' }
  ]},
  { id: 'J', teams: [
    { name: 'Argentina', flag: '🇦🇷' }, { name: 'Argelia', flag: '🇩🇿' },
    { name: 'Austria', flag: '🇦🇹' }, { name: 'Jordania', flag: '🇯🇴' }
  ]},
  { id: 'K', teams: [
    { name: 'Portugal', flag: '🇵🇹' }, { name: 'RD Congo', flag: '🇨🇩' },
    { name: 'Uzbekistán', flag: '🇺🇿' }, { name: 'Colombia', flag: '🇨🇴' }
  ]},
  { id: 'L', teams: [
    { name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' }, { name: 'Croacia', flag: '🇭🇷' },
    { name: 'Ghana', flag: '🇬🇭' }, { name: 'Panamá', flag: '🇵🇦' }
  ]},
];

const MATCH_PAIRS = [[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];

let state = {
  scores: {},
  standings: {},
  qualifiers: {
    firsts: [],
    seconds: [],
    thirds: [],
    all32: [],
  },
  r32: [],
  r16: [],
  qf: [],
  sf: [],
  final: [],
  champion: null,
};

function getScore(g, i, j) {
  const k = `${g}-${i}-${j}`;
  return state.scores[k] || { h: '', a: '' };
}
function setScore(g, i, j, side, val) {
  const k = `${g}-${i}-${j}`;
  if (!state.scores[k]) state.scores[k] = { h: '', a: '' };
  state.scores[k][side] = val === '' ? '' : parseInt(val, 10);
  computeStandings(g);
  updateProgress();
  updateGroupUI(g);
  checkAdvanceButton();
}

function computeStandings(gid) {
  const grp = GROUPS_DATA.find(g => g.id === gid);
  const stats = grp.teams.map(t => ({ team: t, pts: 0, gf: 0, ga: 0, gd: 0, played: 0 }));

  MATCH_PAIRS.forEach(([i, j]) => {
    const s = getScore(gid, i, j);
    if (s.h === '' || s.a === '') return;
    const hg = s.h, ag = s.a;
    stats[i].gf += hg; stats[i].ga += ag; stats[i].gd += hg - ag; stats[i].played++;
    stats[j].gf += ag; stats[j].ga += hg; stats[j].gd += ag - hg; stats[j].played++;
    if (hg > ag)      { stats[i].pts += 3; }
    else if (hg < ag) { stats[j].pts += 3; }
    else              { stats[i].pts += 1; stats[j].pts += 1; }
  });

  stats.sort((a, b) =>
    b.pts - a.pts || b.gd - a.gd || b.gf - a.gf ||
    a.team.name.localeCompare(b.team.name)
  );
  state.standings[gid] = stats;
}

function countPlayedMatches() {
  let count = 0;
  GROUPS_DATA.forEach(g => {
    MATCH_PAIRS.forEach(([i, j]) => {
      const s = getScore(g.id, i, j);
      if (s.h !== '' && s.a !== '') count++;
    });
  });
  return count;
}

function updateProgress() {
  const total = 72;
  const played = countPlayedMatches();
  const pct = (played / total) * 100;
  document.getElementById('progressBar').style.width = pct + '%';
  document.getElementById('progressLabel').textContent = `${played} / ${total} partidos jugados`;
}

function checkAdvanceButton() {
  const played = countPlayedMatches();
  document.getElementById('advanceBtn').disabled = played < 72;
}

function renderGroups() {
  const grid = document.getElementById('groupsGrid');
  grid.innerHTML = '';

  const legend = document.createElement('div');
  legend.className = 'legend';
  legend.style.gridColumn = '1/-1';
  legend.innerHTML = `
    <div class="legend-item"><div class="legend-dot" style="background:var(--green)"></div> Clasifican (1° y 2°)</div>
    <div class="legend-item"><div class="legend-dot" style="background:var(--gold)"></div> Posible 3° mejor</div>
  `;
  grid.appendChild(legend);

  GROUPS_DATA.forEach(grp => {
    const card = document.createElement('div');
    card.className = 'group-card';
    card.id = `group-card-${grp.id}`;

    const standings = state.standings[grp.id] || grp.teams.map(t => ({ team: t, pts: 0, gf: 0, ga: 0, gd: 0, played: 0 }));

    card.innerHTML = `
      <div class="group-header">
        <span class="group-name">Grupo ${grp.id}</span>
        <span style="font-family:var(--font-cond);font-size:11px;letter-spacing:1px;color:var(--muted)">PJ PTS GF GC DG</span>
      </div>
      <table class="group-standings">
        <thead>
          <tr>
            <th>Equipo</th>
            <th>PJ</th><th>PTS</th><th>GF</th><th>GC</th><th>DG</th>
          </tr>
        </thead>
        <tbody>
          ${standings.map((s, idx) => `
            <tr class="${idx===0?'qualify-1':idx===1?'qualify-2':idx===2?'qualify-3':''}">
              <td><span class="team-pos">${idx+1}</span><span class="team-flag">${s.team.flag}</span><span class="team-name-cell">${s.team.name}</span></td>
              <td>${s.played}</td>
              <td class="td-pts">${s.pts}</td>
              <td>${s.gf}</td>
              <td>${s.ga}</td>
              <td>${s.gd >= 0 ? '+'+s.gd : s.gd}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="group-matches">
        <div class="matches-label">Partidos</div>
        ${MATCH_PAIRS.map(([i, j]) => {
          const s = getScore(grp.id, i, j);
          const played = s.h !== '' && s.a !== '';
          return `
            <div class="match-row ${played?'match-played':''}">
              <span class="match-team">${grp.teams[i].flag} ${grp.teams[i].name}</span>
              <input type="number" min="0" max="20" class="score-input"
                value="${s.h !== '' ? s.h : ''}"
                data-g="${grp.id}" data-i="${i}" data-j="${j}" data-side="h"
                placeholder="–">
              <span class="score-sep">:</span>
              <input type="number" min="0" max="20" class="score-input"
                value="${s.a !== '' ? s.a : ''}"
                data-g="${grp.id}" data-i="${i}" data-j="${j}" data-side="a"
                placeholder="–">
              <span class="match-team right">${grp.teams[j].name} ${grp.teams[j].flag}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
    grid.appendChild(card);
  });

  grid.addEventListener('input', e => {
    if (!e.target.classList.contains('score-input')) return;
    const { g, i, j, side } = e.target.dataset;
    setScore(g, parseInt(i), parseInt(j), side, e.target.value);
  });
}

function updateGroupUI(gid) {
  const card = document.getElementById(`group-card-${gid}`);
  if (!card) return;
  const standings = state.standings[gid] || [];
  const tbody = card.querySelector('tbody');
  if (!tbody) return;
  tbody.querySelectorAll('tr').forEach((tr, idx) => {
    const s = standings[idx];
    if (!s) return;
    tr.cells[0].innerHTML = `<span class="team-pos">${idx+1}</span><span class="team-flag">${s.team.flag}</span><span class="team-name-cell">${s.team.name}</span>`;
    tr.cells[1].textContent = s.played;
    tr.cells[2].textContent = s.pts;
    tr.cells[3].textContent = s.gf;
    tr.cells[4].textContent = s.ga;
    tr.cells[5].textContent = (s.gd >= 0 ? '+' : '') + s.gd;
    tr.className = idx===0?'qualify-1':idx===1?'qualify-2':idx===2?'qualify-3':'';
  });
  card.querySelectorAll('.match-row').forEach((row, mi) => {
    const [ii, jj] = MATCH_PAIRS[mi];
    const s = getScore(gid, ii, jj);
    row.classList.toggle('match-played', s.h !== '' && s.a !== '');
  });
}

function computeQualifiers() {
  const firsts  = [];
  const seconds = [];
  const thirds  = [];

  GROUPS_DATA.forEach(grp => {
    const st = state.standings[grp.id] || [];
    if (st.length < 3) return;
    firsts.push({ ...st[0], group: grp.id });
    seconds.push({ ...st[1], group: grp.id });
    thirds.push({ ...st[2], group: grp.id });
  });

  thirds.sort((a, b) =>
    b.pts - a.pts || b.gd - a.gd || b.gf - a.gf ||
    a.team.name.localeCompare(b.team.name)
  );

  const best8Thirds = thirds.slice(0, 8);

  state.qualifiers.firsts     = firsts;
  state.qualifiers.seconds    = seconds;
  state.qualifiers.thirds     = best8Thirds;
  state.qualifiers.allThirds  = thirds;

  return { firsts, seconds, best8Thirds, thirds };
}

function showThirdsModal({ firsts, seconds, best8Thirds, thirds }) {
  const modal = document.getElementById('thirdsModal');
  const content = document.getElementById('thirdsContent');

  const rows = thirds.map((t, idx) => `
    <tr>
      <td>${idx+1}. ${t.team.flag} <strong>${t.team.name}</strong> <span style="color:var(--muted);font-size:11px">Grupo ${t.group}</span></td>
      <td>${t.pts}</td>
      <td>${(t.gd >= 0 ? '+' : '') + t.gd}</td>
      <td>${t.gf}</td>
      <td>${t.ga}</td>
      <td>${idx < 8 ? '<span class="qualified-badge">✓ Clasifica</span>' : '<span style="color:var(--muted);font-size:11px">Eliminado</span>'}</td>
    </tr>
  `).join('');

  content.innerHTML = `
    <table class="thirds-table">
      <thead>
        <tr><th>Equipo</th><th>Pts</th><th>DG</th><th>GF</th><th>GC</th><th>Estado</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="font-size:12px;color:var(--muted)">Los 8 mejores terceros avanzan a la Ronda de 32. Total clasificados: 12 primeros + 12 segundos + 8 terceros = <strong style="color:var(--text)">32 equipos</strong>.</p>
  `;
  modal.classList.add('open');
}

// ── buildR32Bracket — BRACKET OFICIAL FIFA 2026 ──────────────────────────────
// Fuente: Anexo C del reglamento FIFA + worldcupstats.football/es/bracket
//
// Cruces fijos (independientes de quién clasifique):
//   P1:  1°E  vs  3°(A/B/C/D/F)      P9:  1°C  vs  2°F
//   P2:  1°I  vs  3°(C/D/F/G/H)      P10: 2°E  vs  2°I
//   P3:  2°A  vs  2°B                 P11: 1°A  vs  3°(C/E/F/H/I)
//   P4:  1°F  vs  2°C                 P12: 1°L  vs  3°(E/H/I/J/K)
//   P5:  2°K  vs  2°L                 P13: 1°J  vs  2°H
//   P6:  1°H  vs  2°J                 P14: 2°D  vs  2°G
//   P7:  1°D  vs  3°(B/E/F/I/J)      P15: 1°B  vs  3°(E/F/G/I/J)
//   P8:  1°G  vs  3°(A/E/H/I/J)      P16: 1°K  vs  3°(resto)
//
// Los slots "3°(X/Y/Z)" se resuelven tomando el mejor tercero clasificado
// cuyo grupo de origen esté en la lista de candidatos, sin repetir.
// ─────────────────────────────────────────────────────────────────────────────
function buildR32Bracket() {
  const { firsts, seconds, thirds } = state.qualifiers;

  const f = {};
  firsts.forEach(t  => { f[t.group] = t; });
  const s = {};
  seconds.forEach(t => { s[t.group] = t; });

  // thirds ya está ordenado de mejor a peor rendimiento (pts > gd > gf)
  const usedGroups = new Set();

  function getBestThirdFrom(candidateGroups) {
    // Busca el mejor tercero no usado cuyo grupo esté en candidateGroups
    const match = thirds.find(t => candidateGroups.includes(t.group) && !usedGroups.has(t.group));
    if (match) {
      usedGroups.add(match.group);
      return match;
    }
    // Fallback: cualquier tercero no usado (no debería ocurrir en condiciones normales)
    const fallback = thirds.find(t => !usedGroups.has(t.group));
    if (fallback) usedGroups.add(fallback.group);
    return fallback || null;
  }

  const bracket = [
    { label: 'Partido 1',  home: f['E'], away: getBestThirdFrom(['A','B','C','D','F']) },
    { label: 'Partido 2',  home: f['I'], away: getBestThirdFrom(['C','D','F','G','H']) },
    { label: 'Partido 3',  home: s['A'], away: s['B'] },
    { label: 'Partido 4',  home: f['F'], away: s['C'] },
    { label: 'Partido 5',  home: s['K'], away: s['L'] },
    { label: 'Partido 6',  home: f['H'], away: s['J'] },
    { label: 'Partido 7',  home: f['D'], away: getBestThirdFrom(['B','E','F','I','J']) },
    { label: 'Partido 8',  home: f['G'], away: getBestThirdFrom(['A','E','H','I','J']) },
    { label: 'Partido 9',  home: f['C'], away: s['F'] },
    { label: 'Partido 10', home: s['E'], away: s['I'] },
    { label: 'Partido 11', home: f['A'], away: getBestThirdFrom(['C','E','F','H','I']) },
    { label: 'Partido 12', home: f['L'], away: getBestThirdFrom(['E','H','I','J','K']) },
    { label: 'Partido 13', home: f['J'], away: s['H'] },
    { label: 'Partido 14', home: s['D'], away: s['G'] },
    { label: 'Partido 15', home: f['B'], away: getBestThirdFrom(['E','F','G','I','J']) },
    { label: 'Partido 16', home: f['K'], away: getBestThirdFrom(['A','B','C','D','E','F','G','H','I','J','K','L']) },
  ];

  state.r32 = bracket.map(m => ({ ...m, winner: null }));
}

function renderKnockout(phaseKey, containerId, advanceBtnId, title) {
  const matches = state[phaseKey];
  const grid = document.getElementById(containerId);
  grid.innerHTML = '';

  matches.forEach((m, idx) => {
    const card = document.createElement('div');
    card.className = 'match-card';
    const home = m.home;
    const away = m.away;

    card.innerHTML = `
      <div class="match-card-header">${m.label || title + ' — Partido ' + (idx+1)}</div>
      <div class="match-team-row ${m.winner && m.winner === home ? 'winner' : m.winner && m.winner !== home ? 'loser' : ''}"
           data-phase="${phaseKey}" data-match="${idx}" data-side="home">
        <span class="team-flag-lg">${home ? home.team.flag : '❓'}</span>
        <span class="team-name-lg ${home ? '' : 'team-tbd'}">${home ? home.team.name : 'Por definir'}</span>
        ${m.winner === home ? '<span class="winner-icon">✔</span>' : ''}
      </div>
      <div class="match-team-row ${m.winner && m.winner === away ? 'winner' : m.winner && m.winner !== away ? 'loser' : ''}"
           data-phase="${phaseKey}" data-match="${idx}" data-side="away">
        <span class="team-flag-lg">${away ? away.team.flag : '❓'}</span>
        <span class="team-name-lg ${away ? '' : 'team-tbd'}">${away ? away.team.name : 'Por definir'}</span>
        ${m.winner === away ? '<span class="winner-icon">✔</span>' : ''}
      </div>
    `;
    grid.appendChild(card);
  });

  grid.onclick = e => {
    const row = e.target.closest('.match-team-row');
    if (!row) return;
    const { phase, match, side } = row.dataset;
    const mi = parseInt(match);
    const chosen = state[phase][mi][side];
    if (!chosen) return;
    state[phase][mi].winner = chosen;
    checkKnockoutAdvance(phase, advanceBtnId);
    renderKnockout(phaseKey, containerId, advanceBtnId, title);
  };

  checkKnockoutAdvance(phaseKey, advanceBtnId);
}

function checkKnockoutAdvance(phase, btnId) {
  if (!btnId) return;
  const done = state[phase].every(m => m.winner !== null);
  const btn = document.getElementById(btnId);
  if (btn) btn.disabled = !done;
}

function advanceR32() {
  const w = state.r32.map(m => m.winner);
  state.r16 = [
    { label: 'Octavo 1',  home: w[0],  away: w[1]  },
    { label: 'Octavo 2',  home: w[2],  away: w[3]  },
    { label: 'Octavo 3',  home: w[4],  away: w[5]  },
    { label: 'Octavo 4',  home: w[6],  away: w[7]  },
    { label: 'Octavo 5',  home: w[8],  away: w[9]  },
    { label: 'Octavo 6',  home: w[10], away: w[11] },
    { label: 'Octavo 7',  home: w[12], away: w[13] },
    { label: 'Octavo 8',  home: w[14], away: w[15] },
  ].map(m => ({ ...m, winner: null }));
  activatePhase('r16');
}

function advanceR16() {
  const w = state.r16.map(m => m.winner);
  state.qf = [
    { label: 'Cuarto 1', home: w[0], away: w[1], winner: null },
    { label: 'Cuarto 2', home: w[2], away: w[3], winner: null },
    { label: 'Cuarto 3', home: w[4], away: w[5], winner: null },
    { label: 'Cuarto 4', home: w[6], away: w[7], winner: null },
  ];
  activatePhase('qf');
}

function advanceQF() {
  const w = state.qf.map(m => m.winner);
  state.sf = [
    { label: 'Semifinal 1', home: w[0], away: w[1], winner: null },
    { label: 'Semifinal 2', home: w[2], away: w[3], winner: null },
  ];
  activatePhase('sf');
}

function advanceSF() {
  const w = state.sf.map(m => m.winner);
  state.final = [
    { label: 'GRAN FINAL', home: w[0], away: w[1], winner: null },
  ];
  activatePhase('final');
  renderFinal();
}

function renderFinal() {
  const container = document.getElementById('finalContainer');
  const champDiv   = document.getElementById('championDisplay');
  const m = state.final[0];
  if (!m) return;

  container.innerHTML = `
    <div class="final-match">
      <div class="final-match-header">⚽ GRAN FINAL — MUNDIAL 2026 ⚽</div>
      <div class="final-team-row ${m.winner && m.winner===m.home?'winner':m.winner?'loser':''}" id="finalHome">
        <span class="final-flag">${m.home ? m.home.team.flag : '❓'}</span>
        <span class="final-name">${m.home ? m.home.team.name : 'Por definir'}</span>
        ${m.winner===m.home ? '<span style="font-size:24px;color:var(--gold)">🏆</span>' : ''}
      </div>
      <div style="text-align:center;padding:8px;color:var(--muted);font-family:var(--font-head);font-size:24px;letter-spacing:3px;border-bottom:1px solid var(--border)">VS</div>
      <div class="final-team-row ${m.winner && m.winner===m.away?'winner':m.winner?'loser':''}" id="finalAway">
        <span class="final-flag">${m.away ? m.away.team.flag : '❓'}</span>
        <span class="final-name">${m.away ? m.away.team.name : 'Por definir'}</span>
        ${m.winner===m.away ? '<span style="font-size:24px;color:var(--gold)">🏆</span>' : ''}
      </div>
    </div>
  `;

  document.getElementById('finalHome').onclick = () => {
    if (!m.home) return;
    state.final[0].winner = m.home;
    state.champion = m.home;
    renderFinal();
    showChampion(m.home);
  };
  document.getElementById('finalAway').onclick = () => {
    if (!m.away) return;
    state.final[0].winner = m.away;
    state.champion = m.away;
    renderFinal();
    showChampion(m.away);
  };

  if (m.winner) showChampion(m.winner);
}

function showChampion(team) {
  const div = document.getElementById('championDisplay');
  div.innerHTML = `
    <h2>🏆 CAMPEÓN DEL MUNDO 2026</h2>
    <span class="champion-flag">${team.team.flag}</span>
    <div class="champion-name">${team.team.name.toUpperCase()}</div>
    <p style="color:var(--muted);margin-top:1rem;font-family:var(--font-cond);font-size:14px;letter-spacing:2px">¡FELICIDADES AL CAMPEÓN!</p>
  `;
}

function activatePhase(phase) {
  document.querySelectorAll('.phase-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const map = {
    groups: 'phaseGroups',
    r32:    'phaseR32',
    r16:    'phaseR16',
    qf:     'phaseQF',
    sf:     'phaseSF',
    final:  'phaseFinal',
  };
  document.getElementById(map[phase]).classList.add('active');

  const order = ['groups','r32','r16','qf','sf','final'];
  const idx = order.indexOf(phase);
  order.forEach((p, i) => {
    const btnId = { groups: null, r32:'navR32', r16:'navR16', qf:'navQF', sf:'navSF', final:'navFinal' }[p];
    if (!btnId) return;
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = i > idx;
    if (p === phase) btn.classList.add('active');
  });

  if (phase === 'groups') {
    document.querySelector('[data-phase="groups"]').classList.add('active');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function init() {
  GROUPS_DATA.forEach(g => {
    state.standings[g.id] = g.teams.map(t => ({ team: t, pts:0, gf:0, ga:0, gd:0, played:0 }));
  });

  renderGroups();
  updateProgress();

  document.getElementById('advanceBtn').onclick = () => {
    const { firsts, seconds, best8Thirds, thirds } = computeQualifiers();
    showThirdsModal({ firsts, seconds, best8Thirds, thirds });
  };

  document.getElementById('confirmThirds').onclick = () => {
    document.getElementById('thirdsModal').classList.remove('open');
    buildR32Bracket();
    activatePhase('r32');
    renderKnockout('r32', 'r32Grid', 'advanceR32Btn', 'R32');
  };

  document.getElementById('advanceR32Btn').onclick = () => {
    advanceR32();
    renderKnockout('r16', 'r16Grid', 'advanceR16Btn', 'Octavos');
  };
  document.getElementById('advanceR16Btn').onclick = () => {
    advanceR16();
    renderKnockout('qf', 'qfGrid', 'advanceQFBtn', 'Cuartos');
  };
  document.getElementById('advanceQFBtn').onclick = () => {
    advanceQF();
    renderKnockout('sf', 'sfGrid', 'advanceSFBtn', 'Semifinal');
  };
  document.getElementById('advanceSFBtn').onclick = () => {
    advanceSF();
  };

  document.getElementById('phaseNav').addEventListener('click', e => {
    const btn = e.target.closest('.nav-btn');
    if (!btn || btn.disabled) return;
    const phase = btn.dataset.phase;
    activatePhase(phase);
    if (phase === 'r32' && state.r32.length)  renderKnockout('r32','r32Grid','advanceR32Btn','R32');
    if (phase === 'r16' && state.r16.length)  renderKnockout('r16','r16Grid','advanceR16Btn','Octavos');
    if (phase === 'qf'  && state.qf.length)   renderKnockout('qf','qfGrid','advanceQFBtn','Cuartos');
    if (phase === 'sf'  && state.sf.length)   renderKnockout('sf','sfGrid','advanceSFBtn','Semifinal');
    if (phase === 'final' && state.final.length) renderFinal();
  });

  document.getElementById('resetBtn').onclick = () => {
    if (!confirm('¿Reiniciar toda la predicción?')) return;
    state = {
      scores: {}, standings: {},
      qualifiers: { firsts:[], seconds:[], thirds:[], all32:[] },
      r32:[], r16:[], qf:[], sf:[], final:[], champion:null,
    };
    GROUPS_DATA.forEach(g => {
      state.standings[g.id] = g.teams.map(t => ({ team: t, pts:0, gf:0, ga:0, gd:0, played:0 }));
    });
    ['navR32','navR16','navQF','navSF','navFinal'].forEach(id => {
      document.getElementById(id).disabled = true;
    });
    activatePhase('groups');
    renderGroups();
    updateProgress();
    document.getElementById('advanceBtn').disabled = true;
  };

  document.getElementById('thirdsModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) e.currentTarget.classList.remove('open');
  });
}

document.addEventListener('DOMContentLoaded', init);