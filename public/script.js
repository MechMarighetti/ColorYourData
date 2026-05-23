let colorSeleccionado = null;
let consentimientoComportamiento = false;
let tiempoInicio = null;
let clicsErrarios = 0;
let maxScroll = 0;
let pausasScroll = 0;
let mousePattern = [];
let lastMouseCell = null;
let scrollTimeout = null;

const COLOR_OPTIONS = [
  { hex: '#FFB3BA', name: 'Rosa Caramelo' },
  { hex: '#FFDFBA', name: 'Durazno Dulce' },
  { hex: '#FFFFBA', name: 'Amarillo Mantequilla' },
  { hex: '#BAFFC9', name: 'Menta Suave' },
  { hex: '#BAE1FF', name: 'Azul Cielo' },
  { hex: '#E8BAFF', name: 'Lila Magico' },
  { hex: '#FFC3A0', name: 'Salmon Rosado' },
  { hex: '#A0E7E5', name: 'Turquesa Claro' },
  { hex: '#F5E1FD', name: 'Lavanda Bebe' },
  { hex: '#B4F8C8', name: 'Verde Primavera' },
  { hex: '#F9F871', name: 'Amarillo Sol' },
  { hex: '#FF6F91', name: 'Fucsia Suave' },
  { hex: '#FFD1DC', name: 'Crema de Fresa' },
  { hex: '#E6E6FA', name: 'Perla Lavanda' },
  { hex: '#F7DC6F', name: 'Melon Suave' },
  { hex: '#F0B27A', name: 'Coral Claro' },
  { hex: '#76D7C4', name: 'Aqua Fresco' },
  { hex: '#F7CAC9', name: 'Rosa Cuarzo' },
  { hex: '#D7BDE2', name: 'Lila Grisaceo' },
  { hex: '#A3E4D7', name: 'Verde Agua' },
  { hex: '#F9E79F', name: 'Amarillo Pastel' },
  { hex: '#FAD7A1', name: 'Naranja Suave' },
  { hex: '#F5E6CC', name: 'Vainilla' },
  { hex: '#F2D7D5', name: 'Rosa Viejo' },
  { hex: '#D4E6F1', name: 'Cielo Anochecer' },
  { hex: '#A8E6CF', name: 'Menta Helada' },
  { hex: '#FDEBD0', name: 'Champan' }
];

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
  return hash.toString();
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
    fingerprint: crearFingerprint()
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
document.getElementById('chkAcepto').addEventListener('change', function() {
  document.getElementById('btnIniciar').disabled = !this.checked;
});

document.getElementById('chkComportamiento').addEventListener('change', function() {
  consentimientoComportamiento = this.checked;
});

document.getElementById('btnIniciar').addEventListener('click', function() {
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
  document.querySelectorAll('.color-card').forEach(opt => opt.classList.remove('selected'));
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
    card.addEventListener('click', function() {
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
document.getElementById('btnGuardar').addEventListener('click', async function() {
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
      document.getElementById('mensaje').innerHTML = '🎉 ¡Gracias por participar! Tu color ha sido registrado. 🎨✨<br><a class="profile-link" href="perfil.html">🔍 Ver mi huella digital</a>';
      document.getElementById('mensaje').classList.remove('is-hidden');
      document.getElementById('btnCompartir').classList.remove('is-hidden');
      this.disabled = true;
    } else {
      alert('Error al guardar.');
    }
  } catch (err) {
    alert('Error de conexión.');
  }
});

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

document.getElementById('btnCompartir').addEventListener('click', async function() {
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
