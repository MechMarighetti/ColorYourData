import { COLOR_OPTIONS, COLOR_NAMES, DATA_FIELDS, normalizeHex, colorName, hexToRgba  } from './shared/utils.js';


function hasTrackingConsent(data) {
  return data && data.tiempo_seleccion && data.tiempo_seleccion !== 'No consentido';
}

function formatRelativeDate(timestamp) {
  if (!timestamp) return 'Sin fecha';
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'recien';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return `hace ${days} dias`;
}

function formatValue(key, data) {
  const notAvailable = 'No disponible';
  if (!data) return notAvailable;

  if (key === 'color') {
    const hex = normalizeHex(data.color);
    return `<span class="value-with-dot"><span class="mini-color-dot" style="background:${hex}"></span>${colorName(hex)} <small>${hex}</small></span>`;
  }
  if (key === 'ip') return data.currentIp || data.ip || notAvailable;
  if (key === 'country_region') return `${data.country || 'Pais desconocido'} · ${data.region || 'Region no disponible'}`;
  if (key === 'tiempo_seleccion') {
    if (data.tiempo_seleccion === 'No consentido') return 'No consentido';
    const ms = Number(data.tiempo_seleccion);
    return Number.isFinite(ms) ? `${(ms / 1000).toFixed(2)} segundos` : notAvailable;
  }
  if (key === 'clics_erroneos') return data.clics_erroneos || 'No consentido';
  if (key === 'movimientos_mouse') {
    if (!data.movimientos_mouse || data.movimientos_mouse === 'No consentido') {
      return '<span style="color: #999; font-style: italic;">No consentido</span>';
    }
    try {
      const parsed = JSON.parse(data.movimientos_mouse);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return renderHeatmap(parsed);
      }
      return '<span style="color: #999; font-style: italic;">Sin datos de movimiento</span>';
    } catch (err) {
      return '<span style="color: #999; font-style: italic;">No se pudo procesar</span>';
    }
  }
  if (key === 'porcentaje_scroll') return data.porcentaje_scroll && data.porcentaje_scroll !== 'No consentido' ? `${data.porcentaje_scroll}%` : 'No consentido';
  if (key === 'pausas_scroll') return data.pausas_scroll || 'No consentido';
  if (key === 'platform_user_agent') return `${data.platform || notAvailable} · ${shortBrowser(data.user_agent)}`;
  if (key === 'language') return data.language || notAvailable;
  if (key === 'screen_resolution') return data.screen_resolution || notAvailable;
  if (key === 'color_depth') return data.color_depth ? `${data.color_depth} bits` : notAvailable;
  if (key === 'timezone') return data.timezone || notAvailable;
  if (key === 'cpu_cores') return data.cpu_cores || notAvailable;
  if (key === 'device_memory') return data.device_memory ? `${data.device_memory} GB aprox.` : notAvailable;
  if (key === 'fingerprint') return data.fingerprint_name || random_name(data.fingerprint);
  if (key === 'timestamp') return data.timestamp ? new Date(data.timestamp).toLocaleString('es-AR') : notAvailable;
   if (key === 'mapa_ubicacion') {
  const lat = parseFloat(data.latitude);
  const lng = parseFloat(data.longitude);

  if (!data.latitude || !data.longitude || isNaN(lat) || isNaN(lng)) {
    return '<span style="color:#999;font-style:italic;">Ubicación no disponible</span>';
  }

  // ID único por si hay varios mapas en la página
  const mapId = `map-${Math.random().toString(36).slice(2, 7)}`;

  // Iniciamos el mapa después de que el DOM exista
  requestAnimationFrame(() => {
    const container = document.getElementById(mapId);
    if (!container || typeof google === 'undefined') return;

    const pos = { lat, lng };
    const map = new google.maps.Map(container, {
      center: pos,
      zoom: 13,
      disableDefaultUI: true,
      zoomControl: true,
    });
    new google.maps.Marker({ position: pos, map });
  });

  return `<div id="${mapId}" style="width:100%;height:220px;border-radius:12px;"></div>`;
}
  
  return data[key] || notAvailable;
}

function shortBrowser(userAgent) {
  if (!userAgent) return 'Navegador no disponible';
  if (userAgent.includes('Edg/')) return 'Edge';
  if (userAgent.includes('Chrome/')) return 'Chrome';
  if (userAgent.includes('Firefox/')) return 'Firefox';
  if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) return 'Safari';
  if (userAgent.includes('OPR/') || userAgent.includes('Opera/')) return 'Opera';

  return userAgent.slice(0, 42);
}

