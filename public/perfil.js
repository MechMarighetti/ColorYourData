import { COLOR_NAMES } from './shared/utils.js';

document.addEventListener('DOMContentLoaded', async function() {
  const contentDiv = document.getElementById('content');

  async function loadProfile() {
    const sessionId = sessionStorage.getItem('sessionId');

    if (sessionId) {
      try {
        const r = await fetch(`/api/perfil/${sessionId}`);
        if (r.ok) return await r.json();
      } catch (e) {
        console.warn('Error fetch perfil por sessionId', e);
      }
    }

    try {
      const r = await fetch('/api/mi-perfil');
      if (r.ok) return await r.json();
    } catch (e) {
      console.warn('Error fetch mi-perfil', e);
    }

    return null;
  }

  const data = await loadProfile();

  if (!data) {
    contentDiv.innerHTML = `
      <div class="error">
        <p>🎨 Aún no has guardado ningún color favorito.</p>
        <p><a class="inline-action-link" href="index.html">Ir a la encuesta</a></p>
      </div>
    `;
    return;
  }

  renderPerfil(data);
});

function renderPerfil(data) {
  const contentDiv = document.getElementById('content');
  let html = '<div class="perfil-grid">';

  html += `
    <div class="section">
      <h2>🎨 Tu color elegido</h2>
      <div class="card-color-row">
        <div class="color-preview" style="background-color: ${data.color};"></div>
        <div class="card-color-info">
          <p class="profile-color-name">${COLOR_NAMES[data.color] || data.color}</p>
          <p class="profile-color-name secondary">${data.fingerprint_name || ''}</p>
          <p class="profile-color-hex" style="color: ${data.color};"><span>${data.color}</span></p>
        </div>
      </div>
    </div>
  `;

  const tiempoMs = parseInt(data.tiempo_seleccion);
  const tiempoSeg = isNaN(tiempoMs) ? '--' : (tiempoMs / 1000).toFixed(2);
  let interpretacionTiempo = '';

  if (isNaN(tiempoMs) || data.tiempo_seleccion === 'No consentido') {
    interpretacionTiempo = '🔒 No diste permiso para registrar este dato.';
  } else if (tiempoMs < 2000) {
    interpretacionTiempo = '⚡ ¡Rapidísimo! No lo dudaste ni un segundo.';
  } else if (tiempoMs <= 5000) {
    interpretacionTiempo = '🧐 Lo pensaste un poquito, buena elección.';
  } else {
    interpretacionTiempo = '🐢 ¡Te tomaste tu tiempo! Prefieres analizar antes de decidir.';
  }

  html += `
    <div class="section">
      <h2>⏱️ Tiempo de decisión</h2>
      <div class="stat-value">${tiempoSeg === '--' ? '--' : tiempoSeg + 's'}</div>
      <div class="interpretation">${interpretacionTiempo}</div>
    </div>
  `;

  const movimientosStr = data.movimientos_mouse;
  if (movimientosStr && movimientosStr !== 'No consentido') {
    try {
      const movimientos = JSON.parse(movimientosStr);
      if (Array.isArray(movimientos) && movimientos.length > 0) {
        html += renderHeatmap(movimientos);
      } else {
        html += `<div class="section section--full"><h2>🗺️ Mapa de calor de tus movimientos</h2><div class="no-data">No se registraron movimientos.</div></div>`;
      }
    } catch {
      html += `<div class="section section--full"><h2>🗺️ Mapa de calor de tus movimientos</h2><div class="no-data">No se registraron movimientos válidos.</div></div>`;
    }
  } else {
    html += `<div class="section section--full"><h2>🗺️ Mapa de calor de tus movimientos</h2><div class="no-data">No diste permiso para registrar movimientos.</div></div>`;
  }

  const clicsErroneos = (data.clics_erroneos === 'No consentido' || !data.clics_erroneos) ? null : parseInt(data.clics_erroneos);
  let interpretacionClics = '';

  if (clicsErroneos === null) {
    interpretacionClics = '🔒 No diste permiso para registrar este dato.';
  } else if (clicsErroneos === 0) {
    interpretacionClics = '🎯 Súper decidido/a. Elegiste a la primera.';
  } else if (clicsErroneos <= 2) {
    interpretacionClics = '🔄 Exploraste un par de opciones, curiosidad sana.';
  } else {
    interpretacionClics = '🎨 ¡Te encanta explorar todas las posibilidades!';
  }

  html += `
    <div class="section">
      <h2>🤔 ¿Indeciso o decidido?</h2>
      <div class="stat-value">${clicsErroneos === null ? '--' : clicsErroneos + ' cambios'}</div>
      <div class="interpretation">${interpretacionClics}</div>
    </div>
  `;

  const scrollPorcentaje = (data.porcentaje_scroll === 'No consentido' || !data.porcentaje_scroll) ? null : parseInt(data.porcentaje_scroll);
  const pausasScroll = (data.pausas_scroll === 'No consentido' || !data.pausas_scroll) ? 0 : parseInt(data.pausas_scroll);

  let scrollTexto = '';
  if (scrollPorcentaje === null) {
    scrollTexto = '🔒 No diste permiso para registrar este dato.';
  } else if (scrollPorcentaje === 0) {
    scrollTexto = 'Parece que no hiciste scroll, ibas directo al color. 🎯';
  } else {
    scrollTexto = `Has visto el <strong>${scrollPorcentaje}%</strong> de la página.`;
  }

  const pausasTexto = pausasScroll > 0
    ? `<p>📖 Te detuviste <strong>${pausasScroll} veces</strong> a leer con atención.</p>`
    : '';

  html += `
    <div class="section">
      <h2>👀 Tu exploración de la página</h2>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${Math.min(scrollPorcentaje || 0, 100)}%;"></div>
      </div>
      <p>${scrollTexto}</p>
      ${pausasTexto}
    </div>
  `;

  html += '</div>';
  contentDiv.innerHTML = html;
}

function renderHeatmap(movimientos) {
  const frecuencias = {};
  for (let i = 0; i < 16; i++) frecuencias[i] = 0;

  movimientos.forEach(cellIdx => {
    if (cellIdx >= 0 && cellIdx < 16) frecuencias[cellIdx]++;
  });

  const maxFrecuencia = Math.max(...Object.values(frecuencias), 1);

  // Opacidad mínima 0.15 para celdas con actividad, 0 para vacías
  const getCellStyle = (freq, max) => {
    if (freq === 0) return 'background-color: #f0eeff;';
    const opacity = 0.15 + (freq / max) * 0.85;
    return `background-color: rgba(255, 111, 145, ${opacity.toFixed(2)});`;
  };

  const getTooltip = (freq) => {
    if (freq === 0) return 'Sin actividad';
    return freq === 1 ? '1 visita' : `${freq} visitas`;
  };

  let heatmapHtml = '<div class="heatmap-container">';
  for (let i = 0; i < 16; i++) {
    const freq = frecuencias[i];
    heatmapHtml += `
      <div class="heatmap-cell" style="${getCellStyle(freq, maxFrecuencia)}" title="${getTooltip(freq)}"></div>
    `;
  }
  heatmapHtml += '</div>';

  return `
    <div class="section section--full">
      <h2>🗺️ Mapa de calor de tus movimientos</h2>
      <p>Más intenso = más movimiento en esa zona · Pasá el mouse sobre cada celda para ver el detalle</p>
      ${heatmapHtml}
      <p class="heatmap-note">
        Registramos <strong>${movimientos.length}</strong> posiciones del mouse en una cuadrícula 4x4.
      </p>
    </div>
  `;
}
