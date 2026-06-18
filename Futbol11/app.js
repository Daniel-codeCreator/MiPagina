// ── Estado ───────────────────────────────────────────────
let equipoActual     = null;
let fallos           = 0;
const MAX_FALLOS     = 5;
let juegoTerminado   = false;
let jugadorPendiente = null;
let sugIdx           = -1;
let totalColocados   = 0;   // jugadores en cancha (de distintos equipos)

// Todos los jugadores de todos los equipos (para autocomplete)
const todosLosJugadores = [];
equipos.forEach(eq => {
  eq.jugadores.forEach(j => {
    if (!todosLosJugadores.find(x => norm(x.nombre) === norm(j.nombre))) {
      todosLosJugadores.push(j);
    }
  });
});

// ── Elementos ────────────────────────────────────────────
const buscador      = document.getElementById("buscarJugador");
const sugBox        = document.getElementById("suggestions");
const equipoInfoEl  = document.getElementById("equipoInfo");
const fallosEl      = document.getElementById("fallosDisplay");
const mensajeEl     = document.getElementById("mensaje");
const progresoEl    = document.getElementById("progreso");
const modalOverlay  = document.getElementById("modal-overlay");
const modalTitulo   = document.getElementById("modal-titulo");
const modalBotones  = document.getElementById("modal-botones");
const modalCancelar = document.getElementById("modal-cancelar");

// ── Helpers ──────────────────────────────────────────────
function norm(s) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();
}

function slotsLibresPara(pos) {
  return [...document.querySelectorAll(`.slot[data-pos="${pos}"]`)]
    .filter(s => !s.classList.contains("ocupada"));
}

function slotsLibresTotales() {
  return [...document.querySelectorAll(".slot")]
    .filter(s => !s.classList.contains("ocupada"));
}

function highlightMatch(nombre, query) {
  const nN = norm(nombre), nQ = norm(query);
  const i = nN.indexOf(nQ);
  if (i === -1) return nombre;
  return nombre.slice(0,i)
    + `<span class="sug-match">${nombre.slice(i, i+query.length)}</span>`
    + nombre.slice(i+query.length);
}

// ── Cambiar equipo (sin tocar la cancha) ──────────────────
function siguienteEquipo() {
  // evitar repetir el mismo equipo
  const candidatos = equipos.filter(e => e !== equipoActual);
  equipoActual = candidatos[Math.floor(Math.random() * candidatos.length)];

  equipoInfoEl.style.opacity = "0";
  setTimeout(() => {
    equipoInfoEl.textContent = equipoActual.nombre.toUpperCase();
    equipoInfoEl.style.opacity = "1";
  }, 200);

  buscador.value = "";
  buscador.disabled = false;
  closeSuggestions();
  buscador.focus();
}

// ── Inicio de sesión ──────────────────────────────────────
function iniciarJuego() {
  fallos         = 0;
  totalColocados = 0;
  juegoTerminado = false;
  equipoActual   = null;

  // limpiar cancha
  document.querySelectorAll(".slot").forEach(s => {
    s.classList.remove("ocupada");
    s.innerHTML = s.dataset.pos;
  });

  buscador.value    = "";
  buscador.disabled = false;
  closeSuggestions();
  setMensaje("","");
  actualizarFallos();
  actualizarProgreso();
  siguienteEquipo();
}

// ── Intentar ──────────────────────────────────────────────
function intentar(nombreForzado) {
  if (juegoTerminado) return;
  const input = (nombreForzado || buscador.value).trim();
  if (!input) return;

  buscador.value = "";
  closeSuggestions();

  const nInput = norm(input);

  // ¿Existe en el equipo actual?
  const jugador = equipoActual.jugadores.find(j => norm(j.nombre) === nInput);

  if (!jugador) {
    fallos++;
    actualizarFallos();
    const enOtroEquipo = equipos.find(eq =>
      eq.nombre !== equipoActual.nombre &&
      eq.jugadores.find(j => norm(j.nombre) === nInput)
    );
    if (enOtroEquipo) {
      setMensaje(`❌ "${input}" juega en ${enOtroEquipo.nombre}, no en ${equipoActual.nombre}. Fallos: ${fallos}/${MAX_FALLOS}`, "error");
    } else {
      setMensaje(`❌ "${input}" no está en el ${equipoActual.nombre}. Fallos: ${fallos}/${MAX_FALLOS}`, "error");
    }
    if (fallos >= MAX_FALLOS) setTimeout(mostrarDerrota, 300);
    return;
  }

  // ── Correcto: buscar slot disponible ──
  const posDisponibles = jugador.posiciones.filter(p => slotsLibresPara(p).length > 0);

  if (posDisponibles.length === 0) {
    // no hay slot para esa posición, igual cambia equipo
    setMensaje(`✅ ¡${jugador.nombre}! (sin slot libre para ${jugador.posiciones.join("/")}), cambiando equipo...`, "ok");
    setTimeout(siguienteEquipo, 900);
    return;
  }

  setMensaje(`✅ ¡${jugador.nombre}!`, "ok");

  if (posDisponibles.length === 1) {
    colocarEnSlot(jugador, slotsLibresPara(posDisponibles[0])[0], posDisponibles[0]);
  } else {
    abrirModal(jugador, posDisponibles);
  }
}

