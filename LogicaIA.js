// ── PREDICCIÓN AUTOMÁTICA — MODO DRAMÁTICO ────────────────────────────────────

const TEAM_STRENGTH = {
  'México': 5, 'Sudáfrica': 1, 'Corea del Sur': 1.8, 'República Checa': 1,
  'Canadá': 1.5, 'Bosnia y Herzegovina': 0.5, 'Catar': 1, 'Suiza': 1.5,
  'Brasil': 8, 'Marruecos': 8, 'Haití': 1, 'Escocia': 2.5,
  'Estados Unidos': 2, 'Paraguay': 2.5, 'Australia': 1, 'Turquía': 3.5,
  'Alemania': 8.5, 'Curazao': 3, 'Costa de Marfil': 2, 'Ecuador': 5,
  'Países Bajos': 8, 'Japón': 4, 'Suecia': 3.5, 'Túnez': 2.5,
  'Bélgica': 6, 'Egipto': 2.5, 'Irán': 0.5, 'Nueva Zelanda': 2.5,
  'España': 9.5, 'Cabo Verde': 3.5, 'Arabia Saudita': 2.5, 'Uruguay': 7,
  'Francia': 9.5, 'Senegal': 6, 'Irak': 2, 'Noruega': 7,
  'Argentina': 9.5, 'Argelia': 4, 'Austria': 2, 'Jordania': 1.5,
  'Portugal': 9, 'RD Congo': 2, 'Uzbekistán': 1.5, 'Colombia': 7,
  'Inglaterra': 8.5, 'Croacia': 7, 'Ghana': 2.5, 'Panamá': 1,
};

function getStrength(teamObj) {
  if (!teamObj) return 5;
  return TEAM_STRENGTH[teamObj.team.name] || 5;
}

function poisson(lambda) {
  const lam = Math.max(0.2, lambda);
  let g = 0, p = Math.random(), cum = Math.exp(-lam), total = cum;
  while (p > total && g < 8) { g++; cum *= lam / g; total += cum; }
  return g;
}

function simulateMatch(hs, as) {
  const diff = hs - as;
  return [poisson(1.2 + diff * 0.18), poisson(1.2 - diff * 0.18)];
}