function renderHeatmap(movimientos) {
  // Convertir a grid 8x8 (64 celdas total)
  const frecuencias = {};
  for (let i = 0; i < 64; i++) frecuencias[i] = 0;

  if (Array.isArray(movimientos)) {
    movimientos.forEach(cellIdx => {
      if (cellIdx >= 0 && cellIdx < 64) frecuencias[cellIdx]++;
    });
  }

  const maxFrecuencia = Math.max(...Object.values(frecuencias), 1);

  const getHeatmapColor = (freq, max) => {
    if (freq === 0) return '#f0f0f0';
    const ratio = freq / max;
    if (ratio > 0.66) return '#ff6f91';
    if (ratio > 0.33) return '#ffc3a0';
    return '#b4f8c8';
  };

  const getFrequencyLabel = (freq) => {
    if (freq === 0) return '-';
    if (freq === 1) return '1';
    if (freq <= 5) return freq;
    return freq + '+';
  };


  let heatmapHtml = '<div class="heatmap-container-8x8">';
  for (let i = 0; i < 64; i++) {
    const freq = frecuencias[i];
    const color = getHeatmapColor(freq, maxFrecuencia);
    heatmapHtml += `
      <div class="heatmap-cell-8x8" style="background-color: ${color};" title="Celda ${i}: ${freq} visitas">
        ${getFrequencyLabel(freq)}
      </div>
    `;
  }
  heatmapHtml += '</div>';

  return `
    <div class="heatmap-section-8x8">
      <p style="font-size: 0.9em; color: #888; margin: 12px 0 8px 0;">Rojo = mucho movimiento | Naranja = algo | Verde = poco</p>
      ${heatmapHtml}
      <p style="text-align: center; color: #888; font-size: 0.85em; margin-top: 12px;">
        Registramos <strong>${movimientos.length || 0}</strong> posiciones del mouse en una cuadrícula 8x8.
      </p>
    </div>
    <div class="heatmap-cell-8x8" style="background-color: ${color};" title="Celda ${i}: ${freq} visitas">
        ${getFrequencyLabel(freq)}
      </div>
  `;
}


function fieldsFor(data) {
  if (hasTrackingConsent(data)) return DATA_FIELDS;
  return DATA_FIELDS.filter(field => ['color', 'country_region', 'timestamp'].includes(field.key));
}

function showRealip(profile) {
  ip = profile.cleanIp || 'IP no disponible';
  return DATA_FIELDS.ip = ip;
}

function renderPerfil(data) {

  const contentDiv = document.getElementById('content');
  let html = '';

  // Sección: Tu color elegido
  html += `
    <div class="section">
      <h2>🎨 Tu color elegido</h2>
      <div class="color-preview" style="background-color: ${data.color};"></div>
      <p class="profile-color-text" style="color: ${data.color};">${data.color}</p>
      <p class="profile-country-text">De: <strong>${data.country || 'Desconocido'}</strong></p>
    </div>
  `;

  // Sección: Tiempo de decisión
  const tiempoMs = parseInt(data.tiempo_seleccion);
  const tiempoSeg = isNaN(tiempoMs) ? '--' : (tiempoMs / 1000).toFixed(2);
  let interpretacionTiempo = '';

  if (tiempoMs < 2000) {
    interpretacionTiempo = '⚡ ¡Rapidísimo! Alguien claramente tiene un color favorito.';
  } else if (tiempoMs <= 5000) {
    interpretacionTiempo = '🧐 Lo pensaste un poquito, fue una buena elección.';
  } else {
    interpretacionTiempo = '🐢 ¡Te tomaste tu tiempo! Reflexionaste antes de decidir.';
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
  }
  else if (clicsErroneos > 10) {
    interpretacionClics = '🎨 ¡Cuantos clicks! Había muchas opciones, lo entendemos.';

  } else {
    interpretacionClics = '🎨 ¡Las posibilidades son infinitas!';
  }

  html += `
    <div class="section">
      <h2>🤔 ¿Decidido?</h2>
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
         
            <h2>🗺️ Mapa de calor de tus movimientos</h2>
            <div class="no-data">No se registraron movimientos (no diste permiso).</div>
         
        `;
      }
    } catch (err) {
      html += `
       
          <h2>🗺️ Mapa de calor de tus movimientos</h2>
          <div class="no-data">No se registraron movimientos válidos.</div>
        
      `;
    }
  } else {
    html += `
     
        <h2>🗺️ Mapa de calor de tus movimientos</h2>
        <div class="no-data">No se registraron movimientos (no diste permiso).</div>
     
    `;
  }

  // Sección: Tu exploración de la página
  const scrollPorcentaje = (data.porcentaje_scroll === 'No consentido' || !data.porcentaje_scroll) ? 0 : parseInt(data.porcentaje_scroll);
  const pausasScroll = (data.pausas_scroll === 'No consentido' || !data.pausas_scroll) ? 0 : parseInt(data.pausas_scroll);

  let scrollTexto = '';
  if (scrollPorcentaje === 0) {
    scrollTexto = 'Casi no hiciste scroll, fuiste directo al color. 🎯';
  } else {
    scrollTexto = `Viste el <strong>${scrollPorcentaje}%</strong> de la página.`;
  }

  let pausasTexto = '';
  if (pausasScroll > 0) {
    pausasTexto = `<p>📖 Paraste <strong>${pausasScroll} veces</strong> a mirar con atención.</p>`;
  }

  renderHeatmap(data.movimientos_mouse);



  renderSessionSummary(data);
  renderDatosGrid(data);


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
}



