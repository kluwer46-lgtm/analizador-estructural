const fields = document.getElementById("fields");
const title = document.getElementById("page-title");
const subtitle = document.getElementById("page-subtitle");
const model = document.getElementById("model-visual");
const results = document.getElementById("results");
const errorBox = document.getElementById("error");
let current = "beam";

const configs = {
  beam: {
    title: "Análisis de vigas",
    subtitle: "Viga simplemente apoyada con carga puntual y carga distribuida en toda la luz.",
    fields: [
      ["L","Longitud de la viga (m)",6,"Longitud total."],
      ["P","Carga puntual P (kN)",10,"Carga vertical hacia abajo."],
      ["a","Distancia de la carga desde el apoyo A (m)",3,"Debe estar entre 0 y L."],
      ["w","Carga distribuida w (kN/m)",0,"Actúa en toda la longitud."]
    ],
    sketch: beamSketch
  },
  column: {
    title: "Análisis de columnas",
    subtitle: "Columna en voladizo con carga axial y carga horizontal aplicada en la cabeza.",
    fields: [
      ["L","Altura de la columna (m)",3,"Altura desde el empotramiento."],
      ["P","Carga axial P (kN)",100,"Carga de compresión positiva."],
      ["H","Carga horizontal H (kN)",5,"Positiva hacia la derecha."]
    ],
    sketch: columnSketch
  },
  portal: {
    title: "Análisis de pórticos",
    subtitle: "Pórtico de un nivel y un vano con carga horizontal total.",
    fields: [
      ["H","Altura del pórtico (m)",3.5,"Altura de las columnas."],
      ["B","Luz del pórtico (m)",5,"Distancia entre columnas."],
      ["Q","Carga horizontal total Q (kN)",10,"Carga lateral de referencia."]
    ],
    sketch: portalSketch
  }
};

function fieldHTML(f) {
  return `<div class="field"><label for="${f[0]}">${f[1]}</label><input id="${f[0]}" name="${f[0]}" type="number" step="any" value="${f[2]}" required><small>${f[3]}</small></div>`;
}
function renderModule(kind) {
  current = kind;
  const c = configs[kind];
  title.textContent = c.title;
  subtitle.textContent = c.subtitle;
  fields.innerHTML = c.fields.map(fieldHTML).join("");
  model.innerHTML = c.sketch();
  document.querySelectorAll(".nav").forEach(b => b.classList.toggle("active", b.dataset.kind === kind));
  results.classList.add("hidden");
  errorBox.classList.add("hidden");
}
function beamSketch(){return `<svg viewBox="0 0 600 270" role="img" aria-label="Viga simplemente apoyada"><line x1="80" y1="130" x2="520" y2="130" stroke="#1769d2" stroke-width="8" stroke-linecap="round"/><path d="M80 138 L62 164 L98 164 Z M520 138 L502 164 L538 164 Z" fill="#a9b5c4"/><path d="M80 164 H520" stroke="#a9b5c4" stroke-width="2"/><path d="M300 45 V112 M292 101 L300 113 L308 101" stroke="#f28a35" stroke-width="3" fill="none"/><text x="315" y="62" fill="#d97727" font-size="14">P</text><path d="M80 88 V108 M190 88 V108 M300 88 V108 M410 88 V108 M520 88 V108" stroke="#f28a35" stroke-width="2"/><path d="M80 88 H520 M80 88 l10 -6 M80 88 l10 6 M520 88 l-10 -6 M520 88 l-10 6" stroke="#f28a35" stroke-width="2" fill="none"/><text x="285" y="76" fill="#d97727" font-size="13">w</text><text x="70" y="190" fill="#64748b" font-size="12">A</text><text x="515" y="190" fill="#64748b" font-size="12">B</text><text x="290" y="215" fill="#64748b" font-size="13">L</text></svg>`}
function columnSketch(){return `<svg viewBox="0 0 600 270" role="img" aria-label="Columna en voladizo"><rect x="245" y="205" width="110" height="10" rx="2" fill="#a9b5c4"/><path d="M270 205 V65 H330 V205" fill="#dcecff" stroke="#1769d2" stroke-width="4"/><path d="M300 25 V55 M292 45 L300 57 L308 45" stroke="#f28a35" stroke-width="3" fill="none"/><text x="315" y="34" fill="#d97727" font-size="14">P</text><path d="M330 85 H405 M393 77 L405 85 L393 93" stroke="#f28a35" stroke-width="3" fill="none"/><text x="412" y="90" fill="#d97727" font-size="14">H</text><text x="365" y="145" fill="#64748b" font-size="13">L</text><text x="300" y="239" text-anchor="middle" fill="#64748b" font-size="12">Empotramiento</text></svg>`}
function portalSketch(){return `<svg viewBox="0 0 600 270" role="img" aria-label="Pórtico de un nivel"><path d="M170 210 V65 H430 V210" fill="none" stroke="#1769d2" stroke-width="8" stroke-linejoin="round"/><path d="M135 210 H205 M395 210 H465" stroke="#a9b5c4" stroke-width="7"/><path d="M430 95 H505 M493 87 L505 95 L493 103" stroke="#f28a35" stroke-width="3" fill="none"/><text x="510" y="99" fill="#d97727" font-size="14">Q</text><text x="300" y="48" text-anchor="middle" fill="#64748b" font-size="13">B</text><text x="145" y="135" fill="#64748b" font-size="13">H</text><text x="300" y="239" text-anchor="middle" fill="#64748b" font-size="12">Bases empotradas · idealización simétrica</text></svg>`}
document.querySelectorAll(".nav").forEach(b => b.addEventListener("click", () => renderModule(b.dataset.kind)));

