/**
 * Hell Shooter - Ranking Management
 * JavaScript para cargar y mostrar el top 3 de jugadores
 */

// URL del Web App de Google Sheets (la misma que usa el juego)
const RANKING_API_URL =
  "https://script.google.com/macros/s/AKfycbyISC1HgWsjGaNoCubjC8xEtABygGw9m24NLnz2ZwyM4pdeQBhuIF-cHRTQtQeYDWpTOA/exec";

/**
 * Carga el ranking al cargar la página
 */
document.addEventListener("DOMContentLoaded", function () {
  loadTop3Ranking();
});

/**
 * Carga el top 3 del ranking desde Google Sheets
 */
async function loadTop3Ranking() {
  const container = document.getElementById("top-ranking");
  const rankingContainer = container.querySelector(".hell-ranking-container");

  try {
    console.log("🏆 Cargando top 3 ranking de Hell Shooter...");

    // Mostrar loading
    rankingContainer.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-danger" role="status">
                    <span class="visually-hidden">Cargando ranking...</span>
                </div>
                <p class="mt-2" style="color: #ffffff;">Cargando mejores jugadores...</p>
            </div>
        `;

    // Hacer petición a la API
    const response = await fetch(RANKING_API_URL);

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Error al obtener datos del ranking");
    }

    const players = result.data || [];

    if (players.length === 0) {
      rankingContainer.innerHTML = `
                <div class="text-center py-4">
                    <h3 style="color: var(--hell-accent);">🎮 ¡Sé el Primero!</h3>
                    <p style="color: #ffffff;">Aún no hay jugadores en el ranking. ¡Juega ahora y marca la diferencia!</p>
                    <a href="../../juegosss/juegosss.html" class="btn btn-hell-play mt-3">
                        <i class="fas fa-play me-2"></i>¡Comenzar Ahora!
                    </a>
                </div>
            `;
      return;
    }

    // Procesar y ordenar jugadores
    const processedPlayers = players.map((player) => ({
      avatar: player.avatar || "👤",
      name: player.name || "Anónimo",
      level: parseInt(player.level) || 1,
      score: parseInt(player.score) || 0,
      maxCombo: parseInt(player.combo) || 0,
      enemiesKilled: parseInt(player.enemiesKilled) || 0,
      time: parseInt(player.time) || 0,
      status: player.status || "Derrota",
    }));

    // Ordenar por puntuación, luego por combo máximo
    const sortedPlayers = processedPlayers.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (b.maxCombo !== a.maxCombo) {
        return b.maxCombo - a.maxCombo;
      }
      return a.time - b.time;
    });

    // Tomar solo los top 3
    const top3 = sortedPlayers.slice(0, 3);

    // Generar HTML del podio
    displayTop3Podium(rankingContainer, top3);

    console.log("✅ Top 3 ranking cargado exitosamente");
  } catch (error) {
    console.error("❌ Error cargando ranking:", error);

    rankingContainer.innerHTML = `
            <div class="text-center py-4">
                <h3 style="color: var(--hell-secondary);">⚠️ Error de Conexión</h3>
                <p style="color: #ffffff;">No se pudo cargar el ranking. Verifica tu conexión a internet.</p>
                <button onclick="loadTop3Ranking()" class="btn btn-gaming mt-3">
                    <i class="fas fa-sync-alt me-2"></i>Reintentar
                </button>
                <a href="../../juegosss/juegosss.html" class="btn btn-hell-play mt-3 ms-2">
                    <i class="fas fa-play me-2"></i>¡Jugar Ahora!
                </a>
            </div>
        `;
  }
}

/**
 * Muestra el podio del top 3
 */
function displayTop3Podium(container, top3Players) {
  // Si hay menos de 3 jugadores, rellenar con placeholders
  while (top3Players.length < 3) {
    top3Players.push({
      avatar: "👤",
      name: "Disponible",
      level: 0,
      score: 0,
      maxCombo: 0,
      enemiesKilled: 0,
      time: 0,
      status: "Vacante",
    });
  }

  const podiumHTML = `
        <div class="hell-ranking-podium">
            <!-- Segundo Lugar -->
            <div class="hell-ranking-position second">
                <div class="rank-number second">🥈</div>
                <div class="rank-avatar">${top3Players[1].avatar}</div>
                <div class="rank-name">${top3Players[1].name}</div>
                <div class="rank-score">🎮 ${top3Players[1].score.toLocaleString()}</div>
                <div class="rank-combo">⚡ Combo: ${
                  top3Players[1].maxCombo
                }</div>
                ${
                  top3Players[1].status === "Victoria"
                    ? '<div style="color: #4CAF50; margin-top: 5px;">🏆 Victoria</div>'
                    : '<div style="color: #FF5722; margin-top: 5px;">💀 Derrota</div>'
                }
            </div>

            <!-- Primer Lugar -->
            <div class="hell-ranking-position first">
                <div class="rank-number first">🥇</div>
                <div class="rank-avatar">${top3Players[0].avatar}</div>
                <div class="rank-name">${top3Players[0].name}</div>
                <div class="rank-score">🎮 ${top3Players[0].score.toLocaleString()}</div>
                <div class="rank-combo">⚡ Combo: ${
                  top3Players[0].maxCombo
                }</div>
                ${
                  top3Players[0].status === "Victoria"
                    ? '<div style="color: #4CAF50; margin-top: 5px;">🏆 Victoria</div>'
                    : '<div style="color: #FF5722; margin-top: 5px;">💀 Derrota</div>'
                }
                <div style="color: #FFD700; margin-top: 8px; font-size: 0.9rem;">👑 CAMPEÓN ACTUAL</div>
            </div>

            <!-- Tercer Lugar -->
            <div class="hell-ranking-position third">
                <div class="rank-number third">🥉</div>
                <div class="rank-avatar">${top3Players[2].avatar}</div>
                <div class="rank-name">${top3Players[2].name}</div>
                <div class="rank-score">🎮 ${top3Players[2].score.toLocaleString()}</div>
                <div class="rank-combo">⚡ Combo: ${
                  top3Players[2].maxCombo
                }</div>
                ${
                  top3Players[2].status === "Victoria"
                    ? '<div style="color: #4CAF50; margin-top: 5px;">🏆 Victoria</div>'
                    : '<div style="color: #FF5722; margin-top: 5px;">💀 Derrota</div>'
                }
            </div>
        </div>
        
        <div class="text-center mt-4">
            <p style="color: #cccccc; font-size: 0.9rem; margin-bottom: 20px;">
                <i class="fas fa-sync-alt me-1"></i>
                Ranking actualizado en tiempo real desde Google Sheets
            </p>
            
            <div class="d-flex justify-content-center gap-3 flex-wrap">
                <button onclick="loadTop3Ranking()" class="btn btn-gaming">
                    <i class="fas fa-sync-alt me-2"></i>Actualizar Ranking
                </button>
                
                <a href="../../juegosss/juegosss.html" class="btn btn-hell-play">
                    <i class="fas fa-play me-2"></i>¡Desafía el Ranking!
                </a>
            </div>
        </div>
    `;

  container.innerHTML = podiumHTML;

  // Agregar animación de entrada
  const positions = container.querySelectorAll(".hell-ranking-position");
  positions.forEach((position, index) => {
    position.style.opacity = "0";
    position.style.transform = "translateY(50px)";

    setTimeout(() => {
      position.style.transition = "all 0.6s ease";
      position.style.opacity = "1";
      position.style.transform = "translateY(0)";
    }, index * 200);
  });
}

/**
 * Formatea el tiempo en formato legible
 */
function formatTime(seconds) {
  if (seconds < 60) {
    return `${seconds}s`;
  } else {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }
}

/**
 * Determina el color del combo según su valor
 */
function getComboColor(combo) {
  if (combo >= 50) return "#FFD700"; // Dorado
  if (combo >= 30) return "#FF00FF"; // Magenta
  if (combo >= 20) return "#00FFFF"; // Cian
  if (combo >= 10) return "#FFA500"; // Naranja
  return "#FF6B00"; // Rojo-naranja
}

/**
 * Obtiene un mensaje motivacional según la posición
 */
function getMotivationalMessage(position) {
  const messages = {
    1: "¡Eres una leyenda viviente!",
    2: "¡Muy cerca de la cima!",
    3: "¡En el podio de honor!",
    default: "¡Sigue luchando, Hell te espera!",
  };

  return messages[position] || messages.default;
}

// Hacer las funciones disponibles globalmente
window.loadTop3Ranking = loadTop3Ranking;

console.log("🏆 Sistema de ranking de Hell Shooter cargado");
