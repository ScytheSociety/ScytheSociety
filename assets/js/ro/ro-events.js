/**
 * ro-events.js - Carga y gestiona los eventos de Ragnarok Online
 * Scythe Society
 */

document.addEventListener("DOMContentLoaded", function () {
  // Inicializar carga de eventos
  loadEvents();

  // Inicializar filtros
  initFilters();

  // Inicializar buscador
  initSearch();
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

  // Cargar eventos desde JSON
  fetch("/data/ro/roeventos.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error al cargar los eventos: " + response.status);
      }
      return response.json();
    })
    .then((events) => {
      // Limpiar el contenedor
      eventsContainer.innerHTML = "";

      // Mostrar cada evento
      events.forEach((event) => {
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
                                <img src="${event.imagen}" alt="${
          event.titulo
        }">
                            </div>
                            <div class="p-3">
                                <div class="d-flex justify-content-between align-items-start mb-3">
                                    <h4>${event.titulo}</h4>
                                    <span class="event-status ${statusClass}">${statusText}</span>
                                </div>
                                
                                <p>${event.descripcion}</p>
                                
                                <div class="d-flex justify-content-between align-items-center mt-3">
                                    <span class="text-muted">${
                                      event.duracion
                                    }</span>
                                    <a href="${
                                      event.url
                                    }" class="btn btn-sm btn-gaming">Ver Detalles</a>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

        // Agregar al contenedor
        eventsContainer.innerHTML += eventHTML;
      });
    })
    .catch((error) => {
      console.error("Error:", error);
      eventsContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger" role="alert">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        No se pudieron cargar los eventos. Por favor, intenta de nuevo más tarde.
                    </div>
                </div>
            `;
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

      // Filtrar eventos
      filterEvents(filter);
    });
  });
}

/**
 * Filtra los eventos según la categoría seleccionada
 */
function filterEvents(filter) {
  const eventCards = document.querySelectorAll(".event-card");
  const searchInput = document.getElementById("search-events");
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";

  eventCards.forEach((card) => {
    const categories = card.getAttribute("data-categories");
    const title = card.getAttribute("data-title");
    const status = card.getAttribute("data-status");

    // Verificar si coincide con el filtro y con la búsqueda
    let matchesFilter = false;

    if (filter === "all") {
      matchesFilter = true;
    } else if (filter === "active" && status === "active") {
      matchesFilter = true;
    } else if (filter === "upcoming" && status === "upcoming") {
      matchesFilter = true;
    } else if (categories && categories.includes(filter)) {
      matchesFilter = true;
    }

    const matchesSearch = !searchTerm || title.includes(searchTerm);

    if (matchesFilter && matchesSearch) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
}

/**
 * Inicializa el buscador de eventos
 */
function initSearch() {
  const searchInput = document.getElementById("search-events");

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      // Obtener filtro activo actual
      const activeFilter = document.querySelector(".filter-btn.active");
      const filter = activeFilter
        ? activeFilter.getAttribute("data-filter")
        : "all";

      // Aplicar filtro con la búsqueda
      filterEvents(filter);
    });
  }
}
