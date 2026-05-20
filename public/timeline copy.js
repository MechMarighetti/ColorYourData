// timeline.js - Rediseño aesthetic-cute

const dataFields = [
  { key: 'color', label: '🌈 Color elegido', desc: 'El color que seleccionaste en la encuesta.' },
  { key: 'country', label: '🌍 País', desc: 'Inferido desde IP para saber desde dónde nos visitas.' },
  { key: 'region', label: '📍 Región', desc: 'Provincia o región aproximada basada en la IP.' },
  { key: 'tiempo_seleccion', label: '⏱️ Tiempo de selección', desc: 'Cuánto tardaste en elegir tu color.' },
  { key: 'clics_erroneos', label: '🖱️ Clics erróneos', desc: 'Clics que no terminaron en una selección válida.' },
  { key: 'movimientos_mouse', label: '🐭 Movimientos del mouse', desc: 'Un patrón simplificado de tu movimiento (anonimizado).' },
  { key: 'porcentaje_scroll', label: '📜 Porcentaje de scroll', desc: 'Qué tanto desplazaste la página durante la sesión.' },
  { key: 'pausas_scroll', label: '⏸️ Pausas de scroll', desc: 'Número de pausas detectadas mientras hacías scroll.' },
  { key: 'user_agent', label: '🖥️ User agent', desc: 'Información técnica del navegador (versión, motor).' },
  { key: 'platform', label: '💻 Plataforma', desc: 'Sistema operativo desde el que nos visitas.' },
  { key: 'language', label: '🗣️ Idioma', desc: 'Idioma configurado en tu navegador.' },
  { key: 'screen_resolution', label: '📺 Resolución de pantalla', desc: 'Ancho x alto de tu pantalla.' },
  { key: 'color_depth', label: '🎨 Profundidad de color', desc: 'Bits de color que soporta tu pantalla.' },
  { key: 'timezone', label: '🕒 Zona horaria', desc: 'Tu zona horaria detectada.' },
  { key: 'cpu_cores', label: '🧠 Núcleos de CPU', desc: 'Cantidad de núcleos lógicos detectados.' },
  { key: 'device_memory', label: '💾 Memoria del dispositivo', desc: 'Memoria aproximada disponible en tu dispositivo.' },
  { key: 'fingerprint', label: '🔐 Huella digital (fingerprint)', desc: 'Una cadena única generada para este navegador (no te identifica personalmente).' },
  { key: 'timestamp', label: '🕰️ Timestamp', desc: 'Fecha y hora en que se registró la elección.' }
];

function el(text) { return document.createElement(text); }

function timeAgo(ts) {
  if (!ts) return '';
  const now = Date.now();
  const diff = now - new Date(ts).getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 60) return `hace ${sec} seg`;
  const min = Math.round(sec / 60);
  if (min < 60) return `hace ${min} min`;
  const hrs = Math.round(min / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.round(hrs / 24);
  return `hace ${days} d`;
}

function createDataCard(field, value) {
  const card = el('div');
  card.className = 'data-card';
  const title = el('div');
  title.className = 'data-title';
  title.innerHTML = `<span class="emoji">${field.label.split(' ')[0]}</span><strong>${field.label.replace(/^\S+\s/, '')}</strong>`;

  const desc = el('div');
  desc.className = 'data-desc';
  desc.textContent = field.desc;

  const val = el('div');
  val.className = 'data-value';
  val.textContent = (value !== undefined && value !== null && value !== '') ? value : 'No disponible';

  card.appendChild(title);
  card.appendChild(val);
  card.appendChild(desc);
  return card;
}

function renderDatosGrid(data) {
  const grid = document.getElementById('datosGrid');
  grid.innerHTML = '';
  dataFields.forEach(f => {
    let v = data[f.key];
    // try common fallbacks
    if ((v === undefined || v === null) && f.key === 'country') v = data.country_name || data.pais || data.country || data.countryCode;
    if ((v === undefined || v === null) && f.key === 'region') v = data.region || data.regionName || data.provincia;
    if (f.key === 'movimientos_mouse' && v && typeof v === 'string') {
      try { v = JSON.parse(v); v = Array.isArray(v) ? v.join(' → ') : v; } catch(e) {}
    }
    if (f.key === 'timestamp' && v) v = new Date(v).toLocaleString();
    if (f.key === 'tiempo_seleccion' && v) v = `${v} ms`;
    if (f.key === 'porcentaje_scroll' && v) v = `${v}%`;
    if (f.key === 'pausas_scroll' && v) v = `${v}`;
    grid.appendChild(createDataCard(f, v));
  });
}

