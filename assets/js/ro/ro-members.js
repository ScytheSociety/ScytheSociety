/**
 * ro-members.js - Carga y gestiona los miembros de Ragnarok Online
 * Scythe Society
 */

// Variables globales para la paginación
let allMembers = []; // Todos los miembros cargados del JSON
let currentPage = 1; // Página actual
let membersPerPage = 12; // Miembros por página
let totalPages = 1; // Total de páginas
let currentFilters = {
  clan: "all",
  clase: "all",
  nivel: "all",
  search: "",
};

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM cargado, iniciando carga de miembros...");

  // Obtener parámetros de URL para página actual
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("page")) {
    currentPage = parseInt(urlParams.get("page")) || 1;
  }
  if (urlParams.has("clan")) {
    currentFilters.clan = urlParams.get("clan");
  }
  if (urlParams.has("clase")) {
    currentFilters.clase = urlParams.get("clase");
  }
  if (urlParams.has("nivel")) {
    currentFilters.nivel = urlParams.get("nivel");
  }
  if (urlParams.has("search")) {
    currentFilters.search = urlParams.get("search");
    // Establecer el valor en el campo de búsqueda
    const searchInput = document.getElementById("search-members");
    if (searchInput) {
      searchInput.value = currentFilters.search;
    }
  }

  // Inicializar carga de miembros
  loadMembers();

  // Inicializar filtros y buscador
  initFilters();

  // Inicializar controles de paginación
  initPagination();
});

/**
 * Carga los miembros desde el archivo JSON
 */
