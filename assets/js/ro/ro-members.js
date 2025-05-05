/**
 * ro-members.js - Carga y gestiona los miembros de Ragnarok Online
 * Scythe Society
 */

document.addEventListener("DOMContentLoaded", function () {
  // Inicializar carga de miembros
  loadMembers();

  // Inicializar filtros y buscador
  initFilters();
});

// Variables globales para almacenar datos y filtros actuales
let allMembers = [];
let currentFilters = {
  clan: "all",
  clase: "all",
  nivel: "all",
  search: "",
};

/**
 * Carga los miembros desde el archivo JSON
 */
function loadMembers() {
  const membersContainer = document.getElementById("members-container");

  if (!membersContainer) {
    console.error("No se encontró el contenedor de miembros");
    return;
  }

  // Cargar miembros desde JSON
  fetch("/data/ro/romiembros.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error al cargar los miembros: " + response.status);
      }
      return response.json();
    })
    .then((data) => {
      // Guardar datos en variable global
      allMembers = data.members;

      // Cargar los filtros dinámicos (clases y clanes)
      loadDynamicFilters(data.clans, allMembers);

      // Mostrar todos los miembros
      displayMembers(allMembers);
    })
    .catch((error) => {
      console.error("Error:", error);
      membersContainer.innerHTML = `
                <div class="col-12">
                    <div class="alert alert-danger" role="alert">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        No se pudieron cargar los miembros. Por favor, intenta de nuevo más tarde.
                    </div>
                </div>
            `;
    });
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
      li.innerHTML = `<a class="dropdown-item" href="#" data-filter="${clan.id}" data-type="clan">
                <span class="clan-badge"><img src="${clan.icon}" alt="${clan.nombre}"></span> ${clan.nombre}
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

  // Mostrar cada miembro
  members.forEach((member) => {
    // Buscar información del clan
    let clanHTML = "";
    fetch("/data/ro/romiembros.json")
      .then((response) => response.json())
      .then((data) => {
        const clan = data.clans.find((c) => c.id === member.clan);
        if (clan) {
          clanHTML = `<span class="clan-badge"><img src="${clan.icon}" alt="${clan.nombre}"></span> ${clan.nombre}`;
        }
      })
      .catch((error) => {
        console.error("Error obteniendo información del clan:", error);
      });

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
                            <img src="${member.imagen}" alt="${member.nick}">
                        </div>
                        <div class="member-info">
                            <h4>${member.nick}</h4>
                            <p class="text-muted mb-2">${member.nombre}</p>
                            <p><strong>Clase:</strong> ${member.clase}</p>
                            <p><strong>Nivel:</strong> <span class="member-level">${
                              member.nivel
                            }</span></p>
                            <p><strong>Clan:</strong> <span class="clan-info">${
                              clanHTML || member.clan
                            }</span></p>
                            <div class="mt-3">
                                <a href="/pages/ro/romiembros/${
                                  member.id
                                }.html" class="btn btn-sm btn-gaming">Ver Perfil</a>
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

/**
 * Inicializa los filtros y el buscador
 */
function initFilters() {
  // Inicializar filtros de dropdown (clan, clase, nivel)
  document.querySelectorAll(".dropdown-item").forEach((item) => {
    item.addEventListener("click", function (e) {
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

      // Aplicar filtros
      applyFilters();
    });
  });

  // Inicializar buscador
  const searchInput = document.getElementById("search-members");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      currentFilters.search = this.value.toLowerCase();
      applyFilters();
    });
  }
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

  // Mostrar miembros filtrados
  displayMembers(filteredMembers);
}
