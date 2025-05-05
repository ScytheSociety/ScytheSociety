/**
 * ro-missions.js - Carga y gestiona las misiones de Ragnarok Online
 * Scythe Society
 */

// Variables globales para la paginación
let allMissions = []; // Todas las misiones cargadas del JSON
let currentPage = 1; // Página actual
let missionsPerPage = 9; // Misiones por página
let totalPages = 1; // Total de páginas
let currentFilter = "all"; // Filtro actual
let currentSearchTerm = ""; // Término de búsqueda actual

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM cargado, iniciando carga de misiones...");

  // Obtener parámetros de URL para página actual
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("page")) {
    currentPage = parseInt(urlParams.get("page")) || 1;
  }
  if (urlParams.has("filter")) {
    currentFilter = urlParams.get("filter");
  }
  if (urlParams.has("search")) {
    currentSearchTerm = urlParams.get("search");
    // Establecer el valor en el campo de búsqueda
    const searchInput = document.getElementById("search-missions");
    if (searchInput) {
      searchInput.value = currentSearchTerm;
    }
  }

  // Inicializar carga de misiones
  loadMissions();

  // Inicializar filtros
  initFilters();

  // Inicializar buscador
  initSearch();

  // Inicializar controles de paginación
  initPagination();
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

  // Calcular la ruta al archivo JSON
  // Estamos en /pages/ro/romisiones.html, necesitamos subir dos niveles para llegar a raíz
  const baseUrl = "../../";
  const jsonUrl = baseUrl + "data/ro/romisiones.json";

  console.log("Intentando cargar JSON desde:", jsonUrl);

  // Mostrar spinner de carga
  missionsContainer.innerHTML = `
        <div class="col-12 text-center">
            <div class="spinner-border text-light" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-2">Cargando misiones...</p>
        </div>
    `;

  // Cargar misiones desde JSON
  fetch(jsonUrl)
    .then((response) => {
      console.log("Respuesta recibida:", response.status);
      if (!response.ok) {
        throw new Error("Error al cargar las misiones: " + response.status);
      }
      return response.json();
    })
    .then((missions) => {
      console.log("Misiones cargadas correctamente:", missions);

      // Guardar todas las misiones
      allMissions = missions;

      // Activar el filtro correspondiente
      document.querySelectorAll(".filter-btn").forEach((btn) => {
        if (btn.getAttribute("data-filter") === currentFilter) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });

      // Aplicar filtros y búsqueda si existen
      const filteredMissions = filterMissionsByCategory(
        allMissions,
        currentFilter
      );
      const searchedMissions = filterMissionsBySearch(
        filteredMissions,
        currentSearchTerm
      );

      // Calcular el total de páginas
      totalPages = Math.ceil(searchedMissions.length / missionsPerPage);

      // Asegurarse de que la página actual es válida
      if (currentPage > totalPages) {
        currentPage = 1;
      }

      // Mostrar las misiones de la página actual
      displayMissions(searchedMissions);

      // Actualizar paginación
      updatePagination();
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
    });
}

/**
 * Filtra las misiones por categoría
 */
function filterMissionsByCategory(missions, category) {
  if (category === "all") {
    return missions;
  }

  return missions.filter((mission) => mission.tags.includes(category));
}

/**
 * Filtra las misiones por término de búsqueda
 */
function filterMissionsBySearch(missions, searchTerm) {
  if (!searchTerm) {
    return missions;
  }

  searchTerm = searchTerm.toLowerCase();
  return missions.filter(
    (mission) =>
      mission.titulo.toLowerCase().includes(searchTerm) ||
      mission.descripcion.toLowerCase().includes(searchTerm)
  );
}

/**
 * Muestra las misiones en el contenedor
 */
