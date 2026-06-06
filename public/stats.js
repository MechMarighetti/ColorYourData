import { COLOR_OPTIONS, COLOR_NAMES, DATA_FIELDS, normalizeHex, colorName, hexToRgba } from './shared/utils.js';

const charts = [];


function numeric(value) {
  if (value === null || value === undefined || value === '' || value === 'No consentido') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function groupAverage(rows, groupKey, valueKey) {
  const groups = {};
  rows.forEach(row => {
    const value = numeric(row[valueKey]);
    if (value === null) return;
    const key = row[groupKey] || 'No disponible';
    if (!groups[key]) groups[key] = { total: 0, count: 0 };
    groups[key].total += value;
    groups[key].count += 1;
  });
  return Object.entries(groups)
    .map(([label, data]) => ({ label, value: Math.round(data.total / data.count) }))
    .sort((a, b) => b.value - a.value);
}

function countArray(items, labelKey, countKey = 'count') {
  return [...(items || [])]
    .map(item => ({ label: item[labelKey] || 'No disponible', value: item[countKey] || item.cantidad || 0 }))
    .sort((a, b) => b.value - a.value);
}

function renderSummary(statsData, apiStats) {
  const total = apiStats.total_respuestas || statsData.total || 0;
  const countries = new Set((statsData.responses || []).map(row => row.country).filter(Boolean)).size || (statsData.countries || []).length;
  const fingerprints = statsData.unique_fingerprints || new Set((statsData.responses || []).map(row => row.fingerprint).filter(Boolean)).size;
  const topColor = countArray(apiStats.colores || statsData.colors || [], 'color', 'cantidad')[0];
  const topColorHex = topColor ? normalizeHex(topColor.label) : '#cccccc';

  document.getElementById('summaryCards').innerHTML = `
    <article class="summary-tile"><span>Total de respuestas</span><strong>${total}</strong></article>
    <article class="summary-tile"><span>Paises unicos</span><strong>${countries}</strong></article>
    <article class="summary-tile"><span>Huellas unicas</span><strong>${fingerprints}</strong></article>
    <article class="summary-tile"><span>Color mas elegido</span><strong><span class="mini-color-dot" style="background:${topColorHex}"></span>${topColor ? colorName(topColorHex) : '--'}</strong></article>
  `;
}

function makeChart(canvasId, type, labels, data, options = {}) {
  const ctx = document.getElementById(canvasId);
  if (!ctx || typeof Chart === 'undefined') return;
  const chart = new Chart(ctx, {
    type,
    data: {
      labels,
      datasets: [{
        label: options.label || '',
        data,
        backgroundColor: options.colors || '#ff9bb5',
        borderColor: options.borderColor || 'rgba(255,255,255,0.75)',
        borderWidth: 2,
        borderRadius: type === 'bar' ? 8 : 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: options.indexAxis || 'x',
      plugins: {
        legend: { display: options.legend !== false },
        tooltip: {
          callbacks: {
            label: context => options.tooltip ? options.tooltip(context) : `${context.parsed.y ?? context.parsed.x ?? context.parsed} ${options.suffix || ''}`
          }
        }
      },
      scales: options.scales || undefined
    }
  });
  charts.push(chart);
}

function renderCharts(statsData) {
  const rows = statsData.responses || [];
  const colors = countArray(statsData.colors, 'color');
  const countries = countArray(statsData.countries, 'country').slice(0, 10);
  const platforms = countArray(statsData.platforms, 'platform').slice(0, 8);
  const languages = countArray(statsData.languages, 'language').slice(0, 8);
  const timeByPlatform = groupAverage(rows, 'platform', 'tiempo_seleccion').slice(0, 8);
  const clicksByLanguage = groupAverage(rows, 'language', 'clics_erroneos').slice(0, 8);
  const scrollByCountry = groupAverage(rows, 'country', 'porcentaje_scroll').slice(0, 8);
  const resolutionMemory = averageMemoryByResolution(rows).slice(0, 10);

  makeChart('colorsChart', 'bar', colors.map(item => colorName(item.label)), colors.map(item => item.value), {
    label: 'Votos',
    colors: colors.map(item => normalizeHex(item.label)),
    legend: false
  });
  makeChart('countriesChart', 'bar', countries.map(item => item.label), countries.map(item => item.value), {
    label: 'Respuestas',
    colors: '#a0e7e5',
    indexAxis: 'y',
    legend: false
  });
  makeChart('platformsChart', 'doughnut', platforms.map(item => item.label), platforms.map(item => item.value), {
    colors: ['#ffb3ba', '#bae1ff', '#b4f8c8', '#f9e79f', '#e8baff', '#ffc3a0', '#a0e7e5', '#f7cac9']
  });
  makeChart('languagesChart', 'bar', languages.map(item => item.label), languages.map(item => item.value), {
    colors: '#d7bde2',
    legend: false
  });
  makeChart('timePlatformChart', 'bar', timeByPlatform.map(item => item.label), timeByPlatform.map(item => Math.round(item.value / 1000)), {
    label: 'Segundos',
    colors: '#ffdfba',
    legend: false,
    suffix: 's'
  });
  makeChart('clickLanguageChart', 'bar', clicksByLanguage.map(item => item.label), clicksByLanguage.map(item => item.value), {
    label: 'Clics promedio',
    colors: '#ff6f91',
    legend: false
  });
  makeChart('scrollCountryChart', 'bar', scrollByCountry.map(item => item.label), scrollByCountry.map(item => item.value), {
    label: 'Scroll promedio',
    colors: '#76d7c4',
    indexAxis: 'y',
    legend: false,
    suffix: '%'
  });
  makeChart('memoryResolutionChart', 'bar', resolutionMemory.map(item => item.label), resolutionMemory.map(item => item.value), {
    label: 'Memoria promedio GB',
    colors: '#bae1ff',
    legend: false
  });
}

function averageMemoryByResolution(rows) {
  const groups = {};
  rows.forEach(row => {
    const memory = numeric(row.device_memory);
    if (memory === null || !row.screen_resolution) return;
    if (!groups[row.screen_resolution]) groups[row.screen_resolution] = { total: 0, count: 0 };
    groups[row.screen_resolution].total += memory;
    groups[row.screen_resolution].count += 1;
  });
  return Object.entries(groups)
    .map(([label, data]) => ({ label, value: Number((data.total / data.count).toFixed(1)) }))
    .sort((a, b) => b.value - a.value);
}

function renderTimezoneHeatmap(rows) {
  const colors = [...new Set(rows.map(row => normalizeHex(row.color)).filter(Boolean))].slice(0, 12);
  const zones = [...new Set(rows.map(row => row.timezone || 'No disponible'))].slice(0, 8);
  const counts = {};
  rows.forEach(row => {
    const color = normalizeHex(row.color);
    const zone = row.timezone || 'No disponible';
    counts[`${color}|${zone}`] = (counts[`${color}|${zone}`] || 0) + 1;
  });
  const max = Math.max(1, ...Object.values(counts));
  const table = `
    <table class="data-table heat-table">
      <thead><tr><th>Color</th>${zones.map(zone => `<th>${zone}</th>`).join('')}</tr></thead>
      <tbody>
        ${colors.map(color => `
          <tr>
            <th><span class="mini-color-dot" style="background:${color}"></span>${colorName(color)}</th>
            ${zones.map(zone => {
              const value = counts[`${color}|${zone}`] || 0;
              const opacity = value ? 0.18 + (value / max) * 0.72 : 0.05;
              return `<td style="background:rgba(255,111,145,${opacity})">${value || ''}</td>`;
            }).join('')}
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  document.getElementById('timezoneHeatmap').innerHTML = rows.length ? table : '<div class="empty-message">Aun no hay datos suficientes.</div>';
}


async function initStats() {
  try {
    const [statsResponse, apiResponse] = await Promise.all([
      fetch('/stats-data'),
      fetch('/api/stats')
    ]);
    if (!statsResponse.ok) throw new Error('No se pudo cargar /stats-data');
    const statsData = await statsResponse.json();
    const apiStats = apiResponse.ok ? await apiResponse.json() : {};
    const rows = statsData.responses || [];

    renderSummary(statsData, apiStats);
    renderCharts(statsData);
    renderTimezoneHeatmap(rows);
  } catch (err) {
    document.querySelector('.stats-dashboard').insertAdjacentHTML('beforeend', '<div class="error">No pudimos cargar las estadisticas. Revisa el servidor y la conexion con Supabase.</div>');
  }
}

initStats();
