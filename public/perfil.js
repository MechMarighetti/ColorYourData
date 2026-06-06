import { COLOR_OPTIONS, COLOR_NAMES, DATA_FIELDS } from './shared/utils.js';

document.addEventListener('DOMContentLoaded', async function() {
  const contentDiv = document.getElementById('content');
  
  async function loadProfile() {
    const sessionId = sessionStorage.getItem('sessionId');
    
    if (sessionId) {
      try {
        const r = await fetch(`/api/perfil/${sessionId}`);
        if (r.ok) {
          const data = await r.json();
          return data;
        } else {
          console.warn('Perfil no disponible', r.status);
          return null;
        }
      } catch (e) { 
        console.warn('Error fetch perfil', e); 
        return null; 
      }
     const profile = await loadProfile();
    
    // Si no hay perfil, mostrar mensaje
    if (!perfil) {
      contentDiv.innerHTML = `
      <div class="error">
      <p>🎨 Aún no has guardado ningún color favorito.</p>
      <p><a class="inline-action-link" href="index.html">Ir a la encuesta</a></p>
      </div>
      `;
      return null;
    }
    
  }};
  

  function renderPerfil(data) {
    
    const contentDiv = document.getElementById('content');
  let html = '';

  // Sección: Tu color elegido
  html += `
    <div class="section">
      <h2>🎨 Tu color elegido</h2>
      <div class="color-preview" style="background-color: ${data.color};"></div>
      <p class="profile-color-name">${COLOR_NAMES[data.color] || data.color}</p>
      <p class="profile-color-name">${data.nombre || 'Nombre no disponible'}</p>
    
      <p class="profile-color-text" style="color: ${data.color};">${data.color}</p>
      <p class="profile-country-text">De: <strong>${data.country || 'Desconocido'}</strong></p>
    </div>
  `;

  // Sección: Tiempo de decisión
  const tiempoMs = parseInt(data.tiempo_seleccion);
  const tiempoSeg = isNaN(tiempoMs) ? '--' : (tiempoMs / 1000).toFixed(2);
  let interpretacionTiempo = '';

  if (tiempoMs < 2000) {
    interpretacionTiempo = '⚡ ¡Rapidísimo! No lo dudaste ni un segundo.';
  } else if (tiempoMs <= 5000) {
    interpretacionTiempo = '🧐 Lo pensaste un poquito, buena elección.';
  } else {
    interpretacionTiempo = '🐢 ¡Te tomaste tu tiempo! Prefieres analizar antes de decidir.';
  }

  html += `
    <div class="section">
      <h2>⏱️ Tiempo de decisión</h2>
      <div class="stat-value">${tiempoSeg}s</div>
      <div class="interpretation">${interpretacionTiempo}</div>
    </div>
  `;

  // Sección: ¿Indeciso o decidido?
  const clicsErroneos = (data.clics_erroneos === 'No consentido' || !data.clics_erroneos) ? 0 : parseInt(data.clics_erroneos);
  let interpretacionClics = '';

  if (clicsErroneos === 0) {
    interpretacionClics = '🎯 Súper decidido/a. Elegiste a la primera.';
  } else if (clicsErroneos <= 2) {
    interpretacionClics = '🔄 Exploraste un par de opciones, curiosidad sana.';
  } else {
    interpretacionClics = '🎨 ¡Te encanta explorar todas las posibilidades!';
  }

  html += `
    <div class="section">
      <h2>🤔 ¿Indeciso o decidido?</h2>
      <div class="stat-value">${clicsErroneos} cambios</div>
      <div class="interpretation">${interpretacionClics}</div>
    </div>
  `;

  // Sección: Mapa de calor de movimientos
  const movimientosStr = data.movimientos_mouse;
  if (movimientosStr && movimientosStr !== 'No consentido') {
    try {
      const movimientos = JSON.parse(movimientosStr);
      if (Array.isArray(movimientos) && movimientos.length > 0) {
        html += renderHeatmap(movimientos);
      } else {
        html += `
          <div class="section">
            <h2>🗺️ Mapa de calor de tus movimientos</h2>
            <div class="no-data">No se registraron movimientos (no diste permiso).</div>
          </div>
        `;
      }
    } catch (err) {
      html += `
        <div class="section">
          <h2>🗺️ Mapa de calor de tus movimientos</h2>
          <div class="no-data">No se registraron movimientos válidos.</div>
        </div>
      `;
    }
  } else {
    html += `
      <div class="section">
        <h2>🗺️ Mapa de calor de tus movimientos</h2>
        <div class="no-data">No se registraron movimientos (no diste permiso).</div>
      </div>
    `;
  }

  // Sección: Tu exploración de la página
  const scrollPorcentaje = (data.porcentaje_scroll === 'No consentido' || !data.porcentaje_scroll) ? 0 : parseInt(data.porcentaje_scroll);
  const pausasScroll = (data.pausas_scroll === 'No consentido' || !data.pausas_scroll) ? 0 : parseInt(data.pausas_scroll);

  let scrollTexto = '';
  if (scrollPorcentaje === 0) {
    scrollTexto = 'Parece que no hiciste scroll, ibas directo al color. 🎯';
  } else {
    scrollTexto = `Has visto el <strong>${scrollPorcentaje}%</strong> de la página.`;
  }

  let pausasTexto = '';
  if (pausasScroll > 0) {
    pausasTexto = `<p>📖 Te detuviste <strong>${pausasScroll} veces</strong> a leer con atención.</p>`;
  }
function renderSessionSummary(data) {
  const wrap = document.getElementById('sessionSummary');
  wrap.innerHTML = '';
  const items = [
    { emoji: '🔒', label: 'IP', value: data.currentIp || data.ip || 'No disponible' },
    { emoji: '📝', label: 'Entradas', value: (data.timeline && data.timeline.length) || 0 },
    { emoji: '⏱️', label: 'Última', value: data.timeline && data.timeline.length ? timeAgo(data.timeline[data.timeline.length - 1].timestamp) : '—' }
  ];
  const row = el('div'); row.className = 'summary-row';
  items.forEach(it => {
    const card = el('div'); card.className = 'summary-card';
    card.innerHTML = `<div class="sum-emoji">${it.emoji}</div><div class="sum-body"><div class="sum-label">${it.label}</div><div class="sum-value">${it.value}</div></div>`;
    row.appendChild(card);
  });
  wrap.appendChild(row);
}

  renderPerfil(data);
  renderDatosGrid(data);
  renderSessionSummary(data);
 

  html += `
    <div class="section">
      <h2>👀 Tu exploración de la página</h2>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${Math.min(scrollPorcentaje, 100)}%;"></div>
      </div>
      <p>${scrollTexto}</p>
      ${pausasTexto}
    </div>
  `;

  contentDiv.innerHTML = html;
};

function renderHeatmap(movimientos) {
  // Contar frecuencias (celdas 0-15)
  const frecuencias = {};
  for (let i = 0; i < 16; i++) frecuencias[i] = 0;
  
  movimientos.forEach(cellIdx => {
    if (cellIdx >= 0 && cellIdx < 16) frecuencias[cellIdx]++;
  });

  const maxFrecuencia = Math.max(...Object.values(frecuencias), 1);

  const getHeatmapColor = (freq, max) => {
    if (freq === 0) return '#e0e0e0';
    const ratio = freq / max;
    if (ratio > 0.66) return '#ff4444';
    if (ratio > 0.33) return '#ffaa44';
    return '#44ff88';
  };

  const getFrequencyLabel = (freq) => {
    if (freq === 0) return '-';
    if (freq === 1) return '1';
    if (freq <= 5) return freq;
    return freq + '+';
  };

  let heatmapHtml = '<div class="heatmap-container">';
  for (let i = 0; i < 16; i++) {
    const freq = frecuencias[i];
    const color = getHeatmapColor(freq, maxFrecuencia);
    heatmapHtml += `
      <div class="heatmap-cell" style="background-color: ${color};" title="Celda ${i}: ${freq} visitas">
        ${getFrequencyLabel(freq)}
      </div>
    `;
  }
  heatmapHtml += '</div>';

  return `
    <div class="section">
      <h2>🗺️ Mapa de calor de tus movimientos</h2>
      <p>🔴 Rojo = mucho movimiento | 🟠 Naranja = algo | 🟢 Verde = poco</p>
      ${heatmapHtml}
      <p class="heatmap-note">
        Registramos <strong>${movimientos.length}</strong> posiciones del mouse en una cuadrícula 4x4.
      </p>
    </div>
  `;}
}
);