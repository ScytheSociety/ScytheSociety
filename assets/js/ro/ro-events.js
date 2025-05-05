/**
 * ro-events.js - Carga y gestiona los eventos de Ragnarok Online
 * Scythe Society
 */

// Variables globales para la paginación
let allEvents = []; // Todos los eventos cargados del JSON
let currentPage = 1; // Página actual
let eventsPerPage = 6; // Eventos por página
let totalPages = 1; // Total de páginas
let currentFilter = "all"; // Filtro actual
let currentSearchTerm = ""; // Término de búsqueda actual

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM cargado, iniciando carga de eventos...");

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
    const searchInput = document.getElementById("search-events");
    if (searchInput) {
      searchInput.value = currentSearchTerm;
    }
  }

  // Inicializar carga de eventos
  loadEvents();

  // Inicializar filtros
  initFilters();

  // Inicializar buscador
  initSearch();

  // Inicializar controles de paginación
  initPagination();
});

/**
 * Carga los eventos desde el archivo JSON
 */
function loadEvents() {
  const eventsContainer = document.getElementById("events-container");

  if (!eventsContainer) {
    console.error("No se encontró el contenedor de eventos");
    return;
  }

  console.log("Intentando cargar eventos desde JSON...");

  // Calcular la ruta al archivo JSON
  // Estamos en /pages/ro/roeventos.html, necesitamos subir dos niveles para llegar a raíz
  const baseUrl = "../../";
  const jsonUrl = baseUrl + "data/ro/roeventos.json";

  console.log("Intentando cargar JSON desde:", jsonUrl);

  // Mostrar spinner de carga
  eventsContainer.innerHTML = `
      <div class="col-12 text-center">
          <div class="spinner-border text-light" role="status">
              <span class="visually-hidden">Cargando...</span>
          </div>
          <p class="mt-2">Cargando eventos...</p>
      </div>
  `;

  // Cargar eventos desde JSON
  fetch(jsonUrl)
    .then((response) => {
      console.log("Respuesta recibida:", response.status);
      if (!response.ok) {
        throw new Error("Error al cargar los eventos: " + response.status);
      }
      return response.json();
    })
    .then((events) => {
      console.log("Eventos cargados correctamente:", events);

      // Guardar todos los eventos
      allEvents = events;

      // Activar el filtro correspondiente
      document.querySelectorAll(".filter-btn").forEach((btn) => {
        if (btn.getAttribute("data-filter") === currentFilter) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });

      // Aplicar filtros y búsqueda si existen
      const filteredEvents = filterEventsByCategory(allEvents, currentFilter);
      const searchedEvents = filterEventsBySearch(
        filteredEvents,
        currentSearchTerm
      );

      // Calcular el total de páginas
      totalPages = Math.ceil(searchedEvents.length / eventsPerPage);

      // Asegurarse de que la página actual es válida
      if (currentPage > totalPages) {
        currentPage = 1;
      }

      // Mostrar los eventos de la página actual
      displayEvents(searchedEvents);

      // Actualizar paginación
      updatePagination();
    })
    .catch((error) => {
      console.error("Error cargando eventos:", error);
      eventsContainer.innerHTML = `
        <div class="col-12">
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                No se pudieron cargar los eventos. Por favor, intenta de nuevo más tarde.
                <br>
                Detalles: ${error.message}
            </div>
        </div>
      `;
    });
}

/**
 * Filtra los eventos por categoría
 */
function filterEventsByCategory(events, category) {
  if (category === "all") {
    return events;
  } else if (category === "active") {
    return events.filter((event) => event.estado === "active");
  } else if (category === "upcoming") {
    return events.filter((event) => event.estado === "upcoming");
  } else {
    return events.filter((event) => event.tags.includes(category));
  }
}

/**
 * Filtra los eventos por término de búsqueda
 */
