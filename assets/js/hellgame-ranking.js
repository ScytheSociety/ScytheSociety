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
  const rankingURL = "https://hellgameapi.duckdns.org:5000/api/ranking";

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
      // Limitar a los primeros 10 usuarios
      const top10 = data.slice(0, 10);

      // Crear HTML para el podio
      let rankingHTML = `
        <div class="podium-container">
          <!-- Top 3 Jugadores (Podio) -->
          <div class="podium-top3">
            <!-- Segundo Lugar -->
            <div class="podium-position podium-second">
              <div class="podium-avatar">
                <img src="${top10[1].avatar_url}" alt="${top10[1].usuario_nickname}" class="avatar-image">
                <div class="podium-medal silver">2</div>
              </div>
              <div class="podium-platform second-platform">
                <div class="podium-name">${top10[1].usuario_nickname}</div>
                <div class="podium-score">${top10[1].cartas} cartas</div>
              </div>
            </div>
            
            <!-- Primer Lugar -->
            <div class="podium-position podium-first">
              <div class="podium-avatar">
                <i class="fas fa-crown crown-icon"></i>
                <img src="${top10[0].avatar_url}" alt="${top10[0].usuario_nickname}" class="avatar-image">
                <div class="podium-medal gold">1</div>
              </div>
              <div class="podium-platform first-platform">
                <div class="podium-name">${top10[0].usuario_nickname}</div>
                <div class="podium-score">${top10[0].cartas} cartas</div>
              </div>
            </div>
            
            <!-- Tercer Lugar -->
            <div class="podium-position podium-third">
              <div class="podium-avatar">
                <img src="${top10[2].avatar_url}" alt="${top10[2].usuario_nickname}" class="avatar-image">
                <div class="podium-medal bronze">3</div>
              </div>
              <div class="podium-platform third-platform">
                <div class="podium-name">${top10[2].usuario_nickname}</div>
                <div class="podium-score">${top10[2].cartas} cartas</div>
              </div>
            </div>
          </div>
          
          <!-- Resto del Top 10 -->
          <div class="podium-others">
      `;

      // Añadir jugadores del 4 al 10
      for (let i = 3; i < top10.length; i++) {
        rankingHTML += `
          <div class="podium-position podium-small">
            <div class="podium-number">${i + 1}</div>
            <div class="podium-avatar-small">
              <img src="${top10[i].avatar_url}" alt="${
          top10[i].usuario_nickname
        }" class="avatar-image-small">
            </div>
            <div class="podium-name">${top10[i].usuario_nickname}</div>
            <div class="podium-score">${top10[i].cartas}</div>
          </div>
        `;
      }

      // Cerrar los divs
      rankingHTML += `
          </div>
          <p class="text-center text-muted small mt-3">Última actualización: ${top10[0].ultima_actualizacion}</p>
        </div>
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
