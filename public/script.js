import { COLOR_OPTIONS, COLOR_NAMES, DATA_FIELDS } from './shared/utils.js';

let colorSeleccionado = null;
let consentimientoComportamiento = false;
let tiempoInicio = null;
let clicsErrarios = 0;
let maxScroll = 0;
let pausasScroll = 0;
let mousePattern = [];
let lastMouseCell = null;
let scrollTimeout = null;
let termsRead = false;

function createDataCard(field, value) {

  const card = el('div'); card.className = 'data-card';
  const title = el('div'); title.className = 'data-title'; title.textContent = field.emoji + ' ' + field.label;
  const desc = el('div'); desc.className = 'data-desc'; desc.textContent = field.desc;
  const val = el('div'); val.className = 'data-value'; val.textContent = (value !== undefined && value !== null && value !== '') ? value : 'No disponible';
  card.appendChild(title);
  card.appendChild(val);
  card.appendChild(desc);
  return card;

}

function renderColorOptions() {
  const palette = document.getElementById('paletaColores');
  if (!palette) return;

  palette.innerHTML = '';
  COLOR_OPTIONS.forEach(({ hex, name }) => {
    const card = document.createElement('div');
    card.className = 'color-card';
    card.dataset.color = hex;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Seleccionar color ${name}`);

    const sample = document.createElement('div');
    sample.className = 'color-muestra';
    sample.style.backgroundColor = hex;

    const info = document.createElement('div');
    info.className = 'color-info';

    const colorName = document.createElement('span');
    colorName.className = 'color-nombre';
    colorName.textContent = name;

    const percentage = document.createElement('span');
    percentage.className = 'color-porcentaje';
    percentage.textContent = '0% de los votos';

    info.appendChild(colorName);
    info.appendChild(percentage);
    card.appendChild(sample);
    card.appendChild(info);
    palette.appendChild(card);
  });
}

function crearFingerprint() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = '14px Arial';
  ctx.fillText('HuellaDigitalColor🍭', 4, 17);
  const dataURL = canvas.toDataURL();
  // Hash simple: suma de códigos de caracteres
  let hash = 0;
  for (let i = 0; i < dataURL.length; i++) {
    hash += dataURL.charCodeAt(i);
  }
  const fingerprint = hash.toString();
  localStorage.setItem('cyd_fingerprint', fingerprint);
  return fingerprint;
}

function compressMousePattern(pattern) {
  if (pattern.length === 0) return [];
  const compressed = [pattern[0]];
  for (let i = 1; i < pattern.length; i++) {
    if (pattern[i] !== pattern[i - 1]) {
      compressed.push(pattern[i]);
    }
  }
  return compressed;
}

function getMouseCell(event) {
  const rect = document.getElementById('encuesta').getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  if (x < 0 || y < 0 || x > rect.width || y > rect.height) return null;
  const col = Math.floor((x / rect.width) * 4);
  const row = Math.floor((y / rect.height) * 4);
  return row * 4 + col;
}

function getTermsReadStatus() {
  const leyo = document.getElementById('readTerms').addEventListener('click', () => {
    termsRead = true;
  })
  return termsRead ? 1 : 0;
}

async function recolectarDatos() {
  const data = {
    color: colorSeleccionado,
    user_agent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screen_resolution: `${screen.width}x${screen.height}`,
    color_depth: `${screen.colorDepth}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    cpu_cores: navigator.hardwareConcurrency,
    device_memory: navigator.deviceMemory || 'No disponible',
    fingerprint: crearFingerprint(),
    terms_read: getTermsReadStatus(),

  };

  // Obtener geolocalización
  if (navigator.geolocation) {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      data.latitude = position.coords.latitude.toString();
      data.longitude = position.coords.longitude.toString();
    } catch (err) {
      console.log('Geolocalización no disponible:', err);
      data.latitude = null;
      data.longitude = null;
    }
  } else {
    data.latitude = null;
    data.longitude = null;
  }

  // Datos de comportamiento si hay consentimiento
  if (consentimientoComportamiento) {
    const tiempoSeleccion = Date.now() - tiempoInicio;
    const cambios = clicsErrarios > 0 ? clicsErrarios - 1 : 0;
    const compressedPattern = compressMousePattern(mousePattern);
    data.tiempo_seleccion = tiempoSeleccion.toString();
    data.clics_erroneos = cambios.toString();
    data.movimientos_mouse = JSON.stringify(compressedPattern);
    data.porcentaje_scroll = Math.round(maxScroll).toString();
    data.pausas_scroll = pausasScroll.toString();
  }

  return data;
}

