/**
 * ro-class-guides.js - Carga y gestiona las guías de clases de Ragnarok Online
 * Scythe Society
 */

// Variables globales para la paginación
let allGuides = []; // Todas las guías cargadas del JSON
let currentPage = 1; // Página actual
let guidesPerPage = 10; // Guías por página
let totalPages = 1; // Total de páginas
let currentFilters = {
  mode: "all",
  job: "all",
  search: "",
};

// Mapeo de modos para etiquetas visuales
const modeLabels = {
  pvm: "PvM",
  woe: "WoE",
  woete: "WoE TE",
  exp: "EXP",
  drop: "DROP",
  dodge: "DODGE",
};

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM cargado, iniciando carga de guías de clases...");

  // Obtener parámetros de URL para página actual
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("page")) {
    currentPage = parseInt(urlParams.get("page")) || 1;
  }
  if (urlParams.has("mode")) {
    currentFilters.mode = urlParams.get("mode");
  }
  if (urlParams.has("job")) {
    currentFilters.job = urlParams.get("job");
  }
  if (urlParams.has("search")) {
    currentFilters.search = urlParams.get("search");
    // Establecer el valor en el campo de búsqueda
    const searchInput = document.getElementById("search-guides");
    if (searchInput) {
      searchInput.value = currentFilters.search;
    }
  }

  // Inicializar carga de guías
  loadClassGuides();

  // Inicializar filtros
  initFilters();

  // Inicializar buscador
  initSearch();

  // Inicializar controles de paginación
  initPagination();
});

/**
 * Carga las guías de clases desde el archivo JSON
 */