document.getElementById("analysis-form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  errorBox.classList.add("hidden");
  const payload = {kind: current};
  configs[current].fields.forEach(f => payload[f[0]] = Number(document.getElementById(f[0]).value));
  const button = ev.target.querySelector("button");
  button.disabled = true; button.textContent = "Calculando...";
  try {
    const response = await fetch("/api/analyze", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "No se pudo realizar el análisis.");
    showResults(data.result);
  } catch (err) {
    errorBox.textContent = err.message;
    errorBox.classList.remove("hidden");
  } finally {
    button.disabled = false; button.innerHTML = 'Calcular esfuerzos <span>→</span>';
  }
});

function showResults(r) {
  results.classList.remove("hidden");
  document.getElementById("result-kind").textContent = r.kind;
  document.getElementById("reactions").innerHTML = r.reactions.map(x =>
    `<div class="reaction"><span>${x.label}</span><strong>${x.value.toFixed(3)}</strong><small>${r.units.force} o ${r.units.moment}</small></div>`
  ).join("");
  document.getElementById("charts").innerHTML = r.charts.map((c,i) =>
    `<div class="chart-card"><h3>${c.name}</h3><div id="chart-${i}" class="chart"></div></div>`
  ).join("");
  r.charts.forEach((c,i) => {
    Plotly.newPlot(`chart-${i}`, [{x:c.x,y:c.y,type:"scatter",mode:"lines",line:{color:"#1769d2",width:3},fill:"tozeroy",fillcolor:"rgba(23,105,210,.10)"}],
      {margin:{l:55,r:20,t:15,b:45},paper_bgcolor:"#fff",plot_bgcolor:"#fff",xaxis:{title:"Posición (m)",gridcolor:"#edf1f6"},yaxis:{title:c.unit,gridcolor:"#edf1f6"},font:{family:"Arial",color:"#53657c"},showlegend:false},
      {responsive:true,displayModeBar:false});
  });
  document.getElementById("notes").innerHTML = `<b>Hipótesis y alcance del modelo</b><ul>${r.notes.map(n=>`<li>${n}</li>`).join("")}</ul>`;
  results.scrollIntoView({behavior:"smooth",block:"start"});
}
renderModule("beam");
