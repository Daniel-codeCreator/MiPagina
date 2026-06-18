function activatePhase(phase) {
  // Mostrar solo la sección correspondiente
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

  // Determinar hasta qué fase se ha calculado (independiente de cuál se está viendo)
  const order = ['groups', 'r32', 'r16', 'qf', 'sf', 'final'];

  function phaseIsDone(p) {
    if (p === 'groups') return countPlayedMatches() === 72;
    if (p === 'r32')    return state.r32.length > 0;
    if (p === 'r16')    return state.r16.length > 0;
    if (p === 'qf')     return state.qf.length > 0;
    if (p === 'sf')     return state.sf.length > 0;
    if (p === 'final')  return state.final.length > 0;
    return false;
  }

  const navIds = {
    groups: null,
    r32:    'navR32',
    r16:    'navR16',
    qf:     'navQF',
    sf:     'navSF',
    final:  'navFinal',
  };

  order.forEach(p => {
    const btnId = navIds[p];
    if (!btnId) return;
    const btn = document.getElementById(btnId);
    if (!btn) return;

    // Habilitar si esa fase ya fue calculada
    btn.disabled = !phaseIsDone(p);
    if (p === phase) btn.classList.add('active');
  });

  // Marcar activo el botón de grupos si corresponde
  if (phase === 'groups') {
    const gBtn = document.querySelector('[data-phase="groups"]');
    if (gBtn) gBtn.classList.add('active');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}