// Modal
document.getElementById('chkAcepto').addEventListener('change', function () {
  document.getElementById('btnIniciar').disabled = !this.checked;
});

document.getElementById('chkComportamiento').addEventListener('change', function () {
  consentimientoComportamiento = this.checked;
});

document.addEventListener('DOMContentLoaded', () => {
  // ... (asegurate de que fingerprintActual esté definido aquí) ...

  const termsLink = document.getElementById('readTerms');
  if (termsLink) {
    termsLink.addEventListener('click', async (e) => {
      // Marcar que leyó los términos (independientemente de la petición)
      termsRead = true;

      if (typeof fingerprintActual !== 'undefined' && fingerprintActual) {
        try {
          await fetch('/registrar-lectura', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fingerprint: fingerprintActual })
          });
        } catch (err) {
          console.warn('No se pudo registrar la lectura:', err);
        }
      }
    });
  }
});



document.getElementById('btnIniciar').addEventListener('click', function () {
  document.getElementById('modal').classList.add('is-hidden');
  document.getElementById('encuesta').classList.remove('is-hidden');

  // Inicializar tracking
  tiempoInicio = Date.now();
  clicsErrarios = 0;
  maxScroll = 0;
  pausasScroll = 0;
  mousePattern = [];
  lastMouseCell = null;



  if (consentimientoComportamiento) {
    // Listener para mouse
    document.addEventListener('mousemove', handleMouseMove);

    document.addEventListener('mouseover', function (e) {
      if (e.target.classList.contains('color-card')) {
        console.log('Hover en colores:', e.target.dataset.color);
      }
    });

    // Listener para scroll
    window.addEventListener('scroll', handleScroll);

    window.addEventListener("mouseleave", copyShareLink);
  }
});

// Colores
function actualizarBotonGuardar() {
  const boton = document.getElementById('btnGuardar');
  if (colorSeleccionado) {
    boton.disabled = false;
    boton.classList.add('visible');
  } else {
    boton.disabled = true;
    boton.classList.remove('visible');
  }
}

function seleccionarColor(card) {
  clicsErrarios++;
  colorSeleccionado = card.dataset.color;
  document.querySelectorAll('.color-card').forEach(opt => {
    if (opt !== card) {
      opt.classList.remove('selected');
    }
  });
  card.classList.add('selected');
  actualizarBotonGuardar();
}

function manejarTeclaColor(event) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    seleccionarColor(event.currentTarget);
  }
}

function bindColorOptions() {
  document.querySelectorAll('.color-card').forEach(card => {
    card.addEventListener('click', function () {
      seleccionarColor(this);
    });
    card.addEventListener('keydown', manejarTeclaColor);
  });
}

renderColorOptions();
bindColorOptions();

async function cargarPorcentajes() {
  try {
    const respuesta = await fetch('/api/stats');
    if (!respuesta.ok) return;
    const stats = await respuesta.json();
    const total = stats.total_respuestas || 0;
    const colores = stats.colores || [];
    const map = {};
    colores.forEach(c => { map[c.color.toUpperCase()] = c.cantidad; });
    document.querySelectorAll('.color-card').forEach(card => {
      const color = (card.dataset.color || '').toUpperCase();
      if (total > 0 && map[color] !== undefined) {
        const pct = Math.round((map[color] / total) * 100);
        card.querySelector('.color-porcentaje').textContent = `${pct}% de los votos`;
      }
    });
  } catch (error) {
    console.log('No se pudieron cargar porcentajes:', error);
  }
}

cargarPorcentajes();

