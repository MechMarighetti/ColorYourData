const COLOR_NAMES = {
  '#FFB3BA': 'Rosa Caramelo',
  '#FFDFBA': 'Durazno Dulce',
  '#FFFFBA': 'Amarillo Mantequilla',
  '#BAFFC9': 'Menta Suave',
  '#BAE1FF': 'Azul Cielo',
  '#E8BAFF': 'Lila Magico',
  '#FFC3A0': 'Salmon Rosado',
  '#A0E7E5': 'Turquesa Claro',
  '#F5E1FD': 'Lavanda Bebe',
  '#B4F8C8': 'Verde Primavera',
  '#F9F871': 'Amarillo Sol',
  '#FF6F91': 'Fucsia Suave',
  '#FFD1DC': 'Crema de Fresa',
  '#E6E6FA': 'Perla Lavanda',
  '#F7DC6F': 'Melon Suave',
  '#F0B27A': 'Coral Claro',
  '#76D7C4': 'Aqua Fresco',
  '#F7CAC9': 'Rosa Cuarzo',
  '#D7BDE2': 'Lila Grisaceo',
  '#A3E4D7': 'Verde Agua',
  '#F9E79F': 'Amarillo Pastel',
  '#FAD7A1': 'Naranja Suave',
  '#F5E6CC': 'Vainilla',
  '#F2D7D5': 'Rosa Viejo',
  '#D4E6F1': 'Cielo Anochecer',
  '#A8E6CF': 'Menta Helada',
  '#FDEBD0': 'Champan'
};

const DATA_FIELDS = [
  { key: 'color', icon: '🎨', label: 'Color elegido', description: 'Es la respuesta central de la encuesta y permite comparar preferencias de color de forma anonima.' },
  { key: 'ip', icon: '📍', label: 'IP', description: 'Se usa para agrupar visitas aproximadas y construir tu historial local sin pedir nombre ni email.' },
  { key: 'country_region', icon: '🌎', label: 'Pais y region', description: 'La ubicacion aproximada ayuda a ver tendencias por zona geografica sin identificarte personalmente.' },
  { key: 'tiempo_seleccion', icon: '⏱️', label: 'Tiempo de seleccion', description: 'Mide cuanto tardaste en elegir para explicar como una pagina puede analizar tu comportamiento.' },
  { key: 'clics_erroneos', icon: '🖱️', label: 'Clics erroneos', description: 'Cuenta cambios o intentos previos para mostrar señales de decision o exploracion.' },
  { key: 'movimientos_mouse', icon: '🧭', label: 'Movimientos del mouse', description: 'Resume por que zonas pasaste el cursor; no guarda coordenadas exactas, solo un patron simplificado.' },
  { key: 'porcentaje_scroll', icon: '📜', label: 'Porcentaje de scroll', description: 'Indica que tanto recorriste la pagina y si llegaste a leer las secciones inferiores.' },
  { key: 'pausas_scroll', icon: '⏸️', label: 'Pausas de scroll', description: 'Detecta momentos de pausa durante la lectura para explicar analitica de atencion.' },
  { key: 'platform_user_agent', icon: '💻', label: 'Plataforma y navegador', description: 'El navegador revela sistema operativo, version y motor; combinado con otros datos puede diferenciar dispositivos.' },
  { key: 'language', icon: '🗣️', label: 'Idioma', description: 'El idioma del navegador permite analizar preferencias culturales y adaptar contenido.' },
  { key: 'screen_resolution', icon: '📺', label: 'Resolucion de pantalla', description: 'Ayuda a entender el tipo de dispositivo y tambien forma parte de una huella tecnica.' },
  { key: 'color_depth', icon: '🌈', label: 'Profundidad de color', description: 'Cantidad de bits de color soportados por la pantalla; es una senal tecnica del dispositivo.' },
  { key: 'timezone', icon: '🕒', label: 'Zona horaria', description: 'Permite inferir zona geografica aproximada y comparar horarios de uso.' },
  { key: 'cpu_cores', icon: '🧠', label: 'Nucleos de CPU', description: 'Cantidad de nucleos logicos reportados por el navegador; aporta contexto sobre el dispositivo.' },
  { key: 'device_memory', icon: '💾', label: 'Memoria del dispositivo', description: 'Memoria aproximada informada por el navegador; otra pista tecnica del equipo.' },
  { key: 'fingerprint', icon: '🔐', label: 'Huella digital', description: 'Identificador generado desde caracteristicas del navegador. Aqui lo mostramos con un nombre amable y anonimo.' },
  { key: 'timestamp', icon: '🗓️', label: 'Hora de la visita', description: 'Fecha y hora en que se registro la eleccion para ordenar el historial.' }
];