function simulateKnockout(homeTeam, awayTeam) {
  const hs = getStrength(homeTeam), as = getStrength(awayTeam);
  return Math.random() < hs / (hs + as) ? 0 : 1;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Actualiza el texto del botón con animación de puntos
function setBtnText(btn, text) {
  btn.textContent = text;
}

// Escribe los scores de un grupo de a uno con delay, como si los estuviera "cargando"
async function fillGroupAnimated(grp) {
  const card = document.getElementById(`group-card-${grp.id}`);
  for (let idx = 0; idx < MATCH_PAIRS.length; idx++) {
    const [i, j] = MATCH_PAIRS[idx];
    const k = `${grp.id}-${i}-${j}`;
    const s = state.scores[k];
    if (!card || !s) continue;
    // Buscar los inputs de este partido
    const inputs = card.querySelectorAll(
      `.score-input[data-g="${grp.id}"][data-i="${i}"][data-j="${j}"]`
    );
    inputs.forEach(input => {
      input.value = input.dataset.side === 'h' ? s.h : s.a;
      // Flash visual en el input
      input.style.transition = 'background 0.2s';
      input.style.background = '#fef9c3';
      setTimeout(() => { input.style.background = ''; }, 350);
    });
    updateGroupUI(grp.id);
    await sleep(80); // delay entre partidos del mismo grupo
  }
}

async function predictWithAI() {
  const btn = document.getElementById('predictBtn');
  const originalText = btn.textContent;
  btn.disabled = true;

  // ── FASE 1: GRUPOS ──────────────────────────────────────────────────────────
  const phaseMessages = [
    'Analizando grupos…', 'Calculando estadísticas…',
    'Procesando enfrentamientos…', 'Definiendo clasificados…'
  ];

  // Primero calcular todos los scores silenciosamente
  GROUPS_DATA.forEach(grp => {
    MATCH_PAIRS.forEach(([i, j]) => {
      const hs = getStrength({ team: grp.teams[i] });
      const as = getStrength({ team: grp.teams[j] });
      const [hg, ag] = simulateMatch(hs, as);
      state.scores[`${grp.id}-${i}-${j}`] = { h: hg, a: ag };
    });
    computeStandings(grp.id);
  });

  // Animar el llenado grupo por grupo con mensajes dramáticos
  for (let gi = 0; gi < GROUPS_DATA.length; gi++) {
    const grp = GROUPS_DATA[gi];
    setBtnText(btn, `Simulando Grupo ${grp.id}… ⚽`);
    await fillGroupAnimated(grp);
    await sleep(120);
  }

  updateProgress();

  setBtnText(btn, 'Definiendo clasificados… 📋');
  await sleep(800);

  computeQualifiers();
  buildR32Bracket();

  // ── FASE 2: DIECISEISAVOS ───────────────────────────────────────────────────
  setBtnText(btn, 'Armando el bracket… 🗂️');
  await sleep(700);

  activatePhase('r32');
  renderKnockout('r32', 'r32Grid', 'advanceR32Btn', 'R32');
  await sleep(500);

  setBtnText(btn, 'Simulando 16avos… ⚔️');

  // Resolver partido a partido con pausa para drama
  for (let idx = 0; idx < state.r32.length; idx++) {
    const match = state.r32[idx];
    await sleep(180);
    const side = simulateKnockout(match.home, match.away);
    match.winner = side === 0 ? match.home : match.away;
    renderKnockout('r32', 'r32Grid', 'advanceR32Btn', 'R32');
  }

  await sleep(900);

  // ── FASE 3: OCTAVOS ─────────────────────────────────────────────────────────
  setBtnText(btn, 'Octavos de final… 🔥');
  advanceR32();
  renderKnockout('r16', 'r16Grid', 'advanceR16Btn', 'Octavos');
  await sleep(500);

  for (let idx = 0; idx < state.r16.length; idx++) {
    const match = state.r16[idx];
    await sleep(220);
    const side = simulateKnockout(match.home, match.away);
    match.winner = side === 0 ? match.home : match.away;
    renderKnockout('r16', 'r16Grid', 'advanceR16Btn', 'Octavos');
  }

  await sleep(900);

  // ── FASE 4: CUARTOS ─────────────────────────────────────────────────────────
  setBtnText(btn, 'Cuartos de final… 😤');
  advanceR16();
  renderKnockout('qf', 'qfGrid', 'advanceQFBtn', 'Cuartos');
  await sleep(500);

  for (let idx = 0; idx < state.qf.length; idx++) {
    const match = state.qf[idx];
    await sleep(320);
    const side = simulateKnockout(match.home, match.away);
    match.winner = side === 0 ? match.home : match.away;
    renderKnockout('qf', 'qfGrid', 'advanceQFBtn', 'Cuartos');
  }

  await sleep(1000);

  // ── FASE 5: SEMIFINALES ─────────────────────────────────────────────────────
  setBtnText(btn, 'Semifinales… 😱');
  advanceQF();
  renderKnockout('sf', 'sfGrid', 'advanceSFBtn', 'Semifinal');
  await sleep(600);

  for (let idx = 0; idx < state.sf.length; idx++) {
    const match = state.sf[idx];
    await sleep(500);
    const side = simulateKnockout(match.home, match.away);
    match.winner = side === 0 ? match.home : match.away;
    renderKnockout('sf', 'sfGrid', 'advanceSFBtn', 'Semifinal');
  }

  await sleep(1200);

  // ── FASE 6: LA GRAN FINAL ───────────────────────────────────────────────────
  setBtnText(btn, '¡La Gran Final! 🏆');
  advanceSF();
  await sleep(800);

  // Suspenso extra antes del resultado final
  setBtnText(btn, 'El campeón es…');
  await sleep(1500);
  setBtnText(btn, 'El campeón es… ⏳');
  await sleep(800);
  setBtnText(btn, 'El campeón es… 🥁');
  await sleep(1000);

  const finalMatch = state.final[0];
  if (finalMatch) {
    const side = simulateKnockout(finalMatch.home, finalMatch.away);
    const champ = side === 0 ? finalMatch.home : finalMatch.away;
    state.final[0].winner = champ;
    state.champion = champ;
    renderFinal();
    if (champ) showChampion(champ);
  }

  btn.disabled = false;
  setBtnText(btn, originalText);
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('predictBtn');
  if (btn) btn.onclick = predictWithAI;
});