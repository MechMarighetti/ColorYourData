function openWarning(title, explanation) {
  document.getElementById('modal-content').innerHTML = `<p>${explanation}</p>`;
  document.querySelector('.modal-header h2').textContent = `⚠️ ${title}`;
  document.getElementById('warning-modal').style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.modal-close').addEventListener('click', () => {
    document.getElementById('warning-modal').style.display = 'none';
  });
  document.querySelector('.modal-btn').addEventListener('click', () => {
    document.getElementById('warning-modal').style.display = 'none';
  });
  document.getElementById('warning-modal').addEventListener('click', (e) => {
    if (e.target.id === 'warning-modal') document.getElementById('warning-modal').style.display = 'none';
  });
});

const timelineWarnings = {
  'IP de sesión': 'Tu dirección IP se recolecta automáticamente del lado del servidor y se usa para agrupar tus respuestas y obtener ubicación aproximada. Dato: <strong>ip</strong>',
  'Ubicación GPS': 'Si diste permiso, tu ubicación geográfica precisa (latitud/longitud) se almacena. Datos: <strong>latitude, longitude</strong>',
  'Timestamp': 'Se registra la fecha y hora exacta de cada elección. Dato: <strong>timestamp</strong>'
};

async function cargarTimeline() {
  const contenedor = document.getElementById('timeline');
  const info = document.getElementById('session-info');
  const ipGroup = document.getElementById('ip-group');

  let userLocation = 'Ubicación no disponible';
  if (navigator.geolocation) {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      });
      userLocation = `📍 Lat: ${position.coords.latitude.toFixed(4)}, Lon: ${position.coords.longitude.toFixed(4)}`;
    } catch (err) {
      console.log('Ubicación actual no disponible:', err);
    }
  }

  try {
    const response = await fetch('/timeline-data');
    if (!response.ok) {
      contenedor.innerHTML = '<p class="error">No se pudo cargar el historial.</p>';
      return;
    }

    const data = await response.json();
    info.innerHTML = `
      <div class="session-item">
        <span>🔒 IP de sesión: <strong>${data.currentIp}</strong></span>
        <span class="warning-icon-inline" data-warning="IP de sesión">⚠️</span>
      </div>
      <div class="session-item">
        <span>📍 Ubicación GPS: <strong>${userLocation}</strong></span>
        <span class="warning-icon-inline" data-warning="Ubicación GPS">⚠️</span>
      </div>
      <div class="session-item">
        <span>📝 Entradas registradas: <strong>${data.timeline.length}</strong></span>
        <span class="warning-icon-inline" data-warning="Timestamp">⚠️</span>
      </div>
    `;

    document.querySelectorAll('.warning-icon-inline').forEach(icon => {
      icon.addEventListener('click', () => {
        const title = icon.dataset.warning;
        if (timelineWarnings[title]) {
          openWarning(title, timelineWarnings[title]);
        }
      });
    });

    if (data.timeline.length === 0) {
      contenedor.innerHTML = '<p>No se encontraron elecciones para tu IP. Prueba a guardar un color primero.</p>';
    } else {
      contenedor.innerHTML = data.timeline.map((entry, index) => {
        const colorHex = entry.color.startsWith('#') ? entry.color : `#${entry.color}`;
        return `
          <div class="timeline-item" style="animation-delay: ${index * 0.2}s">
            <div class="timeline-dot" style="background-color: ${colorHex}; box-shadow: 0 0 20px ${colorHex}80;"></div>
            <div class="timeline-content">
              <div class="color-sample" style="background-color: ${colorHex};"></div>
              <div class="timeline-details">
                <strong>🎨 ${entry.color}</strong>
                <div class="timeline-date">⏰ ${new Date(entry.timestamp).toLocaleString()}</div>
                ${entry.latitude && entry.longitude ? `<div class="timeline-location">📍 ${entry.latitude}, ${entry.longitude}</div>` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    if (data.groupedByIp.length > 0) {
      ipGroup.innerHTML = '<h2>🌍 Tus sesiones agrupadas</h2>' + data.groupedByIp.map(group => {
        return `
          <div class="group-card">
            <div>🔐 <strong>IP:</strong> ${group.ip}</div>
            <div>📊 <strong>Registros:</strong> ${group.total}</div>
            <div>⏱️ <strong>Última vez:</strong> ${new Date(group.last_seen).toLocaleString()}</div>
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    contenedor.innerHTML = '<p class="error">Error al cargar los datos. Intenta nuevamente.</p>';
    console.error(err);
  }
}

cargarTimeline();
