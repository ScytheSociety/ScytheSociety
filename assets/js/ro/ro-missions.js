/**
 * ro-missions.js - Carga y gestiona las misiones de Ragnarok Online
 * Scythe Society
 */

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM cargado, iniciando carga de misiones...");
  // Inicializar carga de misiones
  loadMissions();

  // Inicializar filtros
  initFilters();

  // Inicializar buscador
  initSearch();
});

/**
 * Carga las misiones desde el archivo JSON
 */
function loadMissions() {
  const missionsContainer = document.getElementById("missions-container");

  if (!missionsContainer) {
    console.error("No se encontró el contenedor de misiones");
    return;
  }

  console.log("Intentando cargar misiones desde JSON...");

  // Determinar la ruta base
  const isGitHubPages = window.location.hostname.includes("github.io");
  let basePath = isGitHubPages ? "/ScytheSociety" : "";

  // Cargar misiones desde JSON (con mejor manejo de rutas)
  fetch(basePath + "/data/ro/romisiones.json")
    .then((response) => {
      console.log("Respuesta recibida:", response.status);
      if (!response.ok) {
        throw new Error("Error al cargar las misiones: " + response.status);
      }
      return response.json();
    })
    .then((missions) => {
      console.log("Misiones cargadas correctamente:", missions);

      // Limpiar el contenedor
      missionsContainer.innerHTML = "";

      // Si no hay misiones, mostrar mensaje
      if (!missions || missions.length === 0) {
        missionsContainer.innerHTML = `
                    <div class="col-12 text-center">
                        <p>No hay misiones disponibles en este momento.</p>
                    </div>
                `;
        return;
      }

      // Mostrar cada misión
      missions.forEach((mission) => {
        // Crear estrellas de dificultad
        let starsHTML = "";
        for (let i = 1; i <= 3; i++) {
          if (i <= mission.dificultad) {
            starsHTML +=
              '<span class="difficulty-indicator filled"><i class="fas fa-star"></i></span>';
          } else {
            starsHTML +=
              '<span class="difficulty-indicator empty"><i class="fas fa-star"></i></span>';
          }
        }

        // Crear tags de recompensas
        let rewardsHTML = "";
        if (mission.recompensas.exp > 0) {
          rewardsHTML += `<span class="reward-tag reward-exp">${mission.recompensas.exp.toLocaleString()} EXP</span>`;
        }

        mission.recompensas.items.forEach((item) => {
          rewardsHTML += `<span class="reward-tag reward-item">${item}</span>`;
        });

        if (mission.recompensas.zeny > 0) {
          rewardsHTML += `<span class="reward-tag reward-zeny">${mission.recompensas.zeny.toLocaleString()} Zeny</span>`;
        }

        mission.recompensas.skills.forEach((skill) => {
          rewardsHTML += `<span class="reward-tag reward-skill">${skill}</span>`;
        });

        // Asegurarnos de que las rutas de las imágenes sean correctas
        const imagePath = mission.imagen.startsWith("/")
          ? basePath + mission.imagen
          : basePath + "/" + mission.imagen;

        // Crear HTML de la misión
        const missionHTML = `
                    <div class="col-lg-4 col-md-6 mb-4 mission-card" data-categories="${mission.tags.join(
                      " "
                    )}" data-title="${mission.titulo.toLowerCase()}">
                        <div class="content-card h-100">
                            <div class="mission-image">
                                <img src="${imagePath}" alt="${mission.titulo}">
                            </div>
                            <div class="d-flex justify-content-between align-items-start mb-3">
                                <h4>${mission.titulo}</h4>
                                <div>
                                    ${starsHTML}
                                </div>
                            </div>
                            
                            <p>${mission.descripcion}</p>
                            
                            <div class="mb-3">
                                ${rewardsHTML}
                            </div>
                            
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="text-muted">Nivel recomendado: ${
                                  mission.nivel
                                }</span>
                                <a href="${
                                  basePath + mission.url
                                }" class="btn btn-sm btn-gaming">Ver Guía</a>
                            </div>
                        </div>
                    </div>
                `;

        // Agregar al contenedor
        missionsContainer.innerHTML += missionHTML;
      });
    })
    .catch((error) => {
      console.error("Error cargando misiones:", error);
      missionsContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger" role="alert">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        No se pudieron cargar las misiones. Por favor, intenta de nuevo más tarde.
                        <br>
                        Detalles: ${error.message}
                    </div>
                </div>
            `;

      // Intentar con una ruta alternativa
      if (isGitHubPages) {
        console.log("Intentando con ruta alternativa...");
        fetch("/ScytheSociety/data/ro/romisiones.json")
          .then((response) => response.json())
          .then((missions) => {
            console.log("Misiones cargadas desde ruta alternativa:", missions);
            // Lógica para mostrar las misiones
            // (similar al bloque anterior, pero se omite por brevedad)
          })
          .catch((altError) => {
            console.error("También falló la ruta alternativa:", altError);
          });
      }
    });
}

/**
 * Inicializa los filtros de categorías
 */
function initFilters() {
  const filterButtons = document.querySelectorAll(".filter-btn");

  filterButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Quitar clase active de todos los botones
      filterButtons.forEach((btn) => btn.classList.remove("active"));

      // Añadir clase active al botón clickeado
      this.classList.add("active");

      // Obtener filtro seleccionado
      const filter = this.getAttribute("data-filter");

      // Filtrar misiones
      filterMissions(filter);
    });
  });
}

/**
 * Filtra las misiones según la categoría seleccionada
 */
function filterMissions(filter) {
  const missionCards = document.querySelectorAll(".mission-card");
  const searchInput = document.getElementById("search-missions");
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";

  missionCards.forEach((card) => {
    const categories = card.getAttribute("data-categories");
    const title = card.getAttribute("data-title");

    // Verificar si coincide con el filtro y con la búsqueda
    const matchesFilter = filter === "all" || categories.includes(filter);
    const matchesSearch = !searchTerm || title.includes(searchTerm);

    if (matchesFilter && matchesSearch) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
}

/**
 * Inicializa el buscador de misiones
 */
function initSearch() {
  const searchInput = document.getElementById("search-missions");

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      // Obtener filtro activo actual
      const activeFilter = document.querySelector(".filter-btn.active");
      const filter = activeFilter
        ? activeFilter.getAttribute("data-filter")
        : "all";

      // Aplicar filtro con la búsqueda
      filterMissions(filter);
    });
  }
}