function renderDataGrid(container, data, opts = {}) {
  // Cute/educativo: mensajes lúdicos para algunos campos
  const cuteMessages = {
    tiempo_seleccion: ms => {
      if (ms === 'No consentido') return '';
      const s = Number(ms) / 1000;
      if (s < 2) return '¡Rápido como un rayo! ⚡';
      if (s < 5) return '¡Tranquilo y seguro! 😊';
      return '¡Te tomaste tu tiempo, pensativo! 🤔';
    },
    clics_erroneos: v => {
      if (v === 'No consentido' || v === undefined) return '';
      if (Number(v) === 0) return '¡Decisión instantánea! 🎯';
      if (Number(v) < 3) return '¡Un par de dudas, normal! 🤷‍♂️';
      return '¡Explorador curioso! 🔍';
    },
    movimientos_mouse: v => {
      if (v === 'No consentido' || !v) return '';
      try {
        const n = Array.isArray(v) ? v.length : (Array.isArray(JSON.parse(v)) ? JSON.parse(v).length : 0);
        if (n < 3) return '¡Casi no moviste el mouse! 💤';
        if (n < 8) return '¡Recorriste la página! 🐾';
        return '¡Exploración total! 🗺️';
      } catch { return ''; }
    },
    porcentaje_scroll: v => {
      if (v === 'No consentido' || v === undefined) return '';
      const n = Number(v);
      if (n < 30) return '¡Te quedaste arriba! 👀';
      if (n < 80) return '¡Leíste bastante! 📖';
      return '¡Llegaste al final! 🏁';
    },
    pausas_scroll: v => {
      if (v === 'No consentido' || v === undefined) return '';
      if (Number(v) === 0) return '¡Lectura veloz! 🚀';
      if (Number(v) < 3) return '¡Te detuviste a pensar! 💭';
      return '¡Analizaste cada detalle! 🔬';
    }
  };
  const isTech = opts.techOnly;
  const fields = isTech
    ? DATA_FIELDS.filter(f => [
      'platform_user_agent', 'screen_resolution', 'color_depth', 'timezone', 'cpu_cores', 'device_memory', 'language', 'fingerprint'
    ].includes(f.key))
    : fieldsFor(data).filter(f => ![
      'platform_user_agent', 'screen_resolution', 'color_depth', 'timezone', 'cpu_cores', 'device_memory', 'language', 'fingerprint',
      'movimientos_mouse'
    ].includes(f.key));
  container.innerHTML = fields.map(field => {
    let value = formatValue(field.key, data);
    let cute = '';
    if (!isTech && cuteMessages[field.key]) {
      cute = `<div class="cute-msg">${cuteMessages[field.key](data[field.key])}</div>`;
    }
    return `
      <article class="info-card fade-in-up">
        <div class="info-card-head">
          <span>${field.icon} ${field.label}</span>
          <button class="tooltip-trigger" type="button" aria-label="Por qué se recolecta ${field.label}">
            ?
            <span class="tooltip-box">${field.description}</span>
          </button>
        </div>
        <div class="info-card-value">${value}${cute}</div>
      </article>
    `;
  }).join('');
}

function renderHistory(timeline) {
  const list = document.getElementById('historyList');
  if (!timeline || timeline.length === 0) {
    list.innerHTML = '<div class="empty-message">No hay colores anteriores para esta IP.</div>';
    return;
  }

  list.innerHTML = [...timeline].reverse().map(entry => {
    const hex = normalizeHex(entry.color);
    return `
      <button class="history-item" type="button" data-id="${entry.id}">
        <span class="mini-color-dot" style="background:${hex}"></span>
        <span><strong>${colorName(hex)}</strong><small>${formatRelativeDate(entry.timestamp)}</small></span>
      </button>
    `;
  }).join('');

  list.querySelectorAll('.history-item').forEach(button => {
    button.addEventListener('click', () => openHistoryDetail(button.dataset.id));
  });
}

