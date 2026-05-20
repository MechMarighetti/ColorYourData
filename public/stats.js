let chartColores = null;
let chartPaises = null;

document.addEventListener('DOMContentLoaded', async function() {
  const contentDiv = document.getElementById('content');

  try {
    const response = await fetch('/api/stats');
    
    if (!response.ok) {
      throw new Error('Error al cargar estadísticas');
    }

    const data = await response.json();
    
    // Verificar si hay datos reales (total_respuestas > 0 y al menos un color)
    if (!data.total_respuestas || data.total_respuestas === 0 || !data.colores || data.colores.length === 0) {
      contentDiv.innerHTML = `
        <div class="error">
          🎨 Aún no hay respuestas suficientes para mostrar estadísticas. ¡Sé el primero en participar!
        </div>
      `;
      return;
    }

    renderStats(data);
  } catch (err) {
    console.error('Error:', err);
    contentDiv.innerHTML = `
      <div class="error">
        ❌ Error al cargar las estadísticas. Intenta más tarde.
      </div>
    `;
  }
});

function renderStats(data) {
  const contentDiv = document.getElementById('content');
  
  // Limpiar contenido anterior
  contentDiv.innerHTML = '';
  
  // --- Sección de resumen (compatible con lo que realmente envía el backend) ---
  let html = '<div class="stats-summary">';
  
  // Total de respuestas (no de IPs únicas, pero puedes cambiar a unique_ips si prefieres)
  html += `
    <div class="stat-box">
      <h3>Total de Respuestas</h3>
      <div class="value">${data.total_respuestas}</div>
    </div>
  `;
  
  // Participantes únicos (IPs distintas)
  // Not provided in unified API by default; show placeholder
  html += `
    <div class="stat-box">
      <h3>Participantes Únicos</h3>
      <div class="value">--</div>
    </div>
  `;
  
  // Estas métricas NO existen en el backend actual.
  // Las dejamos con valor "Próximamente" o las eliminamos.
  // Por ahora las muestro como no disponibles.
  html += `
    <div class="stat-box">
      <h3>Tiempo Promedio</h3>
      <div class="value">--</div>
    </div>
  `;
  
  html += `
    <div class="stat-box">
      <h3>Cambios Promedio</h3>
      <div class="value">--</div>
    </div>
  `;
  
  html += `
    <div class="stat-box">
      <h3>Scroll Promedio</h3>
      <div class="value">--</div>
    </div>
  `;
  
  html += '</div>';
  
  // Gráfico de Colores (usando data.colores y .cantidad)
  html += '<h2>🎨 Distribución de Colores</h2>';
  html += '<div class="chart-container"><canvas id="chartColores"></canvas></div>';
  
  // Gráfico de Países (si hay datos)
  if (data.paises && data.paises.length > 0) {
    html += '<h2>🌍 Top Países</h2>';
    html += '<div class="chart-container"><canvas id="chartPaises"></canvas></div>';
  }
  
  contentDiv.innerHTML = html;
  
  // Renderizar gráficos con la estructura correcta
  renderChartColores(data.colores);
  if (data.paises && data.paises.length > 0) {
    renderChartPaises(data.paises);
  }
}

function renderChartColores(colores) {
  // colores es un array de objetos { color: string, count: number }
  if (chartColores) {
    chartColores.destroy();
  }

  const ctx = document.getElementById('chartColores');
  if (!ctx) return;

  const labels = colores.map(c => c.color || 'Desconocido');
  const data = colores.map(c => c.cantidad || 0);
  const backgroundColors = colores.map(c => c.color || '#cccccc');

  chartColores = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: backgroundColors,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: {
            font: { size: 12 },
            color: '#5d5d77',
            padding: 15
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((context.parsed / total) * 100);
              return `${context.parsed} votos (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

function renderChartPaises(paises) {
  // paises es un array de objetos { country: string, count: number }
  if (chartPaises) {
    chartPaises.destroy();
  }

  const ctx = document.getElementById('chartPaises');
  if (!ctx) return;

  // Tomar top 10 (aunque el backend ya limita a 8, por seguridad)
  const topPaises = paises.slice(0, 10);
  const labels = topPaises.map(p => p.country || 'Desconocido');
  const data = topPaises.map(p => p.cantidad || 0);

  chartPaises = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Número de Participantes',
        data: data,
        backgroundColor: 'rgba(255, 111, 145, 0.7)',
        borderColor: 'rgba(255, 111, 145, 1)',
        borderWidth: 2,
        borderRadius: 8
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            font: { size: 12 },
            color: '#5d5d77'
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.parsed.x} participantes`;
            }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            color: '#5d5d77',
            font: { size: 11 }
          }
        },
        y: {
          grid: {
            display: false
          },
          ticks: {
            color: '#5d5d77',
            font: { size: 11 }
          }
        }
      }
    }
  });
}