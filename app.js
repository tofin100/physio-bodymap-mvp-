/** --------------------------
 * Kintaro BodyMap (Front) — SVG Layer Prototype
 * -------------------------- */

const LS_KEY = "kintaro_bodymap_front_marks_v1";

const DICT = {
  // muscles
  brachialis: { type:"muscle", label:"Brachialis", synonyms:["brachialis","muskel brachialis","musculus brachialis","brachiaris","brachiális"] },
  biceps:     { type:"muscle", label:"Bizeps (Biceps brachii)", synonyms:["bizeps","biceps","biceps brachii","bizepsmuskel"] },
  trapezius:  { type:"muscle", label:"Trapezius", synonyms:["trapez","trapezius","nackenmuskel"] },
  quad:       { type:"muscle", label:"Quadrizeps", synonyms:["quadrizeps","quadriceps","vorderer oberschenkel","quad"] },

  // bones
  humerus:    { type:"bone", label:"Humerus", synonyms:["humerus","oberarmknochen"] },
  femur:      { type:"bone", label:"Femur", synonyms:["femur","oberschenkelknochen"] },
  spine:      { type:"bone", label:"Wirbelsäule", synonyms:["wirbelsaeule","wirbelsäule","spine","wirbel"] },

  // nerves
  radial:     { type:"nerve", label:"N. radialis", synonyms:["radialis","n radialis","nerv radialis","radial nerve"] },
  sciatic:    { type:"nerve", label:"N. ischiadicus", synonyms:["ischias","ischiadicus","sciatic","sciatic nerve"] },
};

const SIDE_WORDS = {
  right: ["rechts","right","r"],
  left: ["links","left","l"]
};

const state = {
  layers: { sil:true, bones:true, muscles:true, nerves:false, markers:true },
  isolate: "mix",
  intensity: 6,
  session: 1,
  selection: null,     // { id, layer, structure, side }
  marks: []            // persisted
};

const $ = (s) => document.querySelector(s);

const svgHost = $("#svgHost");
const statusBox = $("#statusBox");
const listMarks = $("#listMarks");
const lblSession = $("#lblSession");
const lblIntensity = $("#lblIntensity");

/** ---------- utils ---------- **/
function normalize(s){
  return (s||"")
    .toLowerCase()
    .replace(/[ä]/g,"ae").replace(/[ö]/g,"oe").replace(/[ü]/g,"ue").replace(/ß/g,"ss")
    .replace(/[^a-z0-9\\s\\/]/g," ")
    .replace(/\\s+/g," ")
    .trim();
}
function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

function detectSide(text){
  const t = normalize(text).split(" ");
  for (const [side, words] of Object.entries(SIDE_WORDS)){
    if (words.some(w => t.includes(w))) return side;
  }
  return null;
}
function detectIntensity(text){
  const t = normalize(text);
  let m = t.match(/(\\d)\\s*\\/\\s*10/);
  if (m) return clamp(parseInt(m[1],10),1,10);
  m = t.match(/(\\d)\\s*(von)\\s*10/);
  if (m) return clamp(parseInt(m[1],10),1,10);
  m = t.match(/\\b(10|[1-9])\\b/);
  if (m) return clamp(parseInt(m[1],10),1,10);
  return null;
}
function findStructureKey(text){
  const t = normalize(text);
  let best = null, bestScore = 0;
  for (const [key, obj] of Object.entries(DICT)){
    for (const syn of obj.synonyms){
      const s = normalize(syn);
      if (t.includes(s)){
        const score = s.length;
        if (score > bestScore){ bestScore = score; best = key; }
      }
    }
  }
  return best;
}
function rgbaForIntensity(intensity){
  const a = 0.18 + (intensity-1) * (0.62/9); // 0.18..0.80
  return `rgba(230,193,90,${a.toFixed(3)})`;
}
function prettyLabel(structure, side){
  let base = structure;
  if (DICT[structure]) base = DICT[structure].label;
  if (side === "right") return `${base} (rechts)`;
  if (side === "left") return `${base} (links)`;
  return base;
}
function setStatus(html){
  statusBox.innerHTML = html;
}