function loadMembers() {
  const membersContainer = document.getElementById("members-container");

  if (!membersContainer) {
    console.error("No se encontró el contenedor de miembros");
    return;
  }

  console.log("Intentando cargar miembros desde JSON...");

  // Calcular la ruta al archivo JSON
  // Estamos en /pages/ro/romiembros.html, necesitamos subir dos niveles para llegar a raíz
  const baseUrl = "../../";
  const jsonUrl = baseUrl + "data/ro/romiembros.json";

  console.log("Intentando cargar JSON desde:", jsonUrl);

  // Mostrar spinner de carga
  membersContainer.innerHTML = `
      <div class="col-12 text-center">
          <div class="spinner-border text-light" role="status">
              <span class="visually-hidden">Cargando...</span>
          </div>
          <p class="mt-2">Cargando miembros...</p>
      </div>
  `;

  // Cargar miembros desde JSON
  fetch(jsonUrl)
    .then((response) => {
      console.log("Respuesta recibida:", response.status);
      if (!response.ok) {
        throw new Error("Error al cargar los miembros: " + response.status);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Miembros cargados correctamente:", data);

      // Guardar datos en variable global
      allMembers = data.members;

      // Cargar los filtros dinámicos (clases y clanes)
      loadDynamicFilters(data.clans, allMembers);

      // Activar los filtros correspondientes según la URL
      activateFiltersFromURL();

      // Aplicar filtros iniciales
      applyFilters();
    })
    .catch((error) => {
      console.error("Error cargando miembros:", error);
      membersContainer.innerHTML = `
        <div class="col-12">
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                No se pudieron cargar los miembros. Por favor, intenta de nuevo más tarde.
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
  // Activar filtro de clan
  if (currentFilters.clan !== "all") {
    const clanItems = document.querySelectorAll("#clan-filters .dropdown-item");
    clanItems.forEach((item) => {
      if (item.getAttribute("data-filter") === currentFilters.clan) {
        item.classList.add("active");
        const dropdownToggle = item
          .closest(".dropdown")
          .querySelector(".dropdown-toggle");
        dropdownToggle.textContent = item.textContent.trim();
      } else if (item.getAttribute("data-filter") === "all") {
        item.classList.remove("active");
      }
    });
  }

  // Activar filtro de clase
  if (currentFilters.clase !== "all") {
    const classItems = document.querySelectorAll(
      "#class-filters .dropdown-item"
    );
    classItems.forEach((item) => {
      if (item.getAttribute("data-filter") === currentFilters.clase) {
        item.classList.add("active");
        const dropdownToggle = item
          .closest(".dropdown")
          .querySelector(".dropdown-toggle");
        dropdownToggle.textContent = item.textContent.trim();
      } else if (item.getAttribute("data-filter") === "all") {
        item.classList.remove("active");
      }
    });
  }

  // Activar filtro de nivel
  if (currentFilters.nivel !== "all") {
    const levelItems = document.querySelectorAll('[data-type="level"]');
    levelItems.forEach((item) => {
      if (item.getAttribute("data-filter") === currentFilters.nivel) {
        item.classList.add("active");
        const dropdownToggle = item
          .closest(".dropdown")
          .querySelector(".dropdown-toggle");
        dropdownToggle.textContent = `Nivel ${currentFilters.nivel}`;
      } else if (item.getAttribute("data-filter") === "all") {
        item.classList.remove("active");
      }
    });
  }
}

/**
 * Carga los filtros dinámicos (clanes y clases)
 */
function loadDynamicFilters(clans, members) {
  // Cargar filtros de clanes
  const clanFilters = document.getElementById("clan-filters");
  if (clanFilters) {
    clans.forEach((clan) => {
      const li = document.createElement("li");

      // Ajustar la ruta del icono del clan
      const baseUrl = "../../";
      const iconPath =
        baseUrl +
        (clan.icon.startsWith("/") ? clan.icon.substring(1) : clan.icon);

      li.innerHTML = `<a class="dropdown-item" href="#" data-filter="${clan.id}" data-type="clan">
                <span class="clan-badge"><img src="${iconPath}" alt="${clan.nombre}"></span> ${clan.nombre}
            </a>`;
      clanFilters.appendChild(li);
    });
  }

  // Extraer clases únicas de los miembros
  const uniqueClasses = [
    ...new Set(members.map((member) => member.clase)),
  ].sort();

  // Cargar filtros de clases
  const classFilters = document.getElementById("class-filters");
  if (classFilters) {
    uniqueClasses.forEach((className) => {
      const li = document.createElement("li");
      li.innerHTML = `<a class="dropdown-item" href="#" data-filter="${className}" data-type="clase">${className}</a>`;
      classFilters.appendChild(li);
    });
  }

  // Agregar eventos de clic a todos los elementos de filtro
  initFilterClickEvents();
}

/**
 * Inicializa los eventos de clic para todos los filtros
 */
function initFilterClickEvents() {
  // Filtros de clan
  document.querySelectorAll("#clan-filters .dropdown-item").forEach((item) => {
    item.addEventListener("click", handleFilterClick);
  });

  // Filtros de clase
  document.querySelectorAll("#class-filters .dropdown-item").forEach((item) => {
    item.addEventListener("click", handleFilterClick);
  });

  // Filtros de nivel
  document.querySelectorAll('[data-type="level"]').forEach((item) => {
    item.addEventListener("click", handleFilterClick);
  });
}

/**
 * Maneja el click en filtros de dropdown
 */
function handleFilterClick(e) {
  e.preventDefault();

  // Marcar como activo
  const parentMenu = this.closest(".dropdown-menu");
  parentMenu.querySelectorAll(".dropdown-item").forEach((dropItem) => {
    dropItem.classList.remove("active");
  });
  this.classList.add("active");

  // Actualizar texto del botón
  const dropdownToggle =
    this.closest(".dropdown").querySelector(".dropdown-toggle");
  const filterType = this.getAttribute("data-type");
  const filterValue = this.getAttribute("data-filter");

  if (filterType === "clan") {
    if (filterValue === "all") {
      dropdownToggle.textContent = "Clan";
    } else {
      dropdownToggle.textContent = this.textContent.trim();
    }
    currentFilters.clan = filterValue;
  } else if (filterType === "clase") {
    if (filterValue === "all") {
      dropdownToggle.textContent = "Clase";
    } else {
      dropdownToggle.textContent = filterValue;
    }
    currentFilters.clase = filterValue;
  } else if (filterType === "level") {
    if (filterValue === "all") {
      dropdownToggle.textContent = "Nivel";
    } else {
      dropdownToggle.textContent = `Nivel ${filterValue}`;
    }
    currentFilters.nivel = filterValue;
  }

  // Resetear a la primera página
  currentPage = 1;

  // Aplicar filtros
  applyFilters();
}

/**
 * Inicializa los filtros y el buscador
 */
function initFilters() {
  // Inicializar buscador
  const searchInput = document.getElementById("search-members");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      currentFilters.search = this.value.toLowerCase();
      // Resetear a la primera página cuando se busca
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

        // Mostrar los miembros de la página seleccionada
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
 * Aplica todos los filtros actuales
 */
function applyFilters() {
  let filteredMembers = [...allMembers];

  // Filtrar por clan
  if (currentFilters.clan !== "all") {
    filteredMembers = filteredMembers.filter(
      (member) => member.clan === currentFilters.clan
    );
  }

  // Filtrar por clase
  if (currentFilters.clase !== "all") {
    filteredMembers = filteredMembers.filter(
      (member) => member.clase === currentFilters.clase
    );
  }

  // Filtrar por nivel
  if (currentFilters.nivel !== "all") {
    const [minLevel, maxLevel] = currentFilters.nivel.split("-").map(Number);
    filteredMembers = filteredMembers.filter((member) => {
      const level = parseInt(member.nivel);
      return level >= minLevel && level <= maxLevel;
    });
  }

  // Filtrar por búsqueda
  if (currentFilters.search) {
    filteredMembers = filteredMembers.filter(
      (member) =>
        member.nick.toLowerCase().includes(currentFilters.search) ||
        member.nombre.toLowerCase().includes(currentFilters.search)
    );
  }

  // Calcular el total de páginas
  totalPages = Math.ceil(filteredMembers.length / membersPerPage);

  // Asegurarse de que la página actual es válida
  if (currentPage > totalPages) {
    currentPage = Math.max(1, totalPages);
  }

  // Mostrar miembros filtrados
  displayMembers(filteredMembers);

  // Actualizar paginación
  updatePagination();

  // Actualizar URL
  updateURL();
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
  if (currentFilters.clan !== "all") {
    searchParams.set("clan", currentFilters.clan);
  }

  if (currentFilters.clase !== "all") {
    searchParams.set("clase", currentFilters.clase);
  }

  if (currentFilters.nivel !== "all") {
    searchParams.set("nivel", currentFilters.nivel);
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
 * Muestra los miembros en el contenedor
 */
function displayMembers(members) {
  const membersContainer = document.getElementById("members-container");

  if (!membersContainer) return;

  // Limpiar el contenedor
  membersContainer.innerHTML = "";

  // Si no hay miembros, mostrar mensaje
  if (members.length === 0) {
    membersContainer.innerHTML = `
      <div class="col-12 text-center">
          <p>No se encontraron miembros con los filtros seleccionados.</p>
      </div>
    `;
    return;
  }

  // Calcular los miembros para la página actual
  const startIndex = (currentPage - 1) * membersPerPage;
  const endIndex = Math.min(startIndex + membersPerPage, members.length);
  const currentPageMembers = members.slice(startIndex, endIndex);

  // Calcular la ruta base para las imágenes y URLs
  const baseUrl = "../../";

  // Obtener clanes para info de los miembros
  const jsonUrl = baseUrl + "data/ro/romiembros.json";

  fetch(jsonUrl)
    .then((response) => response.json())
    .then((data) => {
      const clansData = data.clans;

      // Mostrar cada miembro de la página actual
      currentPageMembers.forEach((member) => {
        // Buscar información del clan
        let clanHTML = "";
        const clan = clansData.find((c) => c.id === member.clan);

        if (clan) {
          const iconPath =
            baseUrl +
            (clan.icon.startsWith("/") ? clan.icon.substring(1) : clan.icon);

          clanHTML = `<span class="clan-badge"><img src="${iconPath}" alt="${clan.nombre}"></span> ${clan.nombre}`;
        }

        // Asegurarnos de que la ruta de la imagen sea correcta
        const imagePath =
          baseUrl +
          (member.imagen.startsWith("/")
            ? member.imagen.substring(1)
            : member.imagen);

        // Asegurarnos de que la URL del perfil sea correcta
        const profileUrl =
          baseUrl + "pages/ro/romiembros/" + member.id + ".html";

        // Crear HTML del miembro
        const memberHTML = `
          <div class="col-lg-6 col-md-12 mb-4 member-card" 
              data-clan="${member.clan}" 
              data-class="${member.clase}" 
              data-level="${member.nivel}" 
              data-name="${member.nick.toLowerCase()}">
              <div class="content-card h-100">
                  <div class="d-flex">
                      <div class="member-avatar">
                          <img src="${imagePath}" alt="${member.nick}">
                      </div>
                      <div class="member-info">
                          <h4 class="text-white">${member.nick}</h4>
                          <p class="text-white mb-2">${member.nombre}</p>
                          <p><strong>Clase:</strong> <span class="text-white">${
                            member.clase
                          }</span></p>
                          <p><strong>Nivel:</strong> <span class="member-level">${
                            member.nivel
                          }</span></p>
                          <p><strong>Clan:</strong> <span class="clan-info text-white">${
                            clanHTML || member.clan
                          }</span></p>
                          <div class="mt-3">
                              <a href="${profileUrl}" class="btn btn-sm btn-gaming">Ver Perfil</a>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
        `;

        // Agregar al contenedor
        membersContainer.innerHTML += memberHTML;
      });
    })
    .catch((error) => {
      console.error("Error obteniendo información de clanes:", error);

      // Si hay error, mostrar miembros sin info de clan
      displayMembersWithoutClanInfo(currentPageMembers, baseUrl);
    });
}

/**
 * Muestra los miembros sin información de clan (fallback)
 */
function displayMembersWithoutClanInfo(members, baseUrl) {
  const membersContainer = document.getElementById("members-container");

  // Limpiar el contenedor
  membersContainer.innerHTML = "";

  // Mostrar cada miembro con información básica
  members.forEach((member) => {
    // Asegurarnos de que la ruta de la imagen sea correcta
    const imagePath =
      baseUrl +
      (member.imagen.startsWith("/")
        ? member.imagen.substring(1)
        : member.imagen);

    // Asegurarnos de que la URL del perfil sea correcta
    const profileUrl = baseUrl + "pages/ro/romiembros/" + member.id + ".html";

    // Crear HTML del miembro sin información detallada del clan
    const memberHTML = `
      <div class="col-lg-6 col-md-12 mb-4 member-card" 
          data-clan="${member.clan}" 
          data-class="${member.clase}" 
          data-level="${member.nivel}" 
          data-name="${member.nick.toLowerCase()}">
          <div class="content-card h-100">
              <div class="d-flex">
                  <div class="member-avatar">
                      <img src="${imagePath}" alt="${member.nick}">
                  </div>
                  <div class="member-info">
                      <h4 class="text-white">${member.nick}</h4>
                      <p class="text-white mb-2">${member.nombre}</p>
                      <p><strong>Clase:</strong> <span class="text-white">${
                        member.clase
                      }</span></p>
                      <p><strong>Nivel:</strong> <span class="member-level">${
                        member.nivel
                      }</span></p>
                      <p><strong>Clan:</strong> <span class="text-white">${
                        member.clan
                      }</span></p>
                      <div class="mt-3">
                          <a href="${profileUrl}" class="btn btn-sm btn-gaming">Ver Perfil</a>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    `;

    // Agregar al contenedor
    membersContainer.innerHTML += memberHTML;
  });
}
