let colorSeleccionado = null;
let consentimientoComportamiento = false;
let tiempoInicio = null;
let clicsErrarios = 0;
let maxScroll = 0;
let pausasScroll = 0;
let mousePattern = [];
let lastMouseCell = null;
let scrollTimeout = null;

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
  document.getElementById('modal').style.display = 'none';
  document.getElementById('encuesta').style.display = 'block';
  
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
  }
});

// Colores
function actualizarBotonGuardar() {
  const boton = document.getElementById('btnGuardar');
  if (colorSeleccionado) {
    boton.disabled = false;
    boton.style.display = 'block';
    boton.classList.add('visible');
  } else {
    boton.disabled = true;
    boton.style.display = 'none';
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

document.querySelectorAll('.color-card').forEach(card => {
  card.addEventListener('click', function() {
    seleccionarColor(this);
  });
  card.addEventListener('keydown', manejarTeclaColor);
});

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
      document.getElementById('mensaje').innerHTML = '🎉 ¡Gracias por participar! Tu color ha sido registrado. 🎨✨<br><a href="perfil.html" style="color: #6a5acd; font-weight: 600; text-decoration: none;">🔍 Ver mi huella digital</a>';
      document.getElementById('mensaje').style.display = 'block';
      document.getElementById('btnCompartir').style.display = 'inline-block';
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