/** ---------- SVG (Front) ---------- **/
function svgFront(){
  // Stylized, clean medical silhouette + demo regions.
  // Later: replace with full anatomical SVG asset; keep IDs & layer groups.
  return `
<svg viewBox="0 0 600 800" aria-label="Bodymap Front">
  <defs>
    <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feColorMatrix type="matrix" values="
        1 0 0 0 0
        0 1 0 0 0
        0 0 1 0 0
        0 0 0 0.35 0" result="glow"/>
      <feMerge>
        <feMergeNode in="glow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <g id="layer-silhouette" class="layer silhouette-layer">
    <path class="silhouette" d="M300,70
      C260,70 240,95 240,125
      C240,150 255,170 275,180
      C250,210 235,250 235,300
      C235,345 250,380 265,405
      C240,430 225,470 225,520
      C225,600 255,655 280,695
      C295,720 305,740 300,770
      C295,740 305,720 320,695
      C345,655 375,600 375,520
      C375,470 360,430 335,405
      C350,380 365,345 365,300
      C365,250 350,210 325,180
      C345,170 360,150 360,125
      C360,95 340,70 300,70 Z"/>
    <path class="outline" d="M235,300 C175,305 155,340 150,380 C145,420 160,465 190,490" />
    <path class="outline" d="M365,300 C425,305 445,340 450,380 C455,420 440,465 410,490" />
  </g>

  <g id="layer-bones" class="layer bones">
    <path id="bone_spine" class="region" data-layer="bone" data-structure="spine"
      d="M296 185 C298 210 298 240 296 270 C294 300 294 330 296 360 C298 390 298 420 296 450 C294 480 294 510 296 540 C298 570 298 600 296 630" />
    <path id="bone_humerus_r" class="region" data-layer="bone" data-structure="humerus" data-side="right"
      d="M380 265 C412 285 418 325 405 360 C395 385 365 395 345 378 C325 362 324 320 340 292 C352 270 365 257 380 265 Z"/>
    <path id="bone_humerus_l" class="region" data-layer="bone" data-structure="humerus" data-side="left"
      d="M220 265 C188 285 182 325 195 360 C205 385 235 395 255 378 C275 362 276 320 260 292 C248 270 235 257 220 265 Z"/>
    <path id="bone_femur_r" class="region" data-layer="bone" data-structure="femur" data-side="right"
      d="M330 480 C360 505 362 550 345 590 C332 618 310 630 292 620 C270 608 268 565 285 530 C297 505 312 472 330 480 Z"/>
    <path id="bone_femur_l" class="region" data-layer="bone" data-structure="femur" data-side="left"
      d="M270 480 C240 505 238 550 255 590 C268 618 290 630 308 620 C330 608 332 565 315 530 C303 505 288 472 270 480 Z"/>
  </g>

  <g id="layer-muscles" class="layer muscles">
    <path id="muscle_trapezius" class="region" data-layer="muscle" data-structure="trapezius"
      d="M240 190 C260 165 340 165 360 190 C340 210 260 210 240 190 Z"/>
    <path id="muscle_biceps_r" class="region" data-layer="muscle" data-structure="biceps" data-side="right"
      d="M392 300 C415 305 425 330 418 355 C410 382 380 390 362 372 C348 358 350 330 362 312 C372 298 382 296 392 300 Z"/>
    <path id="muscle_biceps_l" class="region" data-layer="muscle" data-structure="biceps" data-side="left"
      d="M208 300 C185 305 175 330 182 355 C190 382 220 390 238 372 C252 358 250 330 238 312 C228 298 218 296 208 300 Z"/>
    <path id="muscle_brachialis_r" class="region" data-layer="muscle" data-structure="brachialis" data-side="right"
      d="M355 338 C372 332 392 345 392 368 C392 392 370 402 352 392 C338 384 338 346 355 338 Z"/>
    <path id="muscle_brachialis_l" class="region" data-layer="muscle" data-structure="brachialis" data-side="left"
      d="M245 338 C228 332 208 345 208 368 C208 392 230 402 248 392 C262 384 262 346 245 338 Z"/>
    <path id="muscle_quad_r" class="region" data-layer="muscle" data-structure="quad" data-side="right"
      d="M320 525 C350 520 372 552 365 586 C358 620 330 640 305 625 C282 612 282 535 320 525 Z"/>
    <path id="muscle_quad_l" class="region" data-layer="muscle" data-structure="quad" data-side="left"
      d="M280 525 C250 520 228 552 235 586 C242 620 270 640 295 625 C318 612 318 535 280 525 Z"/>
  </g>

  <g id="layer-nerves" class="layer nerves">
    <path id="nerve_radial_r" class="region" data-layer="nerve" data-structure="radial" data-side="right"
      d="M360 250 C390 280 405 315 395 350 C388 374 370 392 350 408" />
    <path id="nerve_radial_l" class="region" data-layer="nerve" data-structure="radial" data-side="left"
      d="M240 250 C210 280 195 315 205 350 C212 374 230 392 250 408" />
    <path id="nerve_sciatic_r" class="region" data-layer="nerve" data-structure="sciatic" data-side="right"
      d="M305 455 C330 500 340 545 332 590 C327 618 315 650 300 705" />
    <path id="nerve_sciatic_l" class="region" data-layer="nerve" data-structure="sciatic" data-side="left"
      d="M295 455 C270 500 260 545 268 590 C273 618 285 650 300 705" />
  </g>

  <g id="layer-markers" class="layer markers">
    <g id="pins"></g>
  </g>
</svg>`;
}

