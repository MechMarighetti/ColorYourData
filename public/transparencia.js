document.addEventListener('DOMContentLoaded', async () => {
  const table = document.getElementById('termsTable');
  const thead = table.querySelector('thead');
  const tbody = table.querySelector('tbody');
  const filterInput = document.getElementById('filter');

  // Todas las columnas de la tabla respuestas (deben coincidir con las del backend)
  const columnDefs = [
    { key: 'id', label: 'ID' },
    { key: 'fingerprint_name', label: 'Nombre' },
    { key: 'color', label: 'Color' },
    /* { key: 'ip', label: 'IP' }, */
    { key: 'country', label: 'País' },
    { key: 'region', label: 'Región' },
    /* { key: 'latitude', label: 'Latitud' },
    { key: 'longitude', label: 'Longitud' }, */
    { key: 'user_agent', label: 'User Agent' },
    { key: 'platform', label: 'Plataforma' },
    { key: 'language', label: 'Idioma' },
    { key: 'screen_resolution', label: 'Resolución' },
    { key: 'color_depth', label: 'Prof. color' },
    { key: 'timezone', label: 'Zona horaria' },
    { key: 'cpu_cores', label: 'CPU cores' },
    { key: 'device_memory', label: 'Memoria' },
  /*   { key: 'fingerprint', label: 'Fingerprint' }, */
    { key: 'tiempo_seleccion', label: 'Tiempo (s)' },
    { key: 'clics_erroneos', label: 'Clics erróneos' },
    { key: 'movimientos_mouse', label: 'Mov. mouse' },
    { key: 'porcentaje_scroll', label: 'Scroll %' },
    { key: 'pausas_scroll', label: 'Pausas scroll' },
    { key: 'terms_read', label: 'Leyó términos?' },
    { key: 'timestamp', label: 'Fecha' }
  ];

  // Construir encabezados dinámicamente
  thead.innerHTML = `
    <tr>
      ${columnDefs.map(col => `<th>${col.label}</th>`).join('')}
    </tr>
  `;

  let allRows = [];

  try {
    const res = await fetch('/api/transparencia');
    if (!res.ok) throw new Error('Error al obtener datos');
    const data = await res.json();
    // Esperamos un array de objetos (cada objeto es una fila de respuestas)
    allRows = Array.isArray(data) ? data : [];
    renderTable(allRows, tbody, columnDefs);
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="${columnDefs.length}" style="text-align:center; padding:2rem;">⚠️ No se pudieron cargar los datos.</td></tr>`;
  }

  // Filtro en vivo
  filterInput.addEventListener('input', () => {
    const term = filterInput.value.toLowerCase().trim();
    const filtered = term
      ? allRows.filter(row =>
          columnDefs.some(col => {
            const val = row[col.key];
            return val != null && String(val).toLowerCase().includes(term);
          })
        )
      : allRows;
    renderTable(filtered, tbody, columnDefs);
  });
});

function renderTable(rows, tbody, columnDefs) {
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="${columnDefs.length}" style="text-align:center; padding:2rem;">No se encontraron registros.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(row => {
    return `
      <tr>
        ${columnDefs.map(col => {
          let value = row[col.key] ?? '';

          // Formateos específicos
          if (col.key === 'tiempo_seleccion' && value !== 'No consentido' && !isNaN(value)) {
            value = parseFloat(value).toFixed(1) + 's';
          }
          if (col.key === 'porcentaje_scroll' && value !== 'No consentido') {
            value = value + '%';
          }
          if (col.key === 'terms_read') {
            value = value == 1 ? '✅ Sí' : '❌ No';
          }
          /* if (col.key === 'fingerprint') {
            value = `<span title="${escapeHtml(row.fingerprint || '')}">${truncate(value, 10)}</span>`;
          } */
          if (col.key === 'timestamp') {
            value = timeAgo(value);
          }

          return `<td>${value}</td>`;
        }).join('')}
      </tr>
    `;
  }).join('');
}

// Funciones auxiliares
function truncate(str, max) {
  if (!str) return '—';
  return str.length > max ? str.substring(0, max) + '…' : str;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function timeAgo(timestamp) {
  if (!timestamp) return '—';
  const now = new Date();
  const past = new Date(timestamp);
  const seconds = Math.floor((now - past) / 1000);
  if (seconds < 60) return 'ahora';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `hace ${months}M`;
  const years = Math.floor(months / 12);
  return `hace ${years}a`;
}