// ── Colocar en slot (SIN borrar la cancha) ────────────────
function colocarEnSlot(jugador, slot, pos) {
  const partes = jugador.nombre.split(" ");
  const corto  = partes.length > 1
    ? partes[0].slice(0,1) + ". " + partes.slice(1).join(" ")
    : jugador.nombre;

  slot.innerHTML = `<span class="nombre-slot">${corto}</span><span class="pos-slot">${pos}</span>`;
  slot.classList.add("ocupada");
  totalColocados++;
  cerrarModal();
  actualizarProgreso();

  // ¿Se completaron los 11?
  if (slotsLibresTotales().length === 0) {
    setTimeout(mostrarVictoria, 400);
    return;
  }

  // Cambiar de equipo después de un momento
  setTimeout(siguienteEquipo, 700);
}

// ── Modal posición ────────────────────────────────────────
function abrirModal(jugador, posDisponibles) {
  jugadorPendiente = jugador;
  modalTitulo.textContent = `¿Dónde colocas a ${jugador.nombre}?`;
  modalBotones.innerHTML = "";
  posDisponibles.forEach(pos => {
    const btn = document.createElement("button");
    btn.className = "modal-pos-btn";
    btn.textContent = pos;
    btn.addEventListener("click", () => {
      const slots = slotsLibresPara(pos);
      if (!slots.length) return;
      colocarEnSlot(jugador, slots[0], pos);
    });
    modalBotones.appendChild(btn);
  });
  modalOverlay.classList.remove("hidden");
}

function cerrarModal() {
  modalOverlay.classList.add("hidden");
  jugadorPendiente = null;
  buscador.focus();
}

modalCancelar.addEventListener("click", cerrarModal);
modalOverlay.addEventListener("click", e => { if (e.target === modalOverlay) cerrarModal(); });

// ── UI ────────────────────────────────────────────────────
function actualizarFallos() {
  fallosEl.innerHTML = "";
  for (let i = 0; i < MAX_FALLOS; i++) {
    const dot = document.createElement("span");
    dot.className = "fallo-dot" + (i < fallos ? " usado" : "");
    dot.textContent = i < fallos ? "✕" : "♥";
    fallosEl.appendChild(dot);
  }
}

function actualizarProgreso() {
  progresoEl.textContent = `${totalColocados} / 11 jugadores colocados`;
}

function setMensaje(texto, tipo) {
  mensajeEl.textContent = texto;
  mensajeEl.className = "mensaje " + tipo;
}

// ── Fin ───────────────────────────────────────────────────
function mostrarVictoria() {
  juegoTerminado = true;
  buscador.disabled = true;
  mostrarBanner("¡11 completado! 🏆", `Armaste el equipo con ${fallos} fallo${fallos!==1?"s":""}. ¡Crack total!`, "win");
}

function mostrarDerrota() {
  juegoTerminado = true;
  buscador.disabled = true;
  mostrarBanner(
    "¡Se acabaron los intentos! 💀",
    `Llegaste a ${totalColocados}/11 jugadores. El equipo era ${equipoActual.nombre}.`,
    "lose"
  );
}

function mostrarBanner(titulo, sub, tipo) {
  document.querySelectorAll(".banner-fin").forEach(b => b.remove());
  const b = document.createElement("div");
  b.className = `banner-fin ${tipo}`;
  b.innerHTML = `<h2>${titulo}</h2><p>${sub}</p><button onclick="this.closest('.banner-fin').remove(); iniciarJuego()">Jugar de nuevo</button>`;
  document.body.appendChild(b);
}

// ── Autocomplete ──────────────────────────────────────────
buscador.addEventListener("input", () => {
  const q = buscador.value.trim();
  if (!q) { closeSuggestions(); return; }
  const nq = norm(q);
  const matches = todosLosJugadores.filter(j => norm(j.nombre).includes(nq));
  renderSuggestions(matches, q);
});

buscador.addEventListener("keydown", e => {
  const items = sugBox.querySelectorAll(".sug-item");
  if (e.key === "ArrowDown")  { e.preventDefault(); moveSug(items,  1); return; }
  if (e.key === "ArrowUp")    { e.preventDefault(); moveSug(items, -1); return; }
  if (e.key === "Escape")     { closeSuggestions(); return; }
  if (e.key === "Enter") {
    e.preventDefault();
    if (sugIdx >= 0 && items[sugIdx]) intentar(items[sugIdx].dataset.nombre);
    else intentar();
  }
});

buscador.addEventListener("blur", () => setTimeout(closeSuggestions, 160));

function moveSug(items, dir) {
  if (!items.length) return;
  items.forEach(i => i.classList.remove("active"));
  sugIdx += dir;
  if (sugIdx < 0) sugIdx = items.length - 1;
  if (sugIdx >= items.length) sugIdx = 0;
  items[sugIdx].classList.add("active");
  buscador.value = items[sugIdx].dataset.nombre;
}

function renderSuggestions(jugadores, query) {
  if (!jugadores.length) { closeSuggestions(); return; }
  sugBox.innerHTML = jugadores.slice(0, 7).map(j =>
    `<div class="sug-item" data-nombre="${j.nombre}">
      <span>${highlightMatch(j.nombre, query)}</span>
      <span class="sug-pos">${j.posiciones.join(" · ")}</span>
    </div>`
  ).join("");
  sugBox.querySelectorAll(".sug-item").forEach(item => {
    item.addEventListener("mousedown", e => {
      e.preventDefault();
      intentar(item.dataset.nombre);
    });
  });
  sugBox.classList.add("open");
  sugIdx = -1;
}

function closeSuggestions() {
  sugBox.innerHTML = "";
  sugBox.classList.remove("open");
  sugIdx = -1;
}

document.getElementById("btnIntentar").addEventListener("click", () => intentar());

// ── Arrancar ──────────────────────────────────────────────
iniciarJuego();