/** ---------- persistence ---------- **/
function saveMarks(){
  localStorage.setItem(LS_KEY, JSON.stringify(state.marks));
}
function loadMarks(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) state.marks = arr;
  }catch(e){}
}

/** ---------- rendering ---------- **/
function mount(){
  svgHost.innerHTML = svgFront();
  const svg = svgHost.querySelector("svg");

  svg.addEventListener("click", (e)=>{
    const t = e.target;
    if (!t.classList.contains("region")) return;
    selectRegion(t.id);
  });

  applyLayerVisibility();
  applyIsolate();
  updateLabels();
  renderMarks();
  reapplyFromMarks();

  setStatus(`Klick auf eine Struktur oder nutze Voice/Suche.`);
}

function setLayer(svg, name, on){
  const el = svg.querySelector(`#layer-${name}`);
  if (!el) return;
  el.classList.toggle("hidden", !on);
}
function applyLayerVisibility(){
  const svg = svgHost.querySelector("svg");
  if (!svg) return;
  setLayer(svg, "silhouette", state.layers.sil);
  setLayer(svg, "bones", state.layers.bones);
  setLayer(svg, "muscles", state.layers.muscles);
  setLayer(svg, "nerves", state.layers.nerves);
  setLayer(svg, "markers", state.layers.markers);
}
function applyIsolate(){
  const svg = svgHost.querySelector("svg");
  if (!svg) return;
  const wants = state.isolate;
  const layerIds = ["silhouette","bones","muscles","nerves","markers"];
  if (wants === "mix"){
    layerIds.forEach(k => svg.querySelector(`#layer-${k}`)?.classList.remove("dim"));
    return;
  }
  layerIds.forEach(k => {
    const el = svg.querySelector(`#layer-${k}`);
    if (!el) return;
    el.classList.toggle("dim", k !== wants);
  });
}
function clearActive(){
  const svg = svgHost.querySelector("svg");
  svg.querySelectorAll(".region.is-active,.region.is-related").forEach(el=>{
    el.classList.remove("is-active","is-related");
    el.style.fill = "";
  });
  state.selection = null;
  $("#txtNote").value = "";
}
function selectRegion(id){
  const svg = svgHost.querySelector("svg");
  const el = svg.getElementById(id);
  if (!el) return;

  clearActive();
  el.classList.add("is-active");

  const layer = el.dataset.layer;
  const structure = el.dataset.structure;
  const side = el.dataset.side || null;

  state.selection = { id, layer, structure, side };

  // active fill based on intensity
  svg.style.setProperty("--activeFill", rgbaForIntensity(state.intensity));

  // load existing note for this session if present
  const note = getMarkForCurrent(id)?.note || "";
  $("#txtNote").value = note;

  setStatus(`<b>Auswahl:</b> ${prettyLabel(structure, side)} <span class="mono">(${layer})</span>`);
}
function getMarkForCurrent(regionId){
  return state.marks.find(m => m.session===state.session && m.regionId===regionId) || null;
}
function updateLabels(){
  lblSession.textContent = `Session ${state.session}`;
  lblIntensity.textContent = `${state.intensity} / 10`;
}
function renderMarks(){
  const rows = state.marks
    .filter(m => m.session===state.session)
    .sort((a,b)=> (b.updatedAt||0)-(a.updatedAt||0));

  if (rows.length === 0){
    listMarks.innerHTML = `<div class="mini">Keine Markierungen in Session ${state.session}.</div>`;
    return;
  }

  listMarks.innerHTML = rows.map(m => {
    const note = m.note ? escapeHtml(m.note) : `<span class="mini">—</span>`;
    return `
      <div class="item">
        <div class="itemTop">
          <div class="itemName">${escapeHtml(m.label)}</div>
          <button class="btn small ghost" data-jump="${m.regionId}">Jump</button>
        </div>
        <div class="itemMeta">${m.layer.toUpperCase()} • Intensität ${m.intensity}/10</div>
        <div class="itemNote">${note}</div>
      </div>`;
  }).join("");

  listMarks.querySelectorAll("button[data-jump]").forEach(btn=>{
    btn.addEventListener("click", ()=> selectRegion(btn.dataset.jump));
  });
}
function reapplyFromMarks(){
  const svg = svgHost.querySelector("svg");
  const pins = svg.querySelector("#pins");
  if (pins) pins.innerHTML = "";

  const rows = state.marks.filter(m => m.session===state.session);
  for (const m of rows){
    const el = svg.getElementById(m.regionId);
    if (!el) continue;

    el.classList.add("is-related");

    if (m.layer === "muscle"){
      el.style.fill = rgbaForIntensity(m.intensity);
    }

    if (m.pin && pins){
      pins.insertAdjacentHTML("beforeend", `
        <g>
          <circle class="pin-ring" cx="${m.pin.x}" cy="${m.pin.y}" r="18"></circle>
          <circle class="pin" cx="${m.pin.x}" cy="${m.pin.y}" r="7"></circle>
        </g>
      `);
    }
  }
}
function escapeHtml(s){
  return (s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

/** ---------- actions ---------- **/
function onSaveNote(){
  if (!state.selection){
    setStatus("Keine Auswahl. Bitte zuerst eine Struktur anklicken.");
    return;
  }
  const note = $("#txtNote").value.trim();
  const svg = svgHost.querySelector("svg");
  const el = svg.getElementById(state.selection.id);

  const label = prettyLabel(state.selection.structure, state.selection.side);

  // pin: if user clicked muscle, we auto-drop a pin roughly at bbox center (nice UX)
  const bbox = el.getBBox();
  const pin = { x: Math.round(bbox.x + bbox.width/2), y: Math.round(bbox.y + bbox.height/2) };

  // upsert
  const existing = getMarkForCurrent(state.selection.id);
  if (existing){
    existing.note = note;
    existing.intensity = state.intensity;
    existing.updatedAt = Date.now();
    existing.pin = pin;
  } else {
    state.marks.push({
      session: state.session,
      regionId: state.selection.id,
      layer: state.selection.layer,
      structure: state.selection.structure,
      side: state.selection.side,
      label,
      intensity: state.intensity,
      note,
      pin,
      updatedAt: Date.now()
    });
  }
  saveMarks();
  renderMarks();
  reapplyFromMarks();
  setStatus(`<b>Gespeichert:</b> ${label} (Session ${state.session})`);
}

function onDeleteSelection(){
  if (!state.selection) return;
  const id = state.selection.id;
  state.marks = state.marks.filter(m => !(m.session===state.session && m.regionId===id));
  saveMarks();
  clearActive();
  renderMarks();
  reapplyFromMarks();
  setStatus(`Markierung gelöscht.`);
}

/** ---------- search ---------- **/
function onFind(){
  const q = normalize($("#txtSearch").value);
  if (!q){
    setStatus("Bitte Suchbegriff eingeben.");
    return;
  }
  const svg = svgHost.querySelector("svg");
  const els = [...svg.querySelectorAll(".region")];

  const hit = els.find(el =>
    (el.id && normalize(el.id).includes(q)) ||
    (el.dataset.structure && normalize(el.dataset.structure).includes(q)) ||
    (DICT[el.dataset.structure] && normalize(DICT[el.dataset.structure].label).includes(q))
  );

  if (!hit){
    setStatus(`Keine Struktur gefunden für: <span class="mono">${q}</span>`);
    return;
  }
  selectRegion(hit.id);
}
function onClear(){
  clearActive();
  setStatus("Auswahl zurückgesetzt.");
}

/** ---------- voice simulation ---------- **/
function runVoice(command){
  const raw = command || "";
  const key = findStructureKey(raw);
  const side = detectSide(raw);
  const intensity = detectIntensity(raw);

  if (!key){
    setStatus(`Voice: Keine Struktur erkannt. (Try: "Brachialis rechts Schmerz 6/10")`);
    return;
  }

  // Update intensity if given
  if (intensity) state.intensity = intensity;
  updateLabels();

  // Auto-enable layer (smart feel)
  const type = DICT[key].type;
  if (type === "muscle") state.layers.muscles = true;
  if (type === "bone") state.layers.bones = true;
  if (type === "nerve") state.layers.nerves = true;
  applyLayerVisibility();

  // Determine region id
  let regionId = null;
  const all = [...svgHost.querySelectorAll(".region")];
  if (side){
    regionId = all.find(el => el.dataset.structure===key && el.dataset.side===side)?.id || null;
  } else {
    regionId = all.find(el => el.dataset.structure===key)?.id || null;
  }
  if (!regionId){
    // fallback: try structure directly
    regionId = all.find(el => el.dataset.structure===key)?.id || null;
  }
  if (!regionId){
    setStatus(`Voice: Struktur erkannt (${key}), aber keine Region im SVG gefunden.`);
    return;
  }

  selectRegion(regionId);

  // Optional: auto-write note if text contains "schmerz"
  const n = normalize(raw);
  if (n.includes("schmerz")){
    const noteBox = $("#txtNote");
    if (!noteBox.value.trim()) noteBox.value = raw.trim();
  }

  setStatus(`<b>Voice:</b> ${DICT[key].label}${side ? ` (${side==="right"?"rechts":"links"})` : ""} • Intensität ${state.intensity}/10`);
}

/** ---------- init wiring ---------- **/
function wire(){
  // toggles
  $("#togSil").addEventListener("change", e=>{ state.layers.sil = e.target.checked; applyLayerVisibility(); });
  $("#togBones").addEventListener("change", e=>{ state.layers.bones = e.target.checked; applyLayerVisibility(); });
  $("#togMuscles").addEventListener("change", e=>{ state.layers.muscles = e.target.checked; applyLayerVisibility(); });
  $("#togNerves").addEventListener("change", e=>{ state.layers.nerves = e.target.checked; applyLayerVisibility(); });
  $("#togMarkers").addEventListener("change", e=>{ state.layers.markers = e.target.checked; applyLayerVisibility(); });

  $("#selIsolate").addEventListener("change", e=>{ state.isolate = e.target.value; applyIsolate(); });

  $("#rngIntensity").addEventListener("input", e=>{
    state.intensity = clamp(parseInt(e.target.value,10),1,10);
    updateLabels();
    // update active fill var
    svgHost.querySelector("svg")?.style.setProperty("--activeFill", rgbaForIntensity(state.intensity));
  });

  $("#rngSession").addEventListener("input", e=>{
    state.session = clamp(parseInt(e.target.value,10),1,6);
    updateLabels();
    clearActive();
    renderMarks();
    reapplyFromMarks();
  });

  $("#btnSaveNote").addEventListener("click", onSaveNote);
  $("#btnDeleteSel").addEventListener("click", onDeleteSelection);

  $("#btnFind").addEventListener("click", onFind);
  $("#btnClear").addEventListener("click", onClear);

  $("#btnRunVoice").addEventListener("click", ()=> runVoice($("#txtVoice").value));
  $("#btnExample").addEventListener("click", ()=>{
    $("#txtVoice").value = "Brachialis rechts Schmerz 6/10 distal seit 3 Wochen";
    runVoice($("#txtVoice").value);
  });

  $("#btnReset").addEventListener("click", ()=>{
    clearActive();
    state.isolate = "mix";
    $("#selIsolate").value = "mix";
    state.layers = { sil:true, bones:true, muscles:true, nerves:false, markers:true };
    $("#togSil").checked = true;
    $("#togBones").checked = true;
    $("#togMuscles").checked = true;
    $("#togNerves").checked = false;
    $("#togMarkers").checked = true;
    state.intensity = 6;
    $("#rngIntensity").value = 6;
    updateLabels();
    applyLayerVisibility();
    applyIsolate();
    reapplyFromMarks();
    setStatus("Reset.");
  });

  // keybinds
  window.addEventListener("keydown", (e)=>{
    if (e.key === "Escape") onClear();
    if (e.key === "Enter"){
      const active = document.activeElement;
      if (active && (active.id === "txtVoice")) runVoice($("#txtVoice").value);
    }
  });
}

/** ---------- boot ---------- **/
loadMarks();
wire();
mount();