async function openHistoryDetail(id) {
  const modal = document.getElementById('detailModal');
  const modalContent = document.getElementById('modalContent');
  modalContent.innerHTML = '<div class="loading">Cargando detalle...</div>';
  modal.classList.remove('is-hidden');

  try {
    const hashedId = hashId(id);
    const response = await fetch(`/api/perfil/${hashedId}`);
    if (!response.ok) throw new Error('No se pudo cargar el detalle');
    const data = await response.json();
    renderDataGrid(modalContent, data);
  } catch (err) {
    modalContent.innerHTML = '<div class="error">No pudimos cargar esa respuesta.</div>';
  }
}

function closeModal() {
  document.getElementById('detailModal').classList.add('is-hidden');
}


function showSaludoPersonalizado(profile) {
  const saludo = document.getElementById('saludoHuella');
  const subtitulo = document.getElementById('subtituloHuella');
  if (profile && profile.fingerprint) {
    const nombre = profile.fingerprint_name || random_name(profile.fingerprint);
    saludo.textContent = `✨ ¡Hola, ${nombre}! ✨`;
    subtitulo.textContent = `Elegiste el color ${colorName(profile.color)} y así te vimos pasar por nuestra encuesta.`;
  } else {
    saludo.textContent = 'Todavía no elegiste tu color';
    subtitulo.textContent = '¡Te esperamos para descubrir tu huella digital!';
  }
}

async function obtenerMiPerfil() {
  try {
    const response = await fetch('/api/perfil');
    if (!response.ok) throw new Error('No se pudo cargar el perfil');
    return await response.json();
  } catch (err) {
    console.warn('Error al obtener perfil', err);
    return null;
  }}

async function initHuella() {
  const profile = await obtenerMiPerfil();
  if (!profile) {
    document.getElementById('emptyState').classList.remove('is-hidden');
    return;
  }
  const grid = document.getElementById('currentDataGrid');
  const empty = document.getElementById('emptyState');
  const notice = document.getElementById('limitedNotice');
  const fingerprintTitle = document.getElementById('currentFingerprintName');
  const techBtn = document.getElementById('toggleTech');
  const techDetails = document.getElementById('techDetails');

  try {
    const [profileResponse, timelineResponse] = await Promise.all([
      fetch('/api/perfil'),
      fetch('/timeline-data')
    ]);

    if (profileResponse.status === 404) {
      grid.innerHTML = '';
      empty.classList.remove('is-hidden');
      showSaludoPersonalizado(null);
      renderHistory([]);
      return;
    }

    if (!profileResponse.ok) throw new Error('Error al cargar perfil');
    const profile = await profileResponse.json();
    const timelineData = timelineResponse.ok ? await timelineResponse.json() : { timeline: [] };

    profile.currentIp = timelineData.currentIp || profile.ip;
    if (!hasTrackingConsent(profile)) notice.classList.remove('is-hidden');
    const nombre = profile.fingerprint_name || random_name(profile.fingerprint);
    fingerprintTitle.textContent = `Huella anónima: ${nombre}`;
    showSaludoPersonalizado(profile);

    // Render principal (no técnicos)
    renderDataGrid(grid, profile);
    // Render detalles técnicos ocultos
    renderDataGrid(techDetails, profile, { techOnly: true });
    techDetails.classList.add('tech-details');
    techDetails.style.display = 'none';
    techBtn.classList.remove('is-hidden');
    let techOpen = false;
    techBtn.onclick = () => {
      techOpen = !techOpen;
      techDetails.style.display = techOpen ? 'grid' : 'none';
      techDetails.classList.toggle('open', techOpen);
      techBtn.textContent = techOpen ? '🔽 Ocultar detalles técnicos' : '🔍 Ver detalles técnicos';
    };

    renderHistory(timelineData.timeline || []);
    // Animación fade-in-up
    setTimeout(() => {
      document.querySelectorAll('.fade-in-up').forEach(el => {
        el.classList.add('show');
      });
    }, 100);
  } catch (err) {
    grid.innerHTML = '<div class="error">No pudimos cargar tu huella. Proba de nuevo más tarde.</div>';
    showSaludoPersonalizado(null);
  }
};

document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('detailModal').addEventListener('click', event => {
  if (event.target.id === 'detailModal') closeModal();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeModal();
});

initHuella();
