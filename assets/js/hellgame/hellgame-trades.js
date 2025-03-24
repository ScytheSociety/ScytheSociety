/**
 * hellgame-trades.js
 * Módulo para gestionar la sección de intercambios (trades) en las estadísticas de HellGame
 */

// Namespace para HellGame
var HellGame = HellGame || {};

// Módulo de Trades
HellGame.Trades = (function () {
  // Datos de trades
  let tradesData = {};

  // Datos históricos de trades
  let historialTrades = [];

  // Elemento contenedor
  let container = null;

  // Referencia al gráfico
  let tradesTimelineChart = null;

  // Inicialización del módulo
  function init(data) {
    console.log("Inicializando módulo de Trades...");
    tradesData = data;
    container = document.getElementById("trades-container");

    if (!container) {
      console.error("No se encontró el contenedor de trades");
      return;
    }

    renderizarSeccionTrades();
  }

  // Renderizar la sección de trades
  function renderizarSeccionTrades() {
    const ultimosTrades = tradesData.trades.ultimos_trades || [];

    let tradesHTML = `
      <div class="row">
        <div class="col-md-4">
          <div class="card border-info mb-4 shadow-sm">
            <div class="card-header bg-info text-white">
              <h4 class="mb-0"><i class="fas fa-exchange-alt me-2"></i>Total Trades</h4>
            </div>
            <div class="card-body text-center">
              <h2 class="display-4 mb-0">${
                tradesData.trades.total_trades || 0
              }</h2>
            </div>
          </div>
          
          <div class="card border-info mb-4 shadow-sm">
            <div class="card-header bg-info text-white">
              <h4 class="mb-0"><i class="fas fa-info-circle me-2"></i>Información Trades</h4>
            </div>
            <div class="card-body">
              <div class="info-item">
                <i class="fas fa-clock text-info me-2"></i>
                <span>Cooldown: 12 horas entre trades</span>
              </div>
              <div class="info-item mt-2">
                <i class="fas fa-exchange-alt text-info me-2"></i>
                <span>Comando: !helltrade [número] @usuario</span>
              </div>
              <div class="info-item mt-2">
                <i class="fas fa-info-circle text-info me-2"></i>
                <span>Los trades permiten transferir cartas entre usuarios</span>
              </div>
              <div class="info-item mt-3">
                <i class="fas fa-gift text-info me-2"></i>
                <span>Se pueden completar colecciones mediante trades</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-8">
          <div class="card border-info mb-4 shadow-sm">
            <div class="card-header bg-info text-white">
              <h4 class="mb-0"><i class="fas fa-history me-2"></i>Últimos Trades Realizados</h4>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>Usuario</th>
                      <th>Fecha</th>
                      <th>Detalles</th>
                    </tr>
                  </thead>
                  <tbody id="trades-recientes">
                    ${ultimosTrades
                      .map((trade) => {
                        const fecha = new Date(trade.fecha);
                        const fechaFormateada =
                          fecha.toLocaleDateString() +
                          " " +
                          fecha.toLocaleTimeString();

                        return `
                        <tr>
                          <td>
                            <div class="d-flex align-items-center">
                              <span class="avatar-text bg-info me-2 text-white">${getUserInitial(
                                trade.usuario_id
                              )}</span>
                              ${getUserName(trade.usuario_id)}
                            </div>
                          </td>
                          <td>${fechaFormateada}</td>
                          <td>
                            <button class="btn btn-sm btn-outline-info" onclick="HellGame.Trades.mostrarDetallesTrade('${
                              trade.usuario_id
                            }', '${trade.fecha}')">
                              <i class="fas fa-info-circle me-1"></i> Ver detalles
                            </button>
                          </td>
                        </tr>
                      `;
                      })
                      .join("")}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div class="card border-info shadow-sm">
            <div class="card-header bg-info text-white">
              <h4 class="mb-0"><i class="fas fa-chart-line me-2"></i>Actividad de Trades</h4>
            </div>
            <div class="card-body">
              <canvas id="tradesTimelineChart" height="250"></canvas>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Modal de detalles de trade -->
      <div class="modal fade" id="tradeDetailsModal" tabindex="-1" aria-labelledby="tradeDetailsModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header bg-info text-white">
              <h5 class="modal-title" id="tradeDetailsModalLabel">Detalles del Trade</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" id="tradeDetailsContent">
              <div class="text-center py-3">
                <div class="spinner-border text-info" role="status">
                  <span class="visually-hidden">Cargando...</span>
                </div>
                <p>Cargando detalles del trade...</p>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = tradesHTML;

    // Inicializar gráfico
    setTimeout(() => {
      inicializarGraficoTrades();
    }, 100);

    // Cargar historial de trades si no está cargado
    if (historialTrades.length === 0) {
      cargarHistorialTrades();
    }
  }

  // Inicializar gráfico de timeline de trades
  function inicializarGraficoTrades() {
    const ctx = document.getElementById("tradesTimelineChart");
    if (!ctx) return;

    // Preparar datos para el gráfico
    // Aquí deberíamos tener fechas de trades, pero usaremos datos simulados
    const ultimosTrades = tradesData.trades.ultimos_trades || [];

    // Agrupar trades por fecha
    const tradesPorFecha = {};
    ultimosTrades.forEach((trade) => {
      const fecha = new Date(trade.fecha);
      const fechaStr = fecha.toLocaleDateString();

      if (!tradesPorFecha[fechaStr]) {
        tradesPorFecha[fechaStr] = 0;
      }

      tradesPorFecha[fechaStr]++;
    });

    // Preparar datos para el gráfico
    const labels = Object.keys(tradesPorFecha).sort(
      (a, b) => new Date(a) - new Date(b)
    );
    const data = labels.map((fecha) => tradesPorFecha[fecha]);

    // Si ya existe un gráfico, destruirlo
    if (tradesTimelineChart) {
      tradesTimelineChart.destroy();
    }

    // Crear nuevo gráfico
    tradesTimelineChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Trades por día",
            data: data,
            fill: false,
            borderColor: "rgb(23, 162, 184)",
            backgroundColor: "rgba(23, 162, 184, 0.5)",
            tension: 0.1,
            pointBackgroundColor: "rgb(23, 162, 184)",
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: "rgb(23, 162, 184)",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
          },
          tooltip: {
            mode: "index",
            intersect: false,
            callbacks: {
              label: function (context) {
                return `Trades: ${context.raw}`;
              },
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: "Fecha",
            },
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Cantidad de Trades",
            },
            ticks: {
              precision: 0,
            },
          },
        },
      },
    });
  }

  // Función para cargar el historial de trades desde la API
  function cargarHistorialTrades() {
    // En una implementación real, harías una llamada fetch a tu API
    // Pero aquí simulamos que ya tenemos los datos básicos en tradesData
    historialTrades = tradesData.trades.ultimos_trades || [];
  }

  // Mostrar detalles de un trade específico
  function mostrarDetallesTrade(usuarioId, fecha) {
    console.log(
      `Mostrando detalles de trade para usuario ${usuarioId} en fecha ${fecha}`
    );

    // Crear y mostrar el modal
    const modal = new bootstrap.Modal(
      document.getElementById("tradeDetailsModal")
    );
    modal.show();

    // En una implementación real, harías una llamada fetch para obtener los detalles completos
    // Aquí simularemos esos datos
    setTimeout(() => {
      const detalles = {
        origen: {
          id: usuarioId,
          nombre: getUserName(usuarioId),
        },
        destino: {
          id: "232690174696488974",
          nombre: "florcitha",
        },
        carta: {
          nombre: "Phantom Himmelmez",
          id: "imagenes/cartas/mvp/27381.png",
          tipo: "mvp",
        },
        fecha: fecha,
      };

      mostrarContenidoDetallesTrade(detalles);
    }, 800);
  }

  // Actualizar el contenido del modal con los detalles del trade
  function mostrarContenidoDetallesTrade(detalles) {
    const contenedor = document.getElementById("tradeDetailsContent");

    if (!contenedor) return;

    // Formatear fecha
    const fecha = new Date(detalles.fecha);
    const fechaFormateada =
      fecha.toLocaleDateString() + " " + fecha.toLocaleTimeString();

    // Determinar tipo de carta
    const esMVP =
      detalles.carta.tipo === "mvp" || detalles.carta.id.includes("/mvp/");
    const badgeClass = esMVP ? "danger" : "primary";
    const tipoTexto = esMVP ? "MVP" : "Normal";

    // Obtener ID de carta para imagen
    const cartaId = obtenerIdDeCarta(detalles.carta.id);

    // Generar HTML
    contenedor.innerHTML = `
      <div class="trade-details">
        <div class="row">
          <div class="col-md-6">
            <div class="card border-info mb-3">
              <div class="card-header bg-info text-white">
                <h5 class="mb-0">Origen</h5>
              </div>
              <div class="card-body">
                <div class="d-flex align-items-center">
                  <span class="avatar-text bg-info me-2 text-white">${detalles.origen.nombre
                    .charAt(0)
                    .toUpperCase()}</span>
                  <span class="fw-bold">${detalles.origen.nombre}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card border-success mb-3">
              <div class="card-header bg-success text-white">
                <h5 class="mb-0">Destino</h5>
              </div>
              <div class="card-body">
                <div class="d-flex align-items-center">
                  <span class="avatar-text bg-success me-2">${detalles.destino.nombre
                    .charAt(0)
                    .toUpperCase()}</span>
                  <span class="fw-bold">${detalles.destino.nombre}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card border-${badgeClass} mb-3">
          <div class="card-header bg-${badgeClass} text-white">
            <h5 class="mb-0">Carta Intercambiada</h5>
          </div>
          <div class="card-body">
            <div class="d-flex align-items-center justify-content-center flex-column">
              <img src="https://static.divine-pride.net/images/items/cards/${cartaId}.png" 
                   alt="${
                     detalles.carta.nombre
                   }" class="mb-2" width="80" height="80">
              <h4>${detalles.carta.nombre}</h4>
              <span class="badge bg-${badgeClass}">${tipoTexto}</span>
            </div>
          </div>
        </div>
        
        <div class="text-center">
          <p class="lead">
            <i class="far fa-calendar-alt me-2"></i> ${fechaFormateada}
          </p>
        </div>
      </div>
    `;
  }

  // Funciones de utilidad

  // Obtener la inicial del usuario a partir de su ID
  function getUserInitial(userId) {
    const userName = getUserName(userId);
    return userName.charAt(0).toUpperCase();
  }

  // Obtener el nombre del usuario a partir de su ID
  function getUserName(userId) {
    // En una implementación real, buscarías en una base de datos o API
    // Aquí usamos un mapeo simple basado en los datos que hemos visto en los archivos
    const nombresUsuarios = {
      "302285499710701571": "masteralberto",
      "232690174696488974": "florcitha",
      "318586835876184064": "be299",
      "396728024038506526": "nuthir",
      "650531689214246912": "hellart87",
      "390774048650559488": "munky666",
      "189529253145083904": "malu.rar",
      "129347097563496449": "ing.ragnord",
      "1148790624653414431": "cruzificado_57805",
    };

    return nombresUsuarios[userId] || `Usuario ${userId.substring(0, 8)}...`;
  }

  // Extraer ID de carta de la ruta de la imagen
  function obtenerIdDeCarta(rutaCarta) {
    if (!rutaCarta) return "0";

    // Extraer ID de la ruta (ej: "imagenes/cartas/mvp/27329.png" -> "27329")
    const match = rutaCarta.match(/\/(\d+)\.png$/);
    return match ? match[1] : "0";
  }

  // Retorno público del módulo
  return {
    init: init,
    cargarHistorialTrades: cargarHistorialTrades,
    mostrarDetallesTrade: mostrarDetallesTrade,
  };
})();
