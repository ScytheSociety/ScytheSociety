/**
 * hellgame-ranking.js - Script para cargar y mostrar el ranking de HellGame
 * Scythe Society
 */

// Función para cargar y mostrar el ranking
function loadHellGameRanking() {
  const rankingContainer = document.getElementById(
    "hellgame-ranking-container"
  );

  if (!rankingContainer) {
    console.error("No se encontró el contenedor para el ranking de HellGame");
    return;
  }

  // URL de tu API (reemplaza con la IP o dominio de tu servidor OVHcloud)
  const rankingURL = "http://51.195.219.193:5000/api/ranking";

  // Añadir timestamp para evitar caché
  const timestamp = new Date().getTime();
  const urlWithTimestamp = `${rankingURL}?t=${timestamp}`;

  // Cargar los datos del ranking
  fetch(urlWithTimestamp)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error al cargar el ranking: " + response.status);
      }
      return response.json();
    })
    .then((data) => {
      // Limitar a los primeros 5 usuarios
      const top5 = data.slice(0, 5);

      // Crear la tabla para mostrar el ranking
      let rankingHTML = `
                <div class="table-responsive">
                    <table class="table table-dark table-hover">
                        <thead>
                            <tr>
                                <th scope="col">#</th>
                                <th scope="col">Usuario</th>
                                <th scope="col">Cartas</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

      // Añadir cada usuario a la tabla
      top5.forEach((user) => {
        rankingHTML += `
                    <tr class="ranking-row ranking-position-${user.posicion}">
                        <td>${user.posicion}</td>
                        <td>${user.usuario_nickname}</td>
                        <td>${user.cartas}</td>
                    </tr>
                `;
      });

      // Cerrar la tabla
      rankingHTML += `
                        </tbody>
                    </table>
                </div>
                <p class="text-center text-muted small">Última actualización: ${top5[0].ultima_actualizacion}</p>
            `;

      // Insertar el HTML en el contenedor
      rankingContainer.innerHTML = rankingHTML;
    })
    .catch((error) => {
      console.error("Error:", error);
      rankingContainer.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <i class="fas fa-exclamation-triangle me-2"></i>
                    No se pudo cargar el ranking. Por favor, intenta de nuevo más tarde.
                </div>
            `;
    });
}

// Cargar el ranking cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", function () {
  loadHellGameRanking();

  // Actualizar el ranking cada 5 minutos (300000 ms)
  setInterval(loadHellGameRanking, 300000);
});
