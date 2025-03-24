/**
 * hellgame.js - Script para mostrar estadísticas de HellGame
 * Scythe Society
 */

// Función para cargar las estadísticas de HellGame
function loadHellGameEstadisticas() {
  const estadisticasContainer = document.getElementById(
    "hellgame-estadisticas-container"
  );

  if (!estadisticasContainer) {
    console.error(
      "No se encontró el contenedor para las estadísticas de HellGame"
    );
    return;
  }

  // URL de tu API (ajusta según corresponda)
  const estadisticasURL =
    "https://hellgameapi.duckdns.org:5000/api/estadisticas";

  // Añadir timestamp para evitar caché
  const timestamp = new Date().getTime();
  const urlWithTimestamp = `${estadisticasURL}?t=${timestamp}`;

  // Cargar los datos de estadísticas
  fetch(urlWithTimestamp)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error al cargar las estadísticas: " + response.status);
      }
      return response.json();
    })
    .then((data) => {
      // Crear HTML para mostrar las estadísticas
      let statsHTML = `
                <div class="row">
                    <!-- Estadísticas generales -->
                    <div class="col-lg-4 mb-4">
                        <div class="card stats-card">
                            <div class="card-header">
                                <h4><i class="fas fa-chart-line me-2"></i>Estadísticas Generales</h4>
                            </div>
                            <div class="card-body">
                                <ul class="list-group list-group-flush">
                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                        Total de Jugadores
                                        <span class="badge bg-primary rounded-pill">${data.totalJugadores}</span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                        Partidas Jugadas
                                        <span class="badge bg-primary rounded-pill">${data.partidasJugadas}</span>
                                    </li>
                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                        Total de Cartas
                                        <span class="badge bg-primary rounded-pill">${data.totalCartas}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Top jugadores -->
                    <div class="col-lg-8 mb-4">
                        <div class="card stats-card">
                            <div class="card-header">
                                <h4><i class="fas fa-trophy me-2"></i>Mejores Jugadores</h4>
                            </div>
                            <div class="card-body">
                                <div class="table-responsive">
                                    <table class="table table-hover">
                                        <thead>
                                            <tr>
                                                <th scope="col">#</th>
                                                <th scope="col">Usuario</th>
                                                <th scope="col">Cartas</th>
                                                <th scope="col">Victorias</th>
                                            </tr>
                                        </thead>
                                        <tbody>
            `;

      // Añadir cada jugador a la tabla
      data.topJugadores.forEach((jugador, index) => {
        statsHTML += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${jugador.usuario_nickname}</td>
                        <td>${jugador.cartas}</td>
                        <td>${jugador.victorias}</td>
                    </tr>
                `;
      });

      // Cerrar la tabla y los divs
      statsHTML += `
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Estadísticas adicionales si las tienes -->
                <div class="row">
                    <div class="col-12 mb-4">
                        <div class="card stats-card">
                            <div class="card-header">
                                <h4><i class="fas fa-info-circle me-2"></i>Información Adicional</h4>
                            </div>
                            <div class="card-body">
                                <p>Última actualización: ${new Date().toLocaleString()}</p>
                                <p>Para más detalles sobre las reglas del juego y cómo participar, únete a nuestro servidor de Discord.</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;

      // Insertar el HTML en el contenedor
      estadisticasContainer.innerHTML = statsHTML;
    })
    .catch((error) => {
      console.error("Error:", error);
      estadisticasContainer.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    No se pudieron cargar las estadísticas. Por favor, intenta de nuevo más tarde.
                </div>
            `;
    });
}

// Ejecutar cuando se cargue la página
document.addEventListener("DOMContentLoaded", function () {
  loadHellGameEstadisticas();

  // Actualizar las estadísticas cada 5 minutos (300000 ms)
  setInterval(loadHellGameEstadisticas, 300000);
});
