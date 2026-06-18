const players = [
  {name:"Lionel Messi",      nat:"Argentina",     club:"Inter Miami",      pos:"Delantero",      age:36, height:170},
  {name:"Cristiano Ronaldo", nat:"Portugal",      club:"Al Nassr",         pos:"Delantero",      age:39, height:187},
  {name:"Kylian Mbappé",     nat:"Francia",       club:"Real Madrid",      pos:"Delantero",      age:25, height:178},
  {name:"Erling Haaland",    nat:"Noruega",       club:"Man. City",        pos:"Delantero",      age:23, height:194},
  {name:"Vinicius Jr.",      nat:"Brasil",        club:"Real Madrid",      pos:"Extremo",        age:23, height:176},
  {name:"Rodri",             nat:"España",        club:"Man. City",        pos:"Mediocampista",  age:27, height:191},
  {name:"Lamine Yamal",      nat:"España",        club:"Barcelona",        pos:"Extremo",        age:16, height:176},
  {name:"Pedri",             nat:"España",        club:"Barcelona",        pos:"Mediocampista",  age:21, height:174},
  {name:"Jude Bellingham",   nat:"Inglaterra",    club:"Real Madrid",      pos:"Mediocampista",  age:20, height:186},
  {name:"Phil Foden",        nat:"Inglaterra",    club:"Man. City",        pos:"Mediocampista",  age:23, height:171},
  {name:"Harry Kane",        nat:"Inglaterra",    club:"Bayern Munich",    pos:"Delantero",      age:30, height:188},
  {name:"Bukayo Saka",       nat:"Inglaterra",    club:"Arsenal",          pos:"Extremo",        age:22, height:178},
  {name:"Kevin De Bruyne",   nat:"Bélgica",       club:"Napoli",           pos:"Mediocampista",  age:32, height:181},
  {name:"Trent Alexander-Arnold", nat:"Inglaterra", club:"Real Madrid",    pos:"Defensa",        age:25, height:175},
  {name:"Virgil van Dijk",   nat:"Países Bajos",  club:"Liverpool",        pos:"Defensa",        age:32, height:193},
  {name:"Gavi",              nat:"España",        club:"Barcelona",        pos:"Mediocampista",  age:19, height:173},
  {name:"Ousmane Dembélé",   nat:"Francia",       club:"PSG",              pos:"Extremo",        age:26, height:178},
  {name:"Neymar Jr.",        nat:"Brasil",        club:"Al Hilal",         pos:"Extremo",        age:32, height:175},
  {name:"Manuel Neuer",      nat:"Alemania",      club:"Bayern Munich",    pos:"Portero",        age:37, height:193},
  {name:"Thibaut Courtois",  nat:"Bélgica",       club:"Real Madrid",      pos:"Portero",        age:31, height:199},
  {name:"Alisson Becker",    nat:"Brasil",        club:"Liverpool",        pos:"Portero",        age:31, height:193},
  {name:"Ruben Dias",        nat:"Portugal",      club:"Man. City",        pos:"Defensa",        age:26, height:187},
  {name:"Marquinhos",        nat:"Brasil",        club:"PSG",              pos:"Defensa",        age:29, height:183},
  {name:"Bruno Fernandes",   nat:"Portugal",      club:"Man. United",      pos:"Mediocampista",  age:29, height:179},
  {name:"Florian Wirtz",     nat:"Alemania",      club:"Liverpool",        pos:"Mediocampista",  age:21, height:176},
  {name:"Jamal Musiala",     nat:"Alemania",      club:"Bayern Munich",    pos:"Mediocampista",  age:21, height:180},
  {name:"Federico Valverde", nat:"Uruguay",       club:"Real Madrid",      pos:"Mediocampista",  age:25, height:182},
  {name:"Lautaro Martínez",  nat:"Argentina",     club:"Inter Milan",      pos:"Delantero",      age:26, height:174},
  {name:"Nicolo Barella",    nat:"Italia",        club:"Inter Milan",      pos:"Mediocampista",  age:27, height:172},
  {name:"Rafael Leao",       nat:"Portugal",      club:"AC Milan",         pos:"Extremo",        age:24, height:188},
  {name:"Khvicha Kvaratskhelia", nat:"Georgia",   club:"PSG",              pos:"Extremo",        age:23, height:183},
  {name:"Declan Rice",       nat:"Inglaterra",    club:"Arsenal",          pos:"Mediocampista",  age:25, height:185},
  {name:"Martin Odegaard",   nat:"Noruega",       club:"Arsenal",          pos:"Mediocampista",  age:25, height:178},
  {name:"Gabriel Martinelli", nat:"Brasil",       club:"Arsenal",          pos:"Extremo",        age:22, height:181},
  {name:"Achraf Hakimi",     nat:"Marruecos",     club:"PSG",              pos:"Defensa",        age:25, height:181},
  {name:"Theo Hernandez",    nat:"Francia",       club:"AC Milan",         pos:"Defensa",        age:26, height:184},
  {name:"Nico Williams",     nat:"España",        club:"Athletic Club",    pos:"Extremo",        age:21, height:180},
  {name:"Dani Olmo",         nat:"España",        club:"Barcelona",        pos:"Mediocampista",  age:26, height:179},
  {name:"Cody Gakpo",        nat:"Países Bajos",  club:"Liverpool",        pos:"Extremo",        age:24, height:189},
];