// Guardar
document.getElementById('btnGuardar').addEventListener('click', async function () {
  // Detener listeners
  document.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('scroll', handleScroll);

  if (scrollTimeout) clearTimeout(scrollTimeout);

  const datos = await recolectarDatos();
  try {
    const response = await fetch('/guardar-color', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datos)
    });

    if (response.ok) {
      const result = await response.json();
      if (result.sessionId) {
        sessionStorage.setItem('sessionId', result.sessionId);
      }
      // Mostrar modal de compartir
      mostrarShareModal(datos.color);
      this.disabled = true;
    } else {
      alert('Error al guardar.');
    }
  } catch (err) {
    alert('Error de conexión.');
  }
});

function mostrarShareModal(colorHex) {
  const modal = document.getElementById('shareModal');
  const btnShare = document.getElementById('btnShareNow');
  const btnSkip = document.getElementById('btnShareSkip');
  const copiedMsg = document.getElementById('shareCopied');
  modal.classList.remove('is-hidden');
  copiedMsg.classList.add('is-hidden');

  // Mensaje personalizado con color
  let colorName = '';
  if (COLOR_OPTIONS !== 'undefined') {
    const found = COLOR_OPTIONS.find(c => c.hex.toUpperCase() === (colorHex || '').toUpperCase());
    colorName = found ? found.name : colorHex;
  } else {
    colorName = colorHex;
  }
  // Handler compartir
  btnShare.onclick = async function () {
    const shareData = {
      title: 'Mi color favorito',
      text: `Elegí el color ${colorName} en la encuesta de color. ¿Cuál elegís vos? 🎨`,
      url: window.location.origin + '/index.html'
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        modal.classList.add('is-hidden');
        mostrarMensajeFinal();
      } catch (err) {
        copiarAlPortapapeles(shareData.text + ' ' + shareData.url, copiedMsg);
      }
    } else {
      copiarAlPortapapeles(shareData.text + ' ' + shareData.url, copiedMsg);
    }
  };
  btnSkip.onclick = function () {
    modal.classList.add('is-hidden');
    mostrarMensajeFinal();
  };
}

function copiarAlPortapapeles(texto, copiedMsg) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(texto).then(() => {
      copiedMsg.classList.remove('is-hidden');
      setTimeout(() => copiedMsg.classList.add('is-hidden'), 2000);
    });
  } else {
    window.prompt('Copiá y compartí:', texto);
    copiedMsg.classList.remove('is-hidden');
    setTimeout(() => copiedMsg.classList.add('is-hidden'), 2000);
  }
}

function mostrarMensajeFinal() {
  const mensaje = document.getElementById('mensaje');
  mensaje.innerHTML = '🎉 ¡Gracias por participar! Tu color ha sido registrado. 🎨✨<br><a class="profile-link" href="huella.html">🔍 Ver mi huella digital</a>';
  mensaje.classList.remove('is-hidden');
}

function copyShareLink() {
  const shareUrl = window.location.href;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Enlace copiado. Pega el enlace para invitar a tus amigos.');
    });
  } else {
    prompt('Copia este enlace y compártelo:', shareUrl);
  }
}

document.getElementById('btnCompartir').addEventListener('click', async function () {
  const shareData = {
    title: 'Encuesta de Color Favorito',
    text: 'Elegí un color y descubre qué eligen tus amigos. ¡Comparte el enlace!',
    url: window.location.href
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
    } catch (err) {
      copyShareLink();
    }
  } else {
    copyShareLink();
  }
});

function handleMouseMove(event) {
  const cell = getMouseCell(event);
  if (cell !== null && cell !== lastMouseCell) {
    mousePattern.push(cell);
    lastMouseCell = cell;
  }
}

function handleScroll() {
  const scrollTop = window.scrollY;
  const docHeight = document.body.scrollHeight - window.innerHeight;
  const scrolled = (scrollTop / docHeight) * 100;
  if (scrolled > maxScroll) maxScroll = scrolled;

  // Reiniciar timeout para pausas
  if (scrollTimeout) clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    pausasScroll++;
  }, 1500);
}