function filterEventsBySearch(events, searchTerm) {
  if (!searchTerm) {
    return events;
  }

  searchTerm = searchTerm.toLowerCase();
  return events.filter(
    (event) =>
      event.titulo.toLowerCase().includes(searchTerm) ||
      event.descripcion.toLowerCase().includes(searchTerm)
  );
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
      currentFilter = this.getAttribute("data-filter");

      // Resetear a la primera página
      currentPage = 1;

      // Aplicar filtros y búsqueda
      const filteredEvents = filterEventsByCategory(allEvents, currentFilter);
      const searchedEvents = filterEventsBySearch(
        filteredEvents,
        currentSearchTerm
      );

      // Calcular el total de páginas
      totalPages = Math.ceil(searchedEvents.length / eventsPerPage);

      // Mostrar los eventos filtrados
      displayEvents(searchedEvents);

      // Actualizar paginación
      updatePagination();

      // Actualizar URL para reflejar el filtro
      updateURL();
    });
  });
}

/**
 * Inicializa el buscador de eventos
 */
function initSearch() {
  const searchInput = document.getElementById("search-events");

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
      const filteredEvents = filterEventsByCategory(allEvents, currentFilter);
      const searchedEvents = filterEventsBySearch(
        filteredEvents,
        currentSearchTerm
      );

      // Calcular el total de páginas
      totalPages = Math.ceil(searchedEvents.length / eventsPerPage);

      // Mostrar los eventos filtrados
      displayEvents(searchedEvents);

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
        const filteredEvents = filterEventsByCategory(allEvents, currentFilter);
        const searchedEvents = filterEventsBySearch(
          filteredEvents,
          currentSearchTerm
        );

        // Mostrar los eventos de la página seleccionada
        displayEvents(searchedEvents);

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

/**
 * Muestra los eventos en el contenedor
 */
function displayEvents(events) {
  const eventsContainer = document.getElementById("events-container");

  if (!eventsContainer) return;

  // Limpiar el contenedor
  eventsContainer.innerHTML = "";

  // Si no hay eventos, mostrar mensaje
  if (!events || events.length === 0) {
    eventsContainer.innerHTML = `
        <div class="col-12 text-center">
            <p>No hay eventos disponibles con los filtros seleccionados.</p>
        </div>
    `;
    return;
  }

  // Calcular eventos para la página actual
  const startIndex = (currentPage - 1) * eventsPerPage;
  const endIndex = Math.min(startIndex + eventsPerPage, events.length);
  const currentPageEvents = events.slice(startIndex, endIndex);

  // Calcular la ruta base para las imágenes y URLs
  const baseUrl = "../../";

  // Mostrar cada evento
  currentPageEvents.forEach((event) => {
    // Determinar estado del evento
    let statusClass = "";
    let statusText = "";

    if (event.estado === "active") {
      statusClass = "status-active";
      statusText = "Activo";
    } else if (event.estado === "upcoming") {
      statusClass = "status-upcoming";
      statusText = "Próximo";
    } else if (event.estado === "expired") {
      statusClass = "status-expired";
      statusText = "Finalizado";
    }

    // Asegurarnos de que la ruta de la imagen sea correcta
    const imagePath =
      baseUrl +
      (event.imagen.startsWith("/") ? event.imagen.substring(1) : event.imagen);

    // Asegurarnos de que la URL sea correcta
    const eventUrl =
      baseUrl +
      (event.url.startsWith("/") ? event.url.substring(1) : event.url);

    // Crear HTML del evento
    const eventHTML = `
        <div class="col-lg-4 col-md-6 mb-4 event-card" data-categories="${event.tags.join(
          " "
        )}" data-title="${event.titulo.toLowerCase()}" data-status="${
      event.estado
    }">
            <div class="content-card h-100 position-relative">
                <div class="date-badge">${event.fecha}</div>
                <div class="event-image">
                    <img src="${imagePath}" alt="${event.titulo}">
                </div>
                <div class="p-3">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h4 class="text-white">${event.titulo}</h4>
                        <span class="event-status ${statusClass}">${statusText}</span>
                    </div>
                    
                    <p>${event.descripcion}</p>
                    
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <span class="text-white">${event.duracion}</span>
                        <a href="${eventUrl}" class="btn btn-sm btn-gaming">Ver Detalles</a>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Agregar al contenedor
    eventsContainer.innerHTML += eventHTML;
  });
}