function renderSessionSummary(data) {
  const wrap = document.getElementById('sessionSummary');
  wrap.innerHTML = '';
  const items = [
    { emoji: '🔒', label: 'IP', value: data.currentIp || data.ip || 'No disponible' },
    { emoji: '📝', label: 'Entradas', value: (data.timeline && data.timeline.length) || 0 },
    { emoji: '⏱️', label: 'Última', value: data.timeline && data.timeline.length ? timeAgo(data.timeline[data.timeline.length-1].timestamp) : '—' }
  ];
  const row = el('div'); row.className = 'summary-row';
  items.forEach(it => {
    const card = el('div'); card.className = 'summary-card';
    card.innerHTML = `<div class="sum-emoji">${it.emoji}</div><div class="sum-body"><div class="sum-label">${it.label}</div><div class="sum-value">${it.value}</div></div>`;
    row.appendChild(card);
  });
  wrap.appendChild(row);
}

function renderTimeline(entries) {
  const cont = document.getElementById('timeline');
  const empty = document.getElementById('emptyMessage');
  cont.querySelectorAll('.timeline-item').forEach(n => n.remove());
  if (!entries || entries.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  entries.forEach((entry, i) => {
    const item = el('div'); item.className = 'timeline-item';
    item.style.animationDelay = `${i * 0.08}s`;

    const dot = el('div'); dot.className = 'timeline-dot';
    const hex = entry.color && entry.color.startsWith('#') ? entry.color : (entry.color ? `#${entry.color}` : '#ffffff');
    dot.style.backgroundColor = hex;
    dot.style.boxShadow = `0 6px 18px ${hex}60`;

    const content = el('div'); content.className = 'timeline-content-card';
    const colorSample = el('div'); colorSample.className = 'sample-circle'; colorSample.style.backgroundColor = hex;
    const details = el('div'); details.className = 'details';
    const name = el('div'); name.className = 'color-name'; name.textContent = entry.color || 'Color';
    const meta = el('div'); meta.className = 'color-meta';
    meta.innerHTML = `${timeAgo(entry.timestamp)} ${entry.country ? ' • ' + entry.country : ''} ${entry.region ? ' • ' + entry.region : ''}`;

    details.appendChild(name); details.appendChild(meta);
    content.appendChild(colorSample); content.appendChild(details);

    item.appendChild(dot); item.appendChild(content);
    cont.appendChild(item);
  });
}

async function loadProfileAndRender() {
  const sessionId = sessionStorage.getItem('sessionId');
  let profile = {};
  if (sessionId) {
    try {
      const r = await fetch(`/api/perfil/${sessionId}`);
      if (r.ok) profile = await r.json(); else console.warn('Perfil no disponible', r.status);
    } catch (e) { console.warn('Error fetch perfil', e); }
  }

  // If profile empty, prepare educational placeholders
  if (!profile || Object.keys(profile).length === 0) {
    profile = {
      currentIp: 'Anónima',
      timeline: [],
    };
  }

  renderDatosGrid(profile);
  renderSessionSummary(profile);
  renderTimeline(profile.timeline);
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('toggle-datos');
  const panel = document.getElementById('panel-datos');
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    panel.setAttribute('aria-hidden', String(open));
    btn.querySelector('.chev').textContent = open ? '▾' : '▴';
    panel.style.maxHeight = open ? '0' : panel.scrollHeight + 'px';
    panel.classList.toggle('open', !open);
  });

  // close panel on escape
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') {
    btn.setAttribute('aria-expanded', 'false'); panel.setAttribute('aria-hidden', 'true'); panel.style.maxHeight = '0'; panel.classList.remove('open'); btn.querySelector('.chev').textContent = '▾';
  }});

  loadProfileAndRender();
});

