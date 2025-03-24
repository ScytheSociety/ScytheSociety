/**
 * hellgame-pvp.js
 * Módulo para gestionar la sección de PVP en las estadísticas de HellGame
 */

// Namespace para HellGame
var HellGame = HellGame || {};

// Módulo de PVP
HellGame.PVP = (function () {
  // Datos de PVP
  let pvpData = {};

  // Elemento contenedor
  let container = null;

  // Referencia al gráfico
  let pvpBalanceChart = null;

  // Inicialización del módulo
  function init(data) {
    console.log("Inicializando módulo de PVP...");
    pvpData = data;
    container = document.getElementById("pvp-container");

    if (!container) {
      console.error("No se encontró el contenedor de PVP");
      return;
    }

    renderizarSeccionPVP();
  }

  // Renderizar la sección de PVP
  function renderizarSeccionPVP() {
    const topVictorias = pvpData.pvp.top_victorias || {};
    const topDerrotas = pvpData.pvp.top_derrotas || {};

    let pvpHTML = `
      <div class="row">
        <div class="col-md-6">
          <div class="card border-success mb-4 shadow-sm">
            <div class="card-header bg-success text-white">
              <h4 class="mb-0"><i class="fas fa-medal me-2"></i>Top Victorias PVP</h4>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>#</th>
                      <th>Usuario</th>
                      <th>Victorias</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${Object.entries(topVictorias)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(
                        ([usuario, victorias], index) => `
                        <tr>
                          <td>${index + 1}</td>
                          <td>
                            <div class="d-flex align-items-center">
                              <span class="avatar-text bg-success me-2">${usuario
                                .charAt(0)
                                .toUpperCase()}</span>
                              ${usuario}
                            </div>
                          </td>
                          <td><span class="badge bg-success">${victorias}</span></td>
                        </tr>
                      `
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div class="card border-primary mb-4 shadow-sm">
            <div class="card-header bg-primary text-white">
              <h4 class="mb-0"><i class="fas fa-chart-pie me-2"></i>Balance de Victorias/Derrotas</h4>
            </div>
            <div class="card-body">
              <canvas id="pvpBalanceChart" height="250"></canvas>
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="card border-danger mb-4 shadow-sm">
            <div class="card-header bg-danger text-white">
              <h4 class="mb-0"><i class="fas fa-thumbs-down me-2"></i>Top Derrotas PVP</h4>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>#</th>
                      <th>Usuario</th>
                      <th>Derrotas</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${Object.entries(topDerrotas)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(
                        ([usuario, derrotas], index) => `
                        <tr>
                          <td>${index + 1}</td>
                          <td>
                            <div class="d-flex align-items-center">
                              <span class="avatar-text bg-danger me-2">${usuario
                                .charAt(0)
                                .toUpperCase()}</span>
                              ${usuario}
                            </div>
                          </td>
                          <td><span class="badge bg-danger">${derrotas}</span></td>
                        </tr>
                      `
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div class="card border-info mb-4 shadow-sm">
            <div class="card-header bg-info text-white">
              <h4 class="mb-0"><i class="fas fa-info-circle me-2"></i>Información PVP</h4>
            </div>
            <div class="card-body">
              <div class="info-item">
                <i class="fas fa-trophy text-success me-2"></i>
                <span>Ganar 3 PVP consecutivos: Acceso a !hellfusion</span>
              </div>
              <div class="info-item mt-2">
                <i class="fas fa-skull text-danger me-2"></i>
                <span>Perder 3 PVP consecutivos: Acceso a !hellrevenge</span>
              </div>
              <div class="info-item mt-2">
                <i class="fas fa-clock text-warning me-2"></i>
                <span>Cooldown de PVP: 6 horas entre usos</span>
              </div>
              <div class="info-item mt-3">
                <i class="fas fa-gamepad text-primary me-2"></i>
                <span>Comando: !hellpvp @usuario</span>
              </div>
              <div class="info-item mt-2">
                <i class="fas fa-random text-primary me-2"></i>
                <span>50% de probabilidad de victoria para ambos jugadores</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = pvpHTML;

    // Inicializar gráfico
    setTimeout(() => {
      inicializarGraficoPVP();
    }, 100);
  }

  // Inicializar gráfico de balance PVP
  function inicializarGraficoPVP() {
    const ctx = document.getElementById("pvpBalanceChart");
    if (!ctx) return;

    // Obtener datos para el gráfico
    const topVictorias = pvpData.pvp.top_victorias || {};
    const topDerrotas = pvpData.pvp.top_derrotas || {};

    // Combinar usuarios para mostrar balance
    const usuariosUnicos = new Set([
      ...Object.keys(topVictorias),
      ...Object.keys(topDerrotas),
    ]);

    const labels = [];
    const dataVictorias = [];
    const dataDerrotas = [];

    // Limitar a los 5 usuarios con más actividad combinada
    const usuariosConActividad = Array.from(usuariosUnicos)
      .map((usuario) => {
        const victorias = topVictorias[usuario] || 0;
        const derrotas = topDerrotas[usuario] || 0;
        return {
          usuario,
          victorias,
          derrotas,
          total: victorias + derrotas,
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Preparar datos para el gráfico
    usuariosConActividad.forEach((item) => {
      labels.push(item.usuario);
      dataVictorias.push(item.victorias);
      dataDerrotas.push(item.derrotas);
    });

    // Si ya existe un gráfico, destruirlo
    if (pvpBalanceChart) {
      pvpBalanceChart.destroy();
    }

    // Crear nuevo gráfico
    pvpBalanceChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Victorias",
            data: dataVictorias,
            backgroundColor: "rgba(40, 167, 69, 0.8)",
            borderColor: "rgb(40, 167, 69)",
            borderWidth: 1,
          },
          {
            label: "Derrotas",
            data: dataDerrotas,
            backgroundColor: "rgba(220, 53, 69, 0.8)",
            borderColor: "rgb(220, 53, 69)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            mode: "index",
            intersect: false,
          },
          legend: {
            position: "top",
          },
        },
        scales: {
          x: {
            stacked: false,
            title: {
              display: true,
              text: "Usuarios",
            },
          },
          y: {
            stacked: false,
            beginAtZero: true,
            title: {
              display: true,
              text: "Cantidad",
            },
            ticks: {
              precision: 0,
            },
          },
        },
      },
    });
  }

  // Extraer datos detallados de un usuario específico
  function obtenerDetallesUsuario(userId) {
    // Aquí implementarías una llamada API para obtener más detalles
    // o procesarías datos ya cargados
    return {
      userId: userId,
      batallas: [],
      // Más datos según necesites
    };
  }

  // Retorno público del módulo
  return {
    init: init,
    obtenerDetallesUsuario: obtenerDetallesUsuario,
  };
})();