// Modificar la función displayMissions() para incluir la fecha
function displayMissions(missions) {
  const missionsContainer = document.getElementById("missions-container");

  if (!missionsContainer) return;

  // Limpiar el contenedor
  missionsContainer.innerHTML = "";

  // Si no hay misiones, mostrar mensaje
  if (!missions || missions.length === 0) {
    missionsContainer.innerHTML = `
            <div class="col-12 text-center">
                <p>No hay misiones disponibles con los filtros seleccionados.</p>
            </div>
        `;
    return;
  }

  // Calcular misiones para la página actual
  const startIndex = (currentPage - 1) * missionsPerPage;
  const endIndex = Math.min(startIndex + missionsPerPage, missions.length);
  const currentPageMissions = missions.slice(startIndex, endIndex);

  // Calcular la ruta base para las imágenes y URLs
  const baseUrl = "../../";

  // Mostrar cada misión
  currentPageMissions.forEach((mission) => {
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

    // Formatear la fecha
    let fechaFormateada = "";
    if (mission.fecha) {
      const fecha = new Date(mission.fecha);
      fechaFormateada = fecha.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
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

    // Asegurarnos de que la ruta de la imagen sea correcta
    const imagePath =
      baseUrl +
      (mission.imagen.startsWith("/")
        ? mission.imagen.substring(1)
        : mission.imagen);

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
                    
                    ${
                      fechaFormateada
                        ? `<p class="mission-date"><i class="far fa-calendar-alt me-2"></i>${fechaFormateada}</p>`
                        : ""
                    }
                    
                    <div class="mb-3">
                        ${rewardsHTML}
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="text-muted">Nivel recomendado: ${
                          mission.nivel
                        }</span>
                        <a href="${
                          baseUrl +
                          (mission.url.startsWith("/")
                            ? mission.url.substring(1)
                            : mission.url)
                        }" class="btn btn-sm btn-gaming">Ver Guía</a>
                    </div>
                </div>
            </div>
        `;

    // Agregar al contenedor
    missionsContainer.innerHTML += missionHTML;
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
      currentFilter = filter;

      // Resetear a la primera página
      currentPage = 1;

      // Aplicar filtros y búsqueda
      const filteredMissions = filterMissionsByCategory(
        allMissions,
        currentFilter
      );
      const searchedMissions = filterMissionsBySearch(
        filteredMissions,
        currentSearchTerm
      );

      // Calcular el total de páginas
      totalPages = Math.ceil(searchedMissions.length / missionsPerPage);

      // Mostrar las misiones filtradas
      displayMissions(searchedMissions);

      // Actualizar paginación
      updatePagination();

      // Actualizar URL para reflejar el filtro
      updateURL();
    });
  });
}

/**
 * Inicializa el buscador de misiones
 */
function initSearch() {
  const searchInput = document.getElementById("search-missions");

  if (searchInput) {
    // Establecer el valor inicial si hay un término de búsqueda
    if (currentSearchTerm) {
      searchInput.value = currentSearchTerm;
    }

    searchInput.addEventListener("input", function () {
      currentSearchTerm = this.value.toLowerCase();

      // Resetear a la primera página
      currentPage = 1;

      // Aplicar filtros y búsqueda
      const filteredMissions = filterMissionsByCategory(
        allMissions,
        currentFilter
      );
      const searchedMissions = filterMissionsBySearch(
        filteredMissions,
        currentSearchTerm
      );

      // Calcular el total de páginas
      totalPages = Math.ceil(searchedMissions.length / missionsPerPage);

      // Mostrar las misiones filtradas
      displayMissions(searchedMissions);

      // Actualizar paginación
      updatePagination();

      // Actualizar URL para reflejar la búsqueda
      updateURL();
    });
  }
}

/**
 * Inicializa la paginación
 */
function initPagination() {
  // Los enlaces de paginación se generan dinámicamente en updatePagination()
  // Este método se usa para configurar cualquier comportamiento común

  // Delegación de eventos para los botones de paginación
  document.addEventListener("click", function (e) {
    // Verificar si se hizo clic en un enlace de paginación
    if (e.target.closest(".page-link")) {
      e.preventDefault();

      const pageLink = e.target.closest(".page-link");
      const pageItem = pageLink.closest(".page-item");

      // Si está deshabilitado, no hacer nada
      if (pageItem.classList.contains("disabled")) {
        return;
      }

      // Obtener la página a la que navegar
      let targetPage = pageLink.getAttribute("data-page");

      if (targetPage === "prev") {
        targetPage = currentPage - 1;
      } else if (targetPage === "next") {
        targetPage = currentPage + 1;
      } else {
        targetPage = parseInt(targetPage);
      }

      // Verificar que la página es válida
      if (targetPage >= 1 && targetPage <= totalPages) {
        currentPage = targetPage;

        // Aplicar filtros y búsqueda
        const filteredMissions = filterMissionsByCategory(
          allMissions,
          currentFilter
        );
        const searchedMissions = filterMissionsBySearch(
          filteredMissions,
          currentSearchTerm
        );

        // Mostrar las misiones de la página seleccionada
        displayMissions(searchedMissions);

        // Actualizar paginación
        updatePagination();

        // Actualizar URL para reflejar la página
        updateURL();

        // Hacer scroll hacia arriba
        window.scrollTo({
          top: document.querySelector(".main-content").offsetTop,
          behavior: "smooth",
        });
      }
    }
  });
}

/**
 * Actualiza la paginación según el estado actual
 */
function updatePagination() {
  const paginationContainer = document.querySelector(".pagination");

  if (!paginationContainer) return;

  // Generar HTML para la paginación
  let paginationHTML = "";

  // Botón "Anterior"
  paginationHTML += `
        <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
            <a class="page-link" href="#" data-page="prev" tabindex="-1" ${
              currentPage === 1 ? 'aria-disabled="true"' : ""
            }>Anterior</a>
        </li>
    `;

  // Decidir qué páginas mostrar
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);

  // Ajustar si estamos cerca del final
  if (endPage - startPage < 4) {
    startPage = Math.max(1, endPage - 4);
  }

  // Páginas
  for (let i = startPage; i <= endPage; i++) {
    paginationHTML += `
            <li class="page-item ${i === currentPage ? "active" : ""}">
                <a class="page-link" href="#" data-page="${i}">${i}</a>
            </li>
        `;
  }

  // Botón "Siguiente"
  paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
            <a class="page-link" href="#" data-page="next" ${
              currentPage === totalPages ? 'aria-disabled="true"' : ""
            }>Siguiente</a>
        </li>
    `;

  // Actualizar el HTML
  paginationContainer.innerHTML = paginationHTML;
}

/**
 * Actualiza la URL para reflejar el estado actual (página, filtro, búsqueda)
 */
function updateURL() {
  const searchParams = new URLSearchParams();

  // Añadir página actual
  if (currentPage > 1) {
    searchParams.set("page", currentPage);
  }

  // Añadir filtro actual
  if (currentFilter !== "all") {
    searchParams.set("filter", currentFilter);
  }

  // Añadir término de búsqueda
  if (currentSearchTerm) {
    searchParams.set("search", currentSearchTerm);
  }

  // Actualizar URL sin recargar la página
  const newURL =
    window.location.pathname +
    (searchParams.toString() ? "?" + searchParams.toString() : "");
  window.history.pushState({ path: newURL }, "", newURL);
}
