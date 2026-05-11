let colorSeleccionado = null;

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

  return data;
}

// Modal
document.getElementById('chkAcepto').addEventListener('change', function() {
  document.getElementById('btnIniciar').disabled = !this.checked;
});

document.getElementById('btnIniciar').addEventListener('click', function() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('encuesta').style.display = 'block';
});

// Colores
document.querySelectorAll('.color-option').forEach(option => {
  option.addEventListener('click', function() {
    colorSeleccionado = this.dataset.color;
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
    this.classList.add('selected');
    document.getElementById('btnGuardar').disabled = false;
  });
});

// Guardar
document.getElementById('btnGuardar').addEventListener('click', async function() {
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
      document.getElementById('mensaje').textContent = '🎉 ¡Gracias por participar! Tu color ha sido registrado. 🎨✨';
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