/**
 * hellgame-cartas.js
 * Módulo para gestionar la sección de cartas en las estadísticas de HellGame
 */

// Namespace para HellGame
var HellGame = HellGame || {};

// Módulo de Cartas
HellGame.Cartas = (function () {
  // Datos de cartas
  let cartasData = {};

  // Elemento contenedor
  let container = null;

  // Referencia al gráfico
  let cartasChart = null;

  // Inicialización del módulo
  function init(data) {
    console.log("Inicializando módulo de Cartas...");
    cartasData = data;
    container = document.getElementById("cartas-container");

    if (!container) {
      console.error("No se encontró el contenedor de cartas");
      return;
    }

    renderizarSeccionCartas();
  }

  // Renderizar la sección de cartas
  function renderizarSeccionCartas() {
    const topCartas = cartasData.cartas.top_cartas || {};

    let cartasHTML = `
      <div class="row">
        <div class="col-md-6">
          <div class="card border-danger mb-4 shadow-sm">
            <div class="card-header bg-danger text-white">
              <h4 class="mb-0"><i class="fas fa-trophy me-2"></i>Total Cartas Ganadas</h4>
            </div>
            <div class="card-body text-center">
              <h2 class="display-4 mb-0">${
                cartasData.cartas.total_cartas_ganadas
              }</h2>
            </div>
          </div>
          
          <div class="card border-primary mb-4 shadow-sm">
            <div class="card-header bg-primary text-white">
              <h4 class="mb-0"><i class="fas fa-chart-bar me-2"></i>Top 10 Cartas Más Comunes</h4>
            </div>
            <div class="card-body">
              <canvas id="cartasChart" height="250"></canvas>
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="card border-primary mb-4 shadow-sm">
            <div class="card-header bg-primary text-white">
              <h4 class="mb-0"><i class="fas fa-list me-2"></i>Top 10 Cartas</h4>
            </div>
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>#</th>
                      <th>Carta</th>
                      <th>Monstruo</th>
                      <th>Cantidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${Object.entries(topCartas)
                      .slice(0, 10)
                      .map(([carta, cantidad], index) => {
                        const cartaId = obtenerIdDeCarta(carta);
                        const monstruoId = obtenerIdDeMonstruo(carta);
                        const nombreMonstruo = obtenerNombreMonstruo(carta);
                        const esCartaMVP = carta.includes("/mvp/");
                        const badgeClase = esCartaMVP ? "danger" : "primary";
                        const tipoTexto = esCartaMVP ? "MVP" : "Normal";

                        return `
                          <tr>
                            <td>${index + 1}</td>
                            <td>
                              <div class="d-flex align-items-center">
                                <img src="https://static.divine-pride.net/images/items/cards/${cartaId}.png" 
                                     alt="${nombreMonstruo}" class="me-2" width="40" height="40">
                                <span class="badge bg-${badgeClase}">${tipoTexto}</span>
                              </div>
                            </td>
                            <td>
                              <div class="d-flex align-items-center">
                                <img src="https://static.divine-pride.net/images/mobs/png/${monstruoId}.png" 
                                     alt="${nombreMonstruo}" class="me-2" width="40" height="40">
                                ${nombreMonstruo}
                              </div>
                            </td>
                            <td><span class="badge bg-success">${cantidad}</span></td>
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
    `;

    container.innerHTML = cartasHTML;

    // Inicializar gráfico
    setTimeout(() => {
      inicializarGraficoCartas();
    }, 100);
  }

  // Inicializar gráfico de cartas
  function inicializarGraficoCartas() {
    const ctx = document.getElementById("cartasChart");
    if (!ctx) return;

    // Obtener datos para el gráfico
    const topCartas = cartasData.cartas.top_cartas || {};
    const labels = [];
    const data = [];
    const backgroundColors = [];

    Object.entries(topCartas)
      .slice(0, 10)
      .forEach(([carta, cantidad]) => {
        const nombreMonstruo = obtenerNombreMonstruo(carta);
        const esCartaMVP = carta.includes("/mvp/");

        labels.push(nombreMonstruo);
        data.push(cantidad);
        backgroundColors.push(
          esCartaMVP ? "rgba(220, 53, 69, 0.8)" : "rgba(13, 110, 253, 0.8)"
        );
      });

    // Si ya existe un gráfico, destruirlo
    if (cartasChart) {
      cartasChart.destroy();
    }

    // Crear nuevo gráfico
    cartasChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Cantidad de cartas",
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
                return `Cantidad: ${context.raw}`;
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

  // Funciones de utilidad para procesar datos de cartas

  // Obtener ID de carta desde la ruta
  function obtenerIdDeCarta(rutaCarta) {
    if (!rutaCarta) return "0";

    // Extraer ID de la ruta (ej: "imagenes/cartas/mvp/27329.png" -> "27329")
    const match = rutaCarta.match(/\/(\d+)\.png$/);
    return match ? match[1] : "0";
  }

  // Obtener ID de monstruo desde la ruta de carta
  function obtenerIdDeMonstruo(rutaCarta) {
    if (!rutaCarta) return "0";

    // Buscar el monstruo correspondiente en los datos
    const cartaId = obtenerIdDeCarta(rutaCarta);
    const esCartaMVP = rutaCarta.includes("/mvp/");

    // Extraer la primera parte del ID para buscar el monstruo
    // Esto es una simplificación. En la implementación real, deberías buscar en el YAML
    return esCartaMVP ? `20${cartaId.substring(2, 5)}` : cartaId;
  }

  // Obtener nombre del monstruo desde la ruta de carta
  function obtenerNombreMonstruo(rutaCarta) {
    if (!rutaCarta) return "Desconocido";

    // En una implementación real, buscarías en el YAML
    // Para esta demo, usaremos nombres genéricos
    const cartaId = obtenerIdDeCarta(rutaCarta);
    const esCartaMVP = rutaCarta.includes("/mvp/");

    // Mapeo básico de algunos IDs conocidos (de los ejemplos)
    const nombresConocidos = {
      27329: "Curse-swallowed King",
      4190: "Wraith",
      4171: "Dark Priest",
      4140: "Abysmal Knight",
      27386: "Cursed Raydric",
      27387: "Cursed Raydric Archer",
      27361: "Corrupted Wanderer",
      4168: "Dark Lord",
      27362: "Corrupted Spider Queen",
      27381: "Phantom Himmelmez",
      27383: "Phantom Amdarais",
    };

    return (
      nombresConocidos[cartaId] ||
      (esCartaMVP ? `MVP ${cartaId}` : `Monstruo ${cartaId}`)
    );
  }

  // Retorno público del módulo
  return {
    init: init,
    obtenerIdDeCarta: obtenerIdDeCarta,
    obtenerIdDeMonstruo: obtenerIdDeMonstruo,
    obtenerNombreMonstruo: obtenerNombreMonstruo,
  };
})();
