/**
 * hellgame-fusion.js
 * Módulo para gestionar la sección de fusiones en las estadísticas de HellGame
 */

// Namespace para HellGame
var HellGame = HellGame || {};

// Módulo de Fusiones
HellGame.Fusion = (function () {
  // Datos de fusiones
  let fusionData = {};

  // Datos históricos de fusiones
  let historialFusiones = [];

  // Elemento contenedor
  let container = null;

  // Referencia al gráfico
  let fusionesChart = null;

  // Inicialización del módulo
  function init(data) {
    console.log("Inicializando módulo de Fusiones...");
    fusionData = data;
    container = document.getElementById("fusion-container");

    if (!container) {
      console.error("No se encontró el contenedor de fusiones");
      return;
    }

    renderizarSeccionFusiones();
  }

  // Renderizar la sección de fusiones
  function renderizarSeccionFusiones() {
    const topFusion = fusionData.fusion.top_usuarios_fusion || {};

    let fusionHTML = `
      <div class="row">
        <div class="col-md-6">
          <div class="card border-warning mb-4 shadow-sm">
            <div class="card-header bg-warning text-dark">
              <h4 class="mb-0"><i class="fas fa-fire me-2"></i>Total Fusiones</h4>
            </div>
            <div class="card-body text-center">
              <h2 class="display-4 mb-0">${
                fusionData.fusion.total_fusiones || 0
              }</h2>
            </div>
          </div>
          
          <div class="card border-warning mb-4 shadow-sm">
            <div class="card-header bg-warning text-dark">
              <h4 class="mb-0"><i class="fas fa-chart-bar me-2"></i>Top Fusiones por Usuario</h4>
            </div>
            <div class="card-body">
              <canvas id="fusionesChart" height="250"></canvas>
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="card border-warning mb-4 shadow-sm h-100">
            <div class="card-header bg-warning text-dark">
              <h4 class="mb-0"><i class="fas fa-users me-2"></i>Top Usuarios - Fusiones</h4>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>#</th>
                      <th>Usuario</th>
                      <th>Fusiones</th>
                      <th>Carta Reciente</th>
                    </tr>
                  </thead>
                  <tbody id="top-fusiones-table">
                    ${Object.entries(topFusion)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([usuario, fusiones], index) => {
                        const cartaReciente =
                          obtenerCartaRecienteFusion(usuario) || "N/A";

                        return `
                          <tr>
                            <td>${index + 1}</td>
                            <td>
                              <div class="d-flex align-items-center">
                                <span class="avatar-text bg-warning text-dark me-2">${usuario
                                  .charAt(0)
                                  .toUpperCase()}</span>
                                ${usuario}
                              </div>
                            </td>
                            <td><span class="badge bg-warning text-dark">${fusiones}</span></td>
                            <td>
                              <span class="badge bg-secondary">${cartaReciente}</span>
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
        </div>
      </div>
      
      <div class="row mt-4">
        <div class="col-12">
          <div class="card border-warning shadow-sm">
            <div class="card-header bg-warning text-dark">
              <h4 class="mb-0"><i class="fas fa-history me-2"></i>Historial de Fusiones Recientes</h4>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>Usuario</th>
                      <th>Cartas Fusionadas</th>
                      <th>Carta Obtenida</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody id="fusiones-recientes">
                    <tr>
                      <td colspan="4" class="text-center">
                        <div class="spinner-border spinner-border-sm text-warning" role="status">
                          <span class="visually-hidden">Cargando...</span>
                        </div>
                        Cargando historial de fusiones...
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = fusionHTML;

    // Inicializar gráfico
    setTimeout(() => {
      inicializarGraficoFusiones();
    }, 100);

    // Cargar historial de fusiones si no está cargado
    if (historialFusiones.length === 0) {
      cargarHistorialFusiones();
    } else {
      actualizarTablaHistorialFusiones();
    }
  }

  // Inicializar gráfico de fusiones
  function inicializarGraficoFusiones() {
    const ctx = document.getElementById("fusionesChart");
    if (!ctx) return;

    // Obtener datos para el gráfico
    const topFusion = fusionData.fusion.top_usuarios_fusion || {};

    const labels = [];
    const data = [];
    const backgroundColors = [];

    // Colores personalizados para el gráfico
    const customColors = [
      "rgba(255, 193, 7, 0.8)", // Warning (amarillo)
      "rgba(255, 153, 0, 0.8)", // Naranja
      "rgba(255, 87, 34, 0.8)", // Naranja oscuro
      "rgba(244, 67, 54, 0.8)", // Rojo
      "rgba(233, 30, 99, 0.8)", // Rosa
    ];

    Object.entries(topFusion)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([usuario, fusiones], index) => {
        labels.push(usuario);
        data.push(fusiones);
        backgroundColors.push(customColors[index % customColors.length]);
      });

    // Si ya existe un gráfico, destruirlo
    if (fusionesChart) {
      fusionesChart.destroy();
    }

    // Crear nuevo gráfico
    fusionesChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Fusiones realizadas",
            data: data,
            backgroundColor: backgroundColors,
            borderColor: backgroundColors.map((color) =>
              color.replace("0.8", "1")
            ),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `Fusiones: ${context.raw}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
      },
    });
  }

  // Función para cargar el historial de fusiones desde la API
  function cargarHistorialFusiones() {
    // Simulamos una carga desde la API (en la implementación real, haz una llamada fetch)
    setTimeout(() => {
      // Esta es una simulación. En una implementación real, harías una llamada fetch a tu API
      historialFusiones = [
        {
          usuario_id: 189529253145083904,
          usuario_name: "malu.rar",
          cartas_fusionadas: [
            "Cursed Raydric",
            "Cursed Raydric Archer",
            "White Knight",
            "2nd Commander of Destruction",
            "Dark Priest",
          ],
          carta_obtenida: "Curse-swallowed King",
          fecha: "2025-03-11 00:11:18",
        },
        {
          usuario_id: 302285499710701571,
          usuario_name: "masteralberto",
          cartas_fusionadas: [
            "Owl Baron",
            "Mutating Khalitzburg",
            "2nd Commander of Destruction",
            "Cursed Raydric Archer",
            "Ice Ghost",
          ],
          carta_obtenida: "Phantom Himmelmez",
          fecha: "2025-03-13 18:40:13",
        },
        {
          usuario_id: 650531689214246912,
          usuario_name: "hellart87",
          cartas_fusionadas: [
            "Corrupted Wanderer",
            "White Knight",
            "Owl Baron",
            "Injustice",
            "Bloody Knight",
          ],
          carta_obtenida: "Curse-swallowed King",
          fecha: "2025-03-13 18:42:01",
        },
        {
          usuario_id: 396728024038506526,
          usuario_name: "nuthir",
          cartas_fusionadas: [
            "White Knight",
            "Cursed Raydric",
            "Mutating Khalitzburg",
            "Owl Baron",
            "Injustice",
          ],
          carta_obtenida: "Phantom Himmelmez",
          fecha: "2025-03-14 13:03:28",
        },
        {
          usuario_id: 396728024038506526,
          usuario_name: "nuthir",
          cartas_fusionadas: [
            "Cursed Raydric",
            "White Knight",
            "Mutating Khalitzburg",
            "2nd Commander of Destruction",
            "Wraith",
          ],
          carta_obtenida: "Corrupted Spider Queen",
          fecha: "2025-03-14 17:57:42",
        },
      ];

      actualizarTablaHistorialFusiones();
    }, 1000);
  }

  // Actualizar la tabla de historial de fusiones
  function actualizarTablaHistorialFusiones() {
    const tablaHistorial = document.getElementById("fusiones-recientes");

    if (!tablaHistorial) return;

    let htmlHistorial = "";

    if (historialFusiones.length === 0) {
      htmlHistorial = `
        <tr>
          <td colspan="4" class="text-center">
            No hay datos de fusiones recientes disponibles
          </td>
        </tr>
      `;
    } else {
      htmlHistorial = historialFusiones
        .slice(0, 10) // Mostrar las 10 más recientes
        .map((fusion) => {
          const fecha = new Date(fusion.fecha);
          const fechaFormateada =
            fecha.toLocaleDateString() + " " + fecha.toLocaleTimeString();

          // Determinar si la carta obtenida es MVP
          const esMVP = esMonstruoMVP(fusion.carta_obtenida);
          const badgeClass = esMVP ? "danger" : "primary";

          return `
            <tr>
              <td>
                <div class="d-flex align-items-center">
                  <span class="avatar-text bg-warning text-dark me-2">${fusion.usuario_name
                    .charAt(0)
                    .toUpperCase()}</span>
                  ${fusion.usuario_name}
                </div>
              </td>
              <td>
                <button class="btn btn-sm btn-outline-secondary" 
                        data-bs-toggle="tooltip" 
                        data-bs-placement="top" 
                        title="${fusion.cartas_fusionadas.join(", ")}">
                  ${fusion.cartas_fusionadas.length} cartas
                </button>
              </td>
              <td>
                <span class="badge bg-${badgeClass}">
                  ${fusion.carta_obtenida}
                </span>
              </td>
              <td>${fechaFormateada}</td>
            </tr>
          `;
        })
        .join("");
    }

    tablaHistorial.innerHTML = htmlHistorial;

    // Inicializar tooltips de Bootstrap
    var tooltipTriggerList = [].slice.call(
      document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }

  // Funciones de utilidad

  // Obtener la carta más reciente obtenida por un usuario en una fusión
  function obtenerCartaRecienteFusion(nombreUsuario) {
    // Si tenemos historial cargado, buscamos la última fusión del usuario
    if (historialFusiones.length > 0) {
      const ultimaFusion = historialFusiones
        .filter((fusion) => fusion.usuario_name === nombreUsuario)
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))[0];

      if (ultimaFusion) {
        return ultimaFusion.carta_obtenida;
      }
    }

    // Si no tenemos datos, devolvemos un valor por defecto
    return "Desconocida";
  }

  // Determinar si un monstruo es MVP basándose en su nombre
  function esMonstruoMVP(nombreMonstruo) {
    // Lista de palabras clave que suelen aparecer en nombres de MVPs
    const palabrasClavesMVP = [
      "Lord",
      "Queen",
      "King",
      "Phantom",
      "Dark Lord",
      "Corrupted",
      "Ancient",
      "Cursed",
      "Swallowed",
      "Amdarais",
      "Himmelmez",
    ];

    return palabrasClavesMVP.some((palabra) =>
      nombreMonstruo.includes(palabra)
    );
  }

  // Retorno público del módulo
  return {
    init: init,
    cargarHistorialFusiones: cargarHistorialFusiones,
    obtenerCartaRecienteFusion: obtenerCartaRecienteFusion,
  };
})();