const MAX_TRIES = 8;
let target, guesses, gameOver, selectedIdx;

function norm(s) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function highlightMatch(name, query) {
  const nName = norm(name);
  const nQuery = norm(query);
  const idx = nName.indexOf(nQuery);
  if (idx === -1) return name;
  const before = name.slice(0, idx);
  const match  = name.slice(idx, idx + query.length);
  const after  = name.slice(idx + query.length);
  return `${before}<span class="suggestion-match">${match}</span>${after}`;
}

function initGame() {
  target = players[Math.floor(Math.random() * players.length)];
  guesses = [];
  gameOver = false;
  selectedIdx = -1;
  document.getElementById("guesses").innerHTML = "";
  document.getElementById("result-banner").innerHTML = "";
  document.getElementById("error-msg").textContent = "";
  document.getElementById("guess-input").value = "";
  document.getElementById("guess-input").disabled = false;
  document.getElementById("guess-btn").disabled = false;
  closeSuggestions();
  updateTries();
}

function updateTries() {
  const el = document.getElementById("tries-left");
  if (gameOver) { el.textContent = ""; return; }
  const left = MAX_TRIES - guesses.length;
  el.textContent = `Intentos restantes: ${left}`;
}

function closeSuggestions() {
  const box = document.getElementById("suggestions");
  box.innerHTML = "";
  box.classList.remove("open");
  selectedIdx = -1;
}

function showSuggestions(query) {
  const box = document.getElementById("suggestions");
  if (!query || query.length < 1) { closeSuggestions(); return; }
  const nq = norm(query);
  const used = new Set(guesses.map(g => norm(g.name)));
  const matches = players.filter(p => norm(p.name).includes(nq) && !used.has(norm(p.name)));
  if (!matches.length) { closeSuggestions(); return; }

  box.innerHTML = matches.slice(0, 6).map((p, i) =>
    `<div class="suggestion-item" data-idx="${i}" data-name="${p.name}">
      ${highlightMatch(p.name, query)}
      <span class="suggestion-flag">${p.nat} · ${p.pos}</span>
    </div>`
  ).join("");

  box.querySelectorAll(".suggestion-item").forEach(item => {
    item.addEventListener("mousedown", e => {
      e.preventDefault();
      document.getElementById("guess-input").value = item.dataset.name;
      closeSuggestions();
      submitGuess();
    });
  });

  box.classList.add("open");
  selectedIdx = -1;
}

function navigateSuggestions(dir) {
  const items = document.querySelectorAll(".suggestion-item");
  if (!items.length) return;
  items.forEach(i => i.classList.remove("active"));
  selectedIdx += dir;
  if (selectedIdx < 0) selectedIdx = items.length - 1;
  if (selectedIdx >= items.length) selectedIdx = 0;
  items[selectedIdx].classList.add("active");
  document.getElementById("guess-input").value = items[selectedIdx].dataset.name;
}