function random_name(fingerprint) {
  const adjetivos = ['Luminoso', 'Curioso', 'Saltarin', 'Tranquilo', 'Brillante', 'Oscuro', 'Veloz', 'Sereno', 'Magico', 'Amable', 'Audaz', 'Sutil', 'Elegante', 'Radiante', 'Misterioso', 'Divertido', 'Sabio', 'Dulce', 'Fresco', 'Vibrante'];
  const sustantivos = ['Zorro', 'Nube', 'Lince', 'Pez', 'Gato', 'Luna', 'Sol', 'Estrella', 'Mariposa', 'Colibri', 'Tigre', 'Delfin', 'Arbol', 'Piedra', 'Rio', 'Nube', 'Fenix', 'Dragon', 'Buho', 'Coral'];
  const value = String(fingerprint || 'sin-huella');
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }
  const idx1 = Math.abs(hash) % adjetivos.length;
  const idx2 = Math.abs(hash >> 8) % sustantivos.length;
  return `${adjetivos[idx1]} ${sustantivos[idx2]}`;
}

function normalizeHex(color) {
  if (!color) return '#cccccc';
  return color.startsWith('#') ? color.toUpperCase() : `#${color}`.toUpperCase();
}

function colorName(color) {
  const hex = normalizeHex(color);
  return COLOR_NAMES[hex] || hex;
}

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
  if (key === 'ip') return data.ip || data.currentIp || notAvailable;
  if (key === 'country_region') return `${data.country || 'Pais desconocido'} · ${data.region || 'Region no disponible'}`;
  if (key === 'tiempo_seleccion') {
    if (data.tiempo_seleccion === 'No consentido') return 'No consentido';
    const ms = Number(data.tiempo_seleccion);
    return Number.isFinite(ms) ? `${(ms / 1000).toFixed(2)} segundos` : notAvailable;
  }
  if (key === 'clics_erroneos') return data.clics_erroneos || 'No consentido';
  if (key === 'movimientos_mouse') {
    if (!data.movimientos_mouse || data.movimientos_mouse === 'No consentido') return 'No consentido';
    try {
      const parsed = JSON.parse(data.movimientos_mouse);
      return Array.isArray(parsed) ? `pasaste por ${new Set(parsed).size} zonas` : notAvailable;
    } catch (err) {
      return 'Patron no disponible';
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
  return data[key] || notAvailable;
}

function shortBrowser(userAgent) {
  if (!userAgent) return 'Navegador no disponible';
  if (userAgent.includes('Edg/')) return 'Edge';
  if (userAgent.includes('Chrome/')) return 'Chrome';
  if (userAgent.includes('Firefox/')) return 'Firefox';
  if (userAgent.includes('Safari/') && !userAgent.includes('Chrome/')) return 'Safari';
  return userAgent.slice(0, 42);
}

function fieldsFor(data) {
  if (hasTrackingConsent(data)) return DATA_FIELDS;
  return DATA_FIELDS.filter(field => ['color', 'country_region', 'timestamp'].includes(field.key));
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
        'platform_user_agent','screen_resolution','color_depth','timezone','cpu_cores','device_memory','language','fingerprint'
      ].includes(f.key))
    : fieldsFor(data).filter(f => ![
        'platform_user_agent','screen_resolution','color_depth','timezone','cpu_cores','device_memory','language','fingerprint'
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
    const response = await fetch(`/api/perfil/${id}`);
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
    saludo.textContent = `✨ Hola, ${nombre} ✨`;
    subtitulo.textContent = `Elegiste el color ${colorName(profile.color)} y así te vimos pasar por nuestra encuesta.`;
  } else {
    saludo.textContent = 'Todavía no elegiste tu color';
    subtitulo.textContent = '¡Te esperamos para descubrir tu huella digital!';
  }
}

async function initHuella() {
  const grid = document.getElementById('currentDataGrid');
  const empty = document.getElementById('emptyState');
  const notice = document.getElementById('limitedNotice');
  const fingerprintTitle = document.getElementById('currentFingerprintName');
  const techBtn = document.getElementById('toggleTech');
  const techDetails = document.getElementById('techDetails');

  try {
    const [profileResponse, timelineResponse] = await Promise.all([
      fetch('/api/mi-perfil'),
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
}

document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('detailModal').addEventListener('click', event => {
  if (event.target.id === 'detailModal') closeModal();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeModal();
});

initHuella();
