async function cargarTimeline() {
  const contenedor = document.getElementById('timeline');
  const info = document.getElementById('session-info');
  const ipGroup = document.getElementById('ip-group');

  // Obtener ubicación actual
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
      <p><strong>IP de tu sesión:</strong> ${data.currentIp}</p>
      <p><strong>Ubicación actual:</strong> ${userLocation}</p>
      <p><strong>Entradas registradas para tu IP:</strong> ${data.timeline.length}</p>
    `;

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
                <strong>${entry.color}</strong>
                <div class="timeline-date">${new Date(entry.timestamp).toLocaleString()}</div>
                ${entry.latitude && entry.longitude ? `<div class="timeline-location">📍 ${entry.latitude}, ${entry.longitude}</div>` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    if (data.groupedByIp.length > 0) {
      ipGroup.innerHTML = '<h2>🌍 Sesiones agrupadas por IP</h2>' + data.groupedByIp.map(group => {
        return `
          <div class="group-card">
            <div><strong>IP:</strong> ${group.ip}</div>
            <div><strong>Registros:</strong> ${group.total}</div>
            <div><strong>Última vez:</strong> ${new Date(group.last_seen).toLocaleString()}</div>
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