function loadClassGuides() {
  const guidesContainer = document.getElementById("guides-container");

  if (!guidesContainer) {
    console.error("No se encontró el contenedor de guías");
    return;
  }

  console.log("Intentando cargar guías desde JSON...");

  // Calcular la ruta al archivo JSON
  // Estamos en /pages/ro/roguiaclases.html, necesitamos subir dos niveles para llegar a raíz
  const baseUrl = "../../";
  const jsonUrl = baseUrl + "data/ro/roguiaclases.json";

  console.log("Intentando cargar JSON desde:", jsonUrl);

  // Mostrar spinner de carga
  guidesContainer.innerHTML = `
      <div class="col-12 text-center">
          <div class="spinner-border text-light" role="status">
              <span class="visually-hidden">Cargando...</span>
          </div>
          <p class="mt-2">Cargando guías...</p>
      </div>
  `;

  // Cargar guías desde JSON
  fetch(jsonUrl)
    .then((response) => {
      console.log("Respuesta recibida:", response.status);
      if (!response.ok) {
        throw new Error("Error al cargar las guías: " + response.status);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Guías cargadas correctamente:", data);

      // Guardar datos en variable global
      allGuides = data.guides;

      // Activar los filtros correspondientes según la URL
      activateFiltersFromURL();

      // Cargar los filtros dinámicos (jobs según modos)
      loadJobFilters(data.jobCategories);

      // Aplicar filtros iniciales
      applyFilters();
    })
    .catch((error) => {
      console.error("Error cargando guías:", error);
      guidesContainer.innerHTML = `
        <div class="col-12">
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                No se pudieron cargar las guías. Por favor, intenta de nuevo más tarde.
                <br>
                Detalles: ${error.message}
            </div>
        </div>
      `;
    });
}

/**
 * Activa los filtros según los parámetros de la URL
 */
function activateFiltersFromURL() {
  // Activar filtro de modo
  if (currentFilters.mode !== "all") {
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      if (btn.getAttribute("data-filter") === currentFilters.mode) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  // El filtro de job se activará después de cargar los filtros dinámicos
}

/**
 * Carga los filtros de jobs según el modo seleccionado
 */
function loadJobFilters(jobCategories) {
  const jobFilters = document.getElementById("job-filters");

  if (!jobFilters) return;

  // Limpiar contenido actual excepto el "Todas las Clases"
  const allJobsOption = jobFilters.querySelector("li");
  jobFilters.innerHTML = "";
  jobFilters.appendChild(allJobsOption);

  // Si tenemos un modo seleccionado, mostrar solo esos jobs
  if (currentFilters.mode !== "all") {
    const category = jobCategories[currentFilters.mode];
    if (category) {
      category.forEach((job) => {
        addJobToFilter(job, jobFilters);
      });
    }
  } else {
    // Si el modo es "all", mostrar todos los jobs únicos
    const uniqueJobs = new Set();

    Object.values(jobCategories).forEach((jobs) => {
      jobs.forEach((job) => uniqueJobs.add(job));
    });

    [...uniqueJobs].sort().forEach((job) => {
      addJobToFilter(job, jobFilters);
    });
  }

  // Activar el filtro de job si está en la URL
  if (currentFilters.job !== "all") {
    const jobItems = document.querySelectorAll("#job-filters .dropdown-item");
    jobItems.forEach((item) => {
      if (item.getAttribute("data-filter") === currentFilters.job) {
        item.classList.add("active");
        const dropdownToggle = document.getElementById("jobDropdown");
        if (dropdownToggle) {
          dropdownToggle.textContent = currentFilters.job;
        }
      }
    });
  }
}

/**
 * Agrega un job al filtro dropdown
 */
function addJobToFilter(job, container) {
  const li = document.createElement("li");
  li.innerHTML = `<a class="dropdown-item" href="#" data-filter="${job}" data-type="job">${job}</a>`;
  container.appendChild(li);

  // Agregar evento click
  const link = li.querySelector("a");
  link.addEventListener("click", handleFilterClick);
}

/**
 * Maneja el click en filtros (tanto los botones de modo como los dropdowns de jobs)
 */
function handleFilterClick(e) {
  e.preventDefault();

  const filterType = this.getAttribute("data-type");
  const filterValue = this.getAttribute("data-filter");

  // Actualizar estado de filtros
  if (filterType === "mode") {
    currentFilters.mode = filterValue;

    // Actualizar clases activas de botones
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    this.classList.add("active");

    // Resetear filtro de job cuando cambia el modo
    currentFilters.job = "all";

    // Actualizar filtros de job según el modo seleccionado
    const baseUrl = "../../";
    const jsonUrl = baseUrl + "data/ro/roguiaclases.json";

    fetch(jsonUrl)
      .then((response) => response.json())
      .then((data) => {
        loadJobFilters(data.jobCategories);
      });

    // Actualizar texto del dropdown de job
    const jobDropdown = document.getElementById("jobDropdown");
    if (jobDropdown) {
      jobDropdown.textContent = "Clase";
    }
  } else if (filterType === "job") {
    currentFilters.job = filterValue;

    // Actualizar clases activas en dropdown
    const parentMenu = this.closest(".dropdown-menu");
    parentMenu.querySelectorAll(".dropdown-item").forEach((item) => {
      item.classList.remove("active");
    });
    this.classList.add("active");

    // Actualizar texto del botón dropdown
    const dropdownToggle =
      this.closest(".dropdown").querySelector(".dropdown-toggle");
    if (filterValue === "all") {
      dropdownToggle.textContent = "Clase";
    } else {
      dropdownToggle.textContent = filterValue;
    }
  }

  // Resetear a primera página
  currentPage = 1;

  // Aplicar filtros
  applyFilters();
}

/**
 * Inicializa los filtros y buscador
 */
function initFilters() {
  // Inicializar filtros de modo
  document.querySelectorAll(".filter-btn").forEach((button) => {
    button.addEventListener("click", handleFilterClick);
  });

  // Los filtros de job se inicializan en loadJobFilters
}

/**
 * Inicializa el buscador
 */
function initSearch() {
  const searchInput = document.getElementById("search-guides");

  if (searchInput) {
    // Establecer el valor inicial si hay un término de búsqueda
    if (currentFilters.search) {
      searchInput.value = currentFilters.search;
    }

    searchInput.addEventListener("input", function () {
      currentFilters.search = this.value.toLowerCase();
      // Resetear a primera página
      currentPage = 1;
      applyFilters();
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

        // Mostrar las guías de la página seleccionada
        applyFilters();

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
 * Actualiza la URL para reflejar el estado actual
 */
function updateURL() {
  const searchParams = new URLSearchParams();

  // Añadir página actual
  if (currentPage > 1) {
    searchParams.set("page", currentPage);
  }

  // Añadir filtros actuales
  if (currentFilters.mode !== "all") {
    searchParams.set("mode", currentFilters.mode);
  }

  if (currentFilters.job !== "all") {
    searchParams.set("job", currentFilters.job);
  }

  // Añadir término de búsqueda
  if (currentFilters.search) {
    searchParams.set("search", currentFilters.search);
  }

  // Actualizar URL sin recargar la página
  const newURL =
    window.location.pathname +
    (searchParams.toString() ? "?" + searchParams.toString() : "");
  window.history.pushState({ path: newURL }, "", newURL);
}

/**
 * Aplica los filtros actuales y muestra los resultados
 */
function applyFilters() {
  let filteredGuides = [...allGuides];

  // Filtrar por modo
  if (currentFilters.mode !== "all") {
    filteredGuides = filteredGuides.filter((guide) =>
      guide.tags.includes(currentFilters.mode)
    );
  }

  // Filtrar por job
  if (currentFilters.job !== "all") {
    filteredGuides = filteredGuides.filter(
      (guide) => guide.job === currentFilters.job
    );
  }

  // Filtrar por búsqueda
  if (currentFilters.search) {
    filteredGuides = filteredGuides.filter(
      (guide) =>
        guide.titulo.toLowerCase().includes(currentFilters.search) ||
        guide.descripcion.toLowerCase().includes(currentFilters.search) ||
        guide.job.toLowerCase().includes(currentFilters.search)
    );
  }

  // Calcular el total de páginas
  totalPages = Math.ceil(filteredGuides.length / guidesPerPage);

  // Asegurarse de que la página actual es válida
  if (currentPage > totalPages) {
    currentPage = Math.max(1, totalPages);
  }

  // Mostrar guías filtradas
  displayGuides(filteredGuides);

  // Actualizar paginación
  updatePagination();

  // Actualizar URL
  updateURL();
}

/**
 * Muestra las guías en el contenedor
 */
function displayGuides(guides) {
  const guidesContainer = document.getElementById("guides-container");

  if (!guidesContainer) return;

  // Limpiar el contenedor
  guidesContainer.innerHTML = "";

  // Si no hay guías, mostrar mensaje
  if (!guides || guides.length === 0) {
    guidesContainer.innerHTML = `
        <div class="col-12 text-center">
            <p>No hay guías disponibles con los filtros seleccionados.</p>
        </div>
    `;
    return;
  }

  // Calcular guías para la página actual
  const startIndex = (currentPage - 1) * guidesPerPage;
  const endIndex = Math.min(startIndex + guidesPerPage, guides.length);
  const currentPageGuides = guides.slice(startIndex, endIndex);

  // Calcular la ruta base para las URLs
  const baseUrl = "../../";

  // Mostrar cada guía
  currentPageGuides.forEach((guide) => {
    // Preparar badge de modo
    let modeBadges = "";
    guide.tags.forEach((tag) => {
      if (modeLabels[tag]) {
        modeBadges += `<span class="mode-badge mode-${tag}">${modeLabels[tag]}</span>`;
      }
    });

    // Asegurarnos de que la URL sea correcta
    const guideUrl =
      baseUrl +
      (guide.url.startsWith("/") ? guide.url.substring(1) : guide.url);

    // Crear HTML de la guía
    const guideHTML = `
        <div class="col-lg-6 col-md-12 mb-4 guide-card">
            <div class="content-card h-100">
                <div class="p-3">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h4 class="text-white">${guide.titulo}</h4>
                        <div>${modeBadges}</div>
                    </div>
                    
                    <p>${guide.descripcion}</p>
                    
                    <div>
                        <span class="job-badge bg-secondary text-white">${guide.job}</span>
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <span class="text-white">Última actualización: ${guide.actualizacion}</span>
                        <a href="${guideUrl}" class="btn btn-sm btn-gaming">Ver Guía</a>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Agregar al contenedor
    guidesContainer.innerHTML += guideHTML;
  });
}
