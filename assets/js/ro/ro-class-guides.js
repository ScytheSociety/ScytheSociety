/**
 * ro-class-guides.js - Carga y gestiona las guías de clases de Ragnarok Online
 * Scythe Society
 */

document.addEventListener("DOMContentLoaded", function () {
  // Inicializar carga de guías
  loadClassGuides();

  // Inicializar filtros
  initFilters();

  // Inicializar buscador
  initSearch();
});

// Variables globales para almacenar datos y filtros actuales
let allGuides = [];
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

/**
 * Carga las guías de clases desde el archivo JSON
 */
function loadClassGuides() {
  const guidesContainer = document.getElementById("guides-container");

  if (!guidesContainer) {
    console.error("No se encontró el contenedor de guías");
    return;
  }

  // Cargar guías desde JSON
  fetch("/data/ro/roguiaclases.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error al cargar las guías: " + response.status);
      }
      return response.json();
    })
    .then((data) => {
      // Guardar datos en variable global
      allGuides = data.guides;

      // Cargar los filtros dinámicos (jobs según modos)
      loadJobFilters(data.jobCategories);

      // Mostrar todas las guías
      displayGuides(allGuides);
    })
    .catch((error) => {
      console.error("Error:", error);
      guidesContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger" role="alert">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        No se pudieron cargar las guías. Por favor, intenta de nuevo más tarde.
                    </div>
                </div>
            `;
    });
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
    fetch("/data/ro/roguiaclases.json")
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

  // Inicializar filtros de job en el dropdown
  document.querySelectorAll("#job-filters .dropdown-item").forEach((item) => {
    item.addEventListener("click", handleFilterClick);
  });
}

/**
 * Inicializa el buscador
 */
function initSearch() {
  const searchInput = document.getElementById("search-guides");

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      currentFilters.search = this.value.toLowerCase();
      applyFilters();
    });
  }
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

  // Mostrar guías filtradas
  displayGuides(filteredGuides);
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
  if (guides.length === 0) {
    guidesContainer.innerHTML = `
            <div class="col-12 text-center">
                <p>No se encontraron guías con los filtros seleccionados.</p>
            </div>
        `;
    return;
  }

  // Mostrar cada guía
  guides.forEach((guide) => {
    // Preparar badge de modo
    let modeBadges = "";
    guide.tags.forEach((tag) => {
      if (modeLabels[tag]) {
        modeBadges += `<span class="mode-badge mode-${tag}">${modeLabels[tag]}</span>`;
      }
    });

    // Crear HTML de la guía
    const guideHTML = `
            <div class="col-lg-6 col-md-12 mb-4 guide-card">
                <div class="content-card h-100">
                    <div class="p-3">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <h4>${guide.titulo}</h4>
                            <div>${modeBadges}</div>
                        </div>
                        
                        <p>${guide.descripcion}</p>
                        
                        <div>
                            <span class="job-badge bg-secondary text-white">${guide.job}</span>
                        </div>
                        
                        <div class="d-flex justify-content-between align-items-center mt-3">
                            <span class="text-muted">Última actualización: ${guide.actualizacion}</span>
                            <a href="${guide.url}" class="btn btn-sm btn-gaming">Ver Guía</a>
                        </div>
                    </div>
                </div>
            </div>
        `;

    // Agregar al contenedor
    guidesContainer.innerHTML += guideHTML;
  });
}
