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

const warnings = {
  'Colores preferidos': 'Se recolecta el color que cada usuario selecciona. Este es el dato principal de la encuesta. Nombre de dato: <strong>color</strong>',
  'Países de origen': 'Se obtiene la geolocalización aproximada del país a partir de tu IP usando ip-api.com. Nombre de dato: <strong>country</strong>',
  'Regiones/ciudades': 'Se extrae la región o ciudad a partir del análisis de IP. Nombre de dato: <strong>region</strong>',
  'Navegadores y plataformas': 'Se recolecta el User-Agent del navegador que revela el tipo de navegador, versión y SO. Nombre de dato: <strong>platform</strong>',
  'Idiomas del navegador': 'Se recolecta el idioma configurado en el navegador del usuario. Nombre de dato: <strong>language</strong>',
  'Resoluciones de pantalla': 'Se guarda el ancho x alto de tu pantalla. Nombre de dato: <strong>screen_resolution</strong>',
  'Zonas horarias': 'Se recolecta la zona horaria del navegador. Nombre de dato: <strong>timezone</strong>'
};

function renderStatBlock(title, items, total, color, emoji = '📌') {
  return `
    <div class="stat-block stat-block-warning" data-warning="${title}">
      <div class="stat-block-header">
        <div>
          <h3>${emoji} ${title}</h3>
          <div class="warning-icon" title="Saber qué datos se recolectan">⚠️</div>
        </div>
      </div>
      <div class="stat-list">
        ${items.map(item => {
          const percent = total ? Math.round((item.count / total) * 100) : 0;
          const colorPreview = item.name && item.name.startsWith('#') ? item.name : '';
          return `
            <div class="stat-row">
              <div class="stat-label">
                ${colorPreview ? `<span class="color-dot" style="background-color: ${colorPreview};"></span>` : ''}
                ${item.name || 'Sin dato'}
              </div>
              <div class="stat-bar-wrapper">
                <div class="stat-bar" style="width: ${percent}%; background: ${color};"></div>
              </div>
              <div class="stat-value">${item.count} (${percent}%)</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

async function cargarStats() {
  const panel = document.getElementById('stats-panels');
  const summary = document.getElementById('stats-summary');

  try {
    const response = await fetch('/stats-data');
    if (!response.ok) {
      panel.innerHTML = '<p class="error">No se pudieron cargar las estadísticas.</p>';
      return;
    }

    const data = await response.json();
    summary.innerHTML = `
      <div class="summary-card">
        <div class="summary-item">💬 <strong>Total de respuestas:</strong> ${data.total}</div>
        <div class="summary-item">👥 <strong>IPs distintas:</strong> ${data.unique_ips}</div>
      </div>
      <div class="summary-visual">
        <div class="visual-bar">
          <div class="visual-bar-fill" style="width: ${Math.min((data.total / 100) * 10, 100)}%;"></div>
        </div>
      </div>
    `;

    const colorItems = data.colors.map(row => ({ name: row.color, count: row.count }));
    const countryItems = data.countries.map(row => ({ name: row.country, count: row.count }));
    const regionItems = data.regions.map(row => ({ name: row.region, count: row.count }));
    const platformItems = data.platforms.map(row => ({ name: row.platform, count: row.count }));
    const languageItems = data.languages.map(row => ({ name: row.language, count: row.count }));
    const resolutionItems = data.resolutions.map(row => ({ name: row.screen_resolution, count: row.count }));
    const timezoneItems = data.timezones.map(row => ({ name: row.timezone, count: row.count }));

    panel.innerHTML = `
      ${renderStatBlock('Colores preferidos', colorItems, data.total, '#ff6f91', '🎨')}
      ${renderStatBlock('Países de origen', countryItems, data.total, '#7b5cff', '🌍')}
      ${renderStatBlock('Regiones/ciudades', regionItems, data.total, '#59c3d1', '🏙️')}
      ${renderStatBlock('Navegadores y plataformas', platformItems, data.total, '#ffb347', '🖥️')}
      ${renderStatBlock('Idiomas del navegador', languageItems, data.total, '#a07eff', '🗣️')}
      ${renderStatBlock('Resoluciones de pantalla', resolutionItems, data.total, '#6acb8f', '📱')}
      ${renderStatBlock('Zonas horarias', timezoneItems, data.total, '#f9d56e', '⏰')}
    `;

    document.querySelectorAll('.stat-block-warning').forEach(block => {
      const title = block.dataset.warning;
      const warningIcon = block.querySelector('.warning-icon');
      if (warningIcon && warnings[title]) {
        warningIcon.addEventListener('click', () => {
          openWarning(title, warnings[title]);
        });
      }
    });
  } catch (err) {
    panel.innerHTML = '<p class="error">Error al cargar las estadísticas.</p>';
    console.error(err);
  }
}

cargarStats();