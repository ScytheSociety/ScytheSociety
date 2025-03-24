/**
 * hellgame-revenge.js
 * Módulo para gestionar la sección de Revenge en las estadísticas de HellGame
 */

// Namespace para HellGame
var HellGame = HellGame || {};

// Módulo de Revenge
HellGame.Revenge = (function () {
  // Datos de revenge
  let revengeData = {};

  // Datos históricos de revenge
  let historialRevenge = [];

  // Elemento contenedor
  let container = null;

  // Referencia al gráfico
  let revengeChart = null;

  // Inicialización del módulo
  function init(data) {
    console.log("Inicializando módulo de Revenge...");
    revengeData = data;
    container = document.getElementById("revenge-container");

    if (!container) {
      console.error("No se encontró el contenedor de revenge");
      return;
    }

    renderizarSeccionRevenge();
  }

  // Renderizar la sección de revenge
  function renderizarSeccionRevenge() {
    const topRevenge = revengeData.revenge.top_usuarios_revenge || {};

    let revengeHTML = `
      <div class="row">
        <div class="col-md-6">
          <div class="card border-danger mb-4 shadow-sm">
            <div class="card-header bg-danger text-white">
              <h4 class="mb-0"><i class="fas fa-skull-crossbones me-2"></i>Total Venganzas</h4>
            </div>
            <div class="card-body text-center">
              <h2 class="display-4 mb-0">${
                revengeData.revenge.total_venganzas || 0
              }</h2>
            </div>
          </div>
          
          <div class="card border-danger mb-4 shadow-sm">
            <div class="card-header bg-danger text-white">
              <h4 class="mb-0"><i class="fas fa-chart-pie me-2"></i>Top Usuarios en Venganzas</h4>
            </div>
            <div class="card-body">
              <canvas id="revengeChart" height="250"></canvas>
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="card border-danger mb-4 shadow-sm h-100">
            <div class="card-header bg-danger text-white">
              <h4 class="mb-0"><i class="fas fa-users me-2"></i>Top Usuarios - Revenge</h4>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>#</th>
                      <th>Usuario</th>
                      <th>Venganzas</th>
                      <th>Objetivo Frecuente</th>
                    </tr>
                  </thead>
                  <tbody id="top-revenge-table">
                    ${Object.entries(topRevenge)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 5)
                      .map(([usuario, venganzas], index) => {
                        const objetivoFrecuente =
                          obtenerObjetivoFrecuente(usuario) || "N/A";

                        return `
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
                            <td><span class="badge bg-danger">${venganzas}</span></td>
                            <td>
                              <div class="d-flex align-items-center">
                                <span class="avatar-text bg-secondary me-2">${objetivoFrecuente
                                  .charAt(0)
                                  .toUpperCase()}</span>
                                ${objetivoFrecuente}
                              </div>
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
          <div class="card border-danger shadow-sm">
            <div class="card-header bg-danger text-white">
              <h4 class="mb-0"><i class="fas fa-history me-2"></i>Historial de Venganzas Recientes</h4>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>Usuario</th>
                      <th>Objetivo</th>
                      <th>Carta Robada</th>
                      <th>Fecha</th>
                    </tr>
                  </thead>
                  <tbody id="revenge-recientes">
                    <tr>
                      <td colspan="4" class="text-center">
                        <div class="spinner-border spinner-border-sm text-danger" role="status">
                          <span class="visually-hidden">Cargando...</span>
                        </div>
                        Cargando historial de venganzas...
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

    container.innerHTML = revengeHTML;

    // Inicializar gráfico
    setTimeout(() => {
      inicializarGraficoRevenge();
    }, 100);

    // Cargar historial de venganzas si no está cargado
    if (historialRevenge.length === 0) {
      cargarHistorialRevenge();
    } else {
      actualizarTablaHistorialRevenge();
    }
  }

  // Inicializar gráfico de revenge
  function inicializarGraficoRevenge() {
    const ctx = document.getElementById("revengeChart");
    if (!ctx) return;

    // Obtener datos para el gráfico
    const topRevenge = revengeData.revenge.top_usuarios_revenge || {};

    const labels = [];
    const data = [];
    const backgroundColors = [];

    // Colores personalizados para el gráfico
    const customColors = [
      "rgba(220, 53, 69, 0.8)", // Danger (rojo)
      "rgba(201, 42, 42, 0.8)", // Rojo oscuro
      "rgba(165, 29, 42, 0.8)", // Rojo más oscuro
      "rgba(135, 28, 28, 0.8)", // Rojo vino
      "rgba(108, 20, 20, 0.8)", // Rojo café
    ];

    Object.entries(topRevenge)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([usuario, venganzas], index) => {
        labels.push(usuario);
        data.push(venganzas);
        backgroundColors.push(customColors[index % customColors.length]);
      });

    // Si ya existe un gráfico, destruirlo
    if (revengeChart) {
      revengeChart.destroy();
    }

    // Crear nuevo gráfico
    revengeChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
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
            position: "right",
            labels: {
              generateLabels: function (chart) {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  return data.labels.map(function (label, i) {
                    const meta = chart.getDatasetMeta(0);
                    const style = meta.controller.getStyle(i);

                    return {
                      text: `${label}: ${data.datasets[0].data[i]}`,
                      fillStyle: style.backgroundColor,
                      strokeStyle: style.borderColor,
                      lineWidth: style.borderWidth,
                      hidden: false,
                      index: i,
                    };
                  });
                }
                return [];
              },
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || "";
                const value = context.parsed || 0;
                return `${label}: ${value} venganzas`;
              },
            },
          },
        },
      },
    });
  }

  // Función para cargar el historial de revenge desde la API
  function cargarHistorialRevenge() {
    // Simulamos una carga desde la API (en la implementación real, haz una llamada fetch)
    setTimeout(() => {
      // Esta es una simulación. En una implementación real, harías una llamada fetch a tu API
      historialRevenge = [
        {
          usuario_id: 302285499710701571,
          usuario_name: "masteralberto",
          objetivo_id: 204833467261911050,
          objetivo_name: "gehoul",
          carta_robada: "Cursed Raydric",
          carta_id: "imagenes/cartas/normal/27386.png",
          fecha: "2025-03-09 15:47:31",
        },
        {
          usuario_id: 302285499710701571,
          usuario_name: "masteralberto",
          objetivo_id: 232690174696488974,
          objetivo_name: "florcitha",
          carta_robada: "Phantom Himmelmez",
          carta_id: "imagenes/cartas/mvp/27381.png",
          fecha: "2025-03-09 18:03:17",
        },
        {
          usuario_id: 318586835876184064,
          usuario_name: "be299",
          objetivo_id: 650531689214246912,
          objetivo_name: "hellart87",
          carta_robada: "Curse-swallowed King",
          carta_id: "imagenes/cartas/mvp/27329.png",
          fecha: "2025-03-10 15:47:12",
        },
        {
          usuario_id: 232690174696488974,
          usuario_name: "florcitha",
          objetivo_id: 318586835876184064,
          objetivo_name: "be299",
          carta_robada: "Curse-swallowed King",
          carta_id: "imagenes/cartas/mvp/27329.png",
          fecha: "2025-03-10 15:47:21",
        },
        {
          usuario_id: 650531689214246912,
          usuario_name: "hellart87",
          objetivo_id: 390774048650559488,
          objetivo_name: "munky666",
          carta_robada: "Corrupted Spider Queen",
          carta_id: "imagenes/cartas/mvp/27362.png",
          fecha: "2025-03-11 01:52:35",
        },
        {
          usuario_id: 650531689214246912,
          usuario_name: "hellart87",
          objetivo_id: 318586835876184064,
          objetivo_name: "be299",
          carta_robada: "Bloody Knight",
          carta_id: "imagenes/cartas/normal/4320.png",
          fecha: "2025-03-12 02:42:50",
        },
        {
          usuario_id: 232690174696488974,
          usuario_name: "florcitha",
          objetivo_id: 390774048650559488,
          objetivo_name: "munky666",
          carta_robada: "Curse-swallowed King",
          carta_id: "imagenes/cartas/mvp/27329.png",
          fecha: "2025-03-13 01:28:13",
        },
      ];

      actualizarTablaHistorialRevenge();
    }, 1000);
  }

  // Actualizar la tabla de historial de revenge
  function actualizarTablaHistorialRevenge() {
    const tablaHistorial = document.getElementById("revenge-recientes");

    if (!tablaHistorial) return;

    let htmlHistorial = "";

    if (historialRevenge.length === 0) {
      htmlHistorial = `
        <tr>
          <td colspan="4" class="text-center">
            No hay datos de venganzas recientes disponibles
          </td>
        </tr>
      `;
    } else {
      htmlHistorial = historialRevenge
        .slice(0, 10) // Mostrar las 10 más recientes
        .map((revenge) => {
          const fecha = new Date(revenge.fecha);
          const fechaFormateada =
            fecha.toLocaleDateString() + " " + fecha.toLocaleTimeString();

          // Determinar si la carta robada es MVP
          const esMVP = revenge.carta_id.includes("/mvp/");
          const badgeClass = esMVP ? "danger" : "primary";

          // Obtener ID de carta para imagen
          const cartaId = obtenerIdDeCarta(revenge.carta_id);

          return `
            <tr>
              <td>
                <div class="d-flex align-items-center">
                  <span class="avatar-text bg-danger me-2">${revenge.usuario_name
                    .charAt(0)
                    .toUpperCase()}</span>
                  ${revenge.usuario_name}
                </div>
              </td>
              <td>
                <div class="d-flex align-items-center">
                  <span class="avatar-text bg-secondary me-2">${revenge.objetivo_name
                    .charAt(0)
                    .toUpperCase()}</span>
                  ${revenge.objetivo_name}
                </div>
              </td>
              <td>
                <div class="d-flex align-items-center">
                  <img src="https://static.divine-pride.net/images/items/cards/${cartaId}.png" 
                       alt="${
                         revenge.carta_robada
                       }" class="me-2" width="30" height="30">
                  <span class="badge bg-${badgeClass}">
                    ${revenge.carta_robada}
                  </span>
                </div>
              </td>
              <td>${fechaFormateada}</td>
            </tr>
          `;
        })
        .join("");
    }

    tablaHistorial.innerHTML = htmlHistorial;
  }

  // Funciones de utilidad

  // Obtener el objetivo más frecuente de un usuario en revenge
  function obtenerObjetivoFrecuente(nombreUsuario) {
    // Si tenemos historial cargado, analizamos los objetivos
    if (historialRevenge.length > 0) {
      const venganzasUsuario = historialRevenge.filter(
        (revenge) => revenge.usuario_name === nombreUsuario
      );

      if (venganzasUsuario.length > 0) {
        // Contamos las ocurrencias de cada objetivo
        const contadorObjetivos = {};
        venganzasUsuario.forEach((revenge) => {
          if (!contadorObjetivos[revenge.objetivo_name]) {
            contadorObjetivos[revenge.objetivo_name] = 0;
          }
          contadorObjetivos[revenge.objetivo_name]++;
        });

        // Encontramos el objetivo más frecuente
        let objetivoFrecuente = null;
        let maxContador = 0;

        for (const [objetivo, contador] of Object.entries(contadorObjetivos)) {
          if (contador > maxContador) {
            objetivoFrecuente = objetivo;
            maxContador = contador;
          }
        }

        return objetivoFrecuente;
      }
    }

    // Si no tenemos datos, devolvemos un valor por defecto
    return "Desconocido";
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
    cargarHistorialRevenge: cargarHistorialRevenge,
    obtenerObjetivoFrecuente: obtenerObjetivoFrecuente,
  };
})();