function submitGuess() {
  if (gameOver) return;
  const val = document.getElementById("guess-input").value;
  const nv = norm(val);
  const err = document.getElementById("error-msg");

  if (!nv) { err.textContent = "Escribe un nombre."; return; }
  const match = players.find(p => norm(p.name) === nv);
  if (!match) { err.textContent = "Jugador no encontrado. Selecciona una sugerencia o escribe el nombre exacto."; return; }
  if (guesses.find(g => norm(g.name) === nv)) { err.textContent = "Ya intentaste con ese jugador."; return; }

  err.textContent = "";
  guesses.push(match);
  renderGuess(match);
  document.getElementById("guess-input").value = "";
  closeSuggestions();

  if (match.name === target.name) {
    gameOver = true;
    document.getElementById("guess-input").disabled = true;
    document.getElementById("guess-btn").disabled = true;
    updateTries();
    showResult(true);
    return;
  }
  if (guesses.length >= MAX_TRIES) {
    gameOver = true;
    document.getElementById("guess-input").disabled = true;
    document.getElementById("guess-btn").disabled = true;
    updateTries();
    showResult(false);
    return;
  }
  updateTries();
}

function renderGuess(p) {
  const t = target;
  const ageDiff = p.age - t.age;
  const hDiff   = p.height - t.height;

  const ageHint  = ageDiff === 0 ? "correct" : Math.abs(ageDiff) <= 3 ? "close" : "wrong";
  const hHint    = hDiff   === 0 ? "correct" : Math.abs(hDiff)   <= 4 ? "close" : "wrong";
  const ageArrow = ageDiff === 0 ? "" : ageDiff > 0 ? "↓" : "↑";
  const hArrow   = hDiff   === 0 ? "" : hDiff   > 0 ? "↓" : "↑";

  function cell(val, hint, arrow = "") {
    return `<div class="cell ${hint}">${val}${arrow ? `<span class="arrow">${arrow}</span>` : ""}</div>`;
  }

  const row = `<div class="guess-row">
    ${cell(p.name,           p.name   === t.name   ? "correct" : "wrong")}
    ${cell(p.nat,            p.nat    === t.nat    ? "correct" : "wrong")}
    ${cell(p.club,           p.club   === t.club   ? "correct" : "wrong")}
    ${cell(p.pos,            p.pos    === t.pos    ? "correct" : "wrong")}
    ${cell(p.age,            ageHint, ageArrow)}
    ${cell(p.height + " cm", hHint,   hArrow)}
  </div>`;

  document.getElementById("guesses").innerHTML += row;
}

function showResult(won) {
  const banner = document.getElementById("result-banner");
  if (won) {
    banner.innerHTML = `
      <div class="banner win">
        <p>¡Lo adivinaste! Era ${target.name}</p>
        <span>En ${guesses.length} intento${guesses.length > 1 ? "s" : ""}</span>
        <br><button class="new-btn" onclick="initGame()">Nuevo juego</button>
      </div>`;
  } else {
    banner.innerHTML = `
      <div class="banner lose">
        <p>Era: ${target.name}</p>
        <span>${target.club} · ${target.nat} · ${target.pos} · ${target.age} años · ${target.height} cm</span>
        <br><button class="new-btn" onclick="initGame()">Intentar de nuevo</button>
      </div>`;
  }
}

/* Events */
const input = document.getElementById("guess-input");
const btn   = document.getElementById("guess-btn");

input.addEventListener("input", () => showSuggestions(input.value));

input.addEventListener("keydown", e => {
  const box = document.getElementById("suggestions");
  if (box.classList.contains("open")) {
    if (e.key === "ArrowDown")  { e.preventDefault(); navigateSuggestions(1); return; }
    if (e.key === "ArrowUp")    { e.preventDefault(); navigateSuggestions(-1); return; }
    if (e.key === "Escape")     { closeSuggestions(); return; }
    if (e.key === "Enter")      { e.preventDefault(); submitGuess(); return; }
  } else {
    if (e.key === "Enter") submitGuess();
  }
});

input.addEventListener("blur", () => setTimeout(closeSuggestions, 150));

btn.addEventListener("click", submitGuess);

initGame();