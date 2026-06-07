import { COLOR_OPTIONS, COLOR_NAMES, DATA_FIELDS, normalizeHex, colorName, hexToRgba } from './shared/utils.js';
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
    // { key: 'ip', label: 'IP' },        // Oculto por privacidad
    { key: 'country', label: 'País' },
    { key: 'region', label: 'Región' },
    { key: 'language', label: 'Idioma' },
    // { key: 'latitude', label: 'Latitud' },
    // { key: 'longitude', label: 'Longitud' },
    { key: 'user_agent', label: 'User Agent' },
    { key: 'platform', label: 'Plataforma' },
    { key: 'screen_resolution', label: 'Resolución' },
    { key: 'color_depth', label: 'Prof. color' },
    { key: 'timezone', label: 'Zona horaria' },
    { key: 'cpu_cores', label: 'CPU cores' },
    { key: 'device_memory', label: 'Memoria' },
    // { key: 'fingerprint', label: 'Fingerprint' }, // Oculto
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

  // Inyectar estilos para los puntos de color y el resaltado de fila
  const style = document.createElement('style');
  style.textContent = `
    .mini-color-dot {
      display: inline-block;
      width: 0.85rem;
      height: 0.85rem;
      border-radius: 50%;
      margin-right: 0.35rem;
      vertical-align: middle;
    }
    .color-row-highlight {
      transition: background-color 0.2s ease;
    }
  `;
  document.head.appendChild(style);

  const PAGE_SIZE = 10;
  let currentPage = 1;
  let currentRows = [];
  let allRows = [];

  try {
    const res = await fetch('/api/transparencia');
    if (!res.ok) throw new Error('Error al obtener datos');
    const data = await res.json();
    allRows = Array.isArray(data) ? data : [];
    currentRows = allRows;
    renderTable(tbody, columnDefs);
    renderPagination();
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `<tr><td colspan="${columnDefs.length}" style="text-align:center; padding:2rem;">⚠️ No se pudieron cargar los datos.</td></tr>`;
  }

  // Filtro en vivo
  filterInput.addEventListener('input', () => {
    const term = filterInput.value.toLowerCase().trim();
    currentRows = term
      ? allRows.filter(row =>
          columnDefs.some(col => {
            const val = row[col.key];
            return val != null && String(val).toLowerCase().includes(term);
          })
        )
      : allRows;
    currentPage = 1;
    renderTable(tbody, columnDefs);
    renderPagination();
  });

  function renderPagination() {
    const paginationEl = document.getElementById('pagination');
    const totalPages = Math.ceil(currentRows.length / PAGE_SIZE);

    if (totalPages <= 1) {
      paginationEl.innerHTML = '';
      return;
    }

    const makeBtn = (page, label, disabled, active) =>
      `<button class="page-btn${active ? ' active' : ''}" data-page="${page}" ${disabled ? 'disabled' : ''}>${label}</button>`;

    let html = '<div class="pagination">';
    html += makeBtn(currentPage - 1, '‹', currentPage === 1, false);

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        html += makeBtn(i, i, false, i === currentPage);
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        html += `<span class="page-ellipsis">…</span>`;
      }
    }

    html += makeBtn(currentPage + 1, '›', currentPage === totalPages, false);
    html += '</div>';

    paginationEl.innerHTML = html;
    paginationEl.querySelectorAll('.page-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        currentPage = parseInt(btn.dataset.page);
        renderTable(tbody, columnDefs);
        renderPagination();
        document.querySelector('.table-wrapper').scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  // Función para renderizar la tabla con el fondo de color por fila
  function renderTable(container, colDefs) {
    if (!currentRows.length) {
      container.innerHTML = `<tr><td colspan="${colDefs.length}" style="text-align:center; padding:2rem;">✨ No hay datos que coincidan con el filtro</td></tr>`;
      return;
    }

    const start = (currentPage - 1) * PAGE_SIZE;
    const rows = currentRows.slice(start, start + PAGE_SIZE);

    const htmlRows = rows.map(row => {
      // Obtener el color de la respuesta (ej: '#ff0000', 'rojo', etc.)
      const rawColor = row.color || '';
      // Normalizar a hex (usamos función auxiliar, ver abajo)
      const hexColor = normalizeHex(rawColor);
      // Color de fondo de la fila con transparencia (15% de opacidad)
      const bgColor = hexColor ? hexToRgba(hexColor, 0.15) : '';

      return `
        <tr class="color-row-highlight" style="${bgColor ? `background-color: ${bgColor};` : ''}">
          ${colDefs.map(col => {
            let value = row[col.key] ?? '—';

            // Celda especial para el color: muestra un círculo + el nombre o hex legible
            if (col.key === 'color') {
              const displayName = colorName(hexColor) || hexColor;
              value = `<span class="mini-color-dot" style="background: ${hexColor};"></span>${displayName}`;
            }

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
            if (col.key === 'timestamp') {
              value = timeAgo(value);
            }

            // Escapar HTML para evitar inyecciones
            value = escapeHtml(String(value));
            return `<td>${value}</td>`;
          }).join('')}
        </tr>
      `;
    }).join('');

    container.innerHTML = htmlRows;
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
});