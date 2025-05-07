/**
 * Funcionalidad para el dashboard de administración
 * admin-dashboard.js
 */

document.addEventListener("DOMContentLoaded", function () {
  // Inicializar el dashboard
  initDashboard();

  // Configurar el toggle del sidebar
  setupSidebarToggle();

  // Configurar navegación activa
  highlightActiveNav();

  // Cargar estadísticas
  loadStatistics();

  // Cargar actividad reciente
  loadRecentActivity();
});

/**
 * Inicializa el dashboard
 */
function initDashboard() {
  // Verificar si hay usuario autenticado
  const user = firebase.auth().currentUser;
  if (!user) {
    // Si no hay usuario, redirigir a login
    window.location.href = "../admin/login.html";
    return;
  }

  console.log("Dashboard inicializado para:", user.email);

  // Actualizar fecha actual
  updateCurrentDate();
}

/**
 * Actualiza la fecha actual en el dashboard
 */
function updateCurrentDate() {
  const dateElement = document.getElementById("current-date");
  if (dateElement) {
    const now = new Date();
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    dateElement.textContent = now.toLocaleDateString("es-ES", options);
  }
}

/**
 * Configura el funcionamiento del toggle del sidebar
 */
function setupSidebarToggle() {
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebar = document.querySelector(".admin-sidebar");
  const content = document.querySelector(".admin-content");

  if (sidebarToggle && sidebar && content) {
    sidebarToggle.addEventListener("click", function () {
      sidebar.classList.toggle("collapsed");
      content.classList.toggle("expanded");

      // Guardar estado en localStorage
      const isCollapsed = sidebar.classList.contains("collapsed");
      localStorage.setItem("sidebar-collapsed", isCollapsed.toString());
    });

    // Restaurar estado desde localStorage
    const storedState = localStorage.getItem("sidebar-collapsed");
    if (storedState === "true") {
      sidebar.classList.add("collapsed");
      content.classList.add("expanded");
    }
  }

  // Manejar cierre automático en móviles
  handleMobileSidebar();
}

/**
 * Maneja el comportamiento del sidebar en dispositivos móviles
 */
function handleMobileSidebar() {
  const sidebar = document.querySelector(".admin-sidebar");
  const navLinks = document.querySelectorAll(".sidebar-nav a");

  // En dispositivos móviles, cerrar sidebar al hacer clic en un enlace
  if (window.innerWidth < 992 && sidebar) {
    navLinks.forEach((link) => {
      link.addEventListener("click", function () {
        sidebar.classList.remove("show");
      });
    });
  }

  // Configurar el botón de menú para móviles
  const mobileMenuBtn = document.getElementById("mobile-menu-btn");
  if (mobileMenuBtn && sidebar) {
    mobileMenuBtn.addEventListener("click", function () {
      sidebar.classList.toggle("show");
    });
  }
}

/**
 * Resalta el enlace de navegación activo basado en la URL actual
 */
function highlightActiveNav() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll(".sidebar-nav a");

  navLinks.forEach((link) => {
    link.classList.remove("active");

    const href = link.getAttribute("href");
    if (href && currentPath.includes(href)) {
      link.classList.add("active");

      // Expandir sección padre si existe
      const parentSection = link.closest(".nav-section");
      if (parentSection) {
        const sectionTitle = parentSection.querySelector(".nav-section-title");
        if (sectionTitle) {
          sectionTitle.classList.add("active");
        }
      }
    }
  });
}

/**
 * Carga las estadísticas del dashboard
 */
function loadStatistics() {
  const statsContainer = document.getElementById("stats-container");
  if (!statsContainer) return;

  // Mostrar cargando
  statsContainer.innerHTML = `
      <div class="text-center py-4">
        <div class="spinner-border text-danger" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="mt-2">Cargando estadísticas...</p>
      </div>
    `;

  // Definir las estadísticas a obtener y sus endpoints
  const statsToFetch = [
    {
      key: "misiones",
      endpoint: "/data/ro/romisiones.json",
      icon: "fa-scroll",
    },
    { key: "miembros", endpoint: "/data/ro/romiembros.json", icon: "fa-users" },
    { key: "guias", endpoint: "/data/ro/roguiaclases.json", icon: "fa-book" },
    { key: "destacados", endpoint: "/data/featured.json", icon: "fa-star" },
  ];

  // Array para almacenar todas las promesas
  const fetchPromises = statsToFetch.map((stat) => {
    return fetch(stat.endpoint)
      .then((response) => response.json())
      .then((data) => {
        // Calcular el número según la estructura del JSON
        let count = 0;

        if (Array.isArray(data)) {
          count = data.length;
        } else if (data.members) {
          count = data.members.length;
        } else if (data.guides) {
          count = data.guides.length;
        } else if (Object.keys(data).length > 0) {
          // Contar elementos en el primer nivel
          count = Object.keys(data).length;
        }

        return {
          ...stat,
          count,
        };
      })
      .catch((error) => {
        console.error(`Error cargando estadísticas de ${stat.key}:`, error);
        return {
          ...stat,
          count: 0,
          error: true,
        };
      });
  });

  // Procesar todas las estadísticas
  Promise.all(fetchPromises)
    .then((results) => {
      // Construir HTML de las estadísticas
      let statsHTML = "";

      results.forEach((stat) => {
        statsHTML += `
            <div class="stat-card">
              <div class="stat-icon">
                <i class="fas ${stat.icon}"></i>
              </div>
              <div class="stat-value">${stat.count}</div>
              <div class="stat-label">${capitalizeFirstLetter(stat.key)}</div>
            </div>
          `;
      });

      // Añadir tarjeta adicional para usuarios
      statsHTML += `
          <div class="stat-card">
            <div class="stat-icon">
              <i class="fas fa-user-shield"></i>
            </div>
            <div class="stat-value">-</div>
            <div class="stat-label">Administradores</div>
          </div>
        `;

      // Actualizar el contenedor
      statsContainer.innerHTML = statsHTML;

      // Cargar el contador de usuarios desde Firebase
      loadUserCount();
    })
    .catch((error) => {
      console.error("Error cargando estadísticas:", error);
      statsContainer.innerHTML = `
          <div class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-circle me-2"></i>
            Error al cargar las estadísticas. Por favor, intenta de nuevo más tarde.
          </div>
        `;
    });
}

/**
 * Carga la cantidad de usuarios administradores
 */
function loadUserCount() {
  firebase
    .database()
    .ref("/users")
    .once("value")
    .then((snapshot) => {
      const users = snapshot.val() || {};
      let adminCount = 0;

      // Contar usuarios administradores
      Object.values(users).forEach((user) => {
        if (user.role === "administrator" || user.isAdmin) {
          adminCount++;
        }
      });

      // Actualizar el valor en la tarjeta
      const adminCard = document.querySelector(
        ".stat-card:last-child .stat-value"
      );
      if (adminCard) {
        adminCard.textContent = adminCount;
      }
    })
    .catch((error) => {
      console.error("Error al cargar usuarios:", error);
    });
}

/**
 * Carga la actividad reciente
 */
function loadRecentActivity() {
  const activityContainer = document.getElementById("recent-activity");
  if (!activityContainer) return;

  // Mostrar cargando
  activityContainer.innerHTML = `
      <div class="text-center py-4">
        <div class="spinner-border text-danger" role="status">
          <span class="visually-hidden">Cargando...</span>
        </div>
        <p class="mt-2">Cargando actividad reciente...</p>
      </div>
    `;

  // Cargar actividad desde Firebase
  firebase
    .database()
    .ref("/activity")
    .orderByChild("timestamp")
    .limitToLast(5)
    .once("value")
    .then((snapshot) => {
      const activities = snapshot.val() || {};
      let activityHTML = "";

      // Convertir objeto a array y ordenar por timestamp descendente
      const activityArray = Object.values(activities).sort(
        (a, b) => b.timestamp - a.timestamp
      );

      if (activityArray.length === 0) {
        activityHTML = `
            <div class="text-center py-4">
              <i class="fas fa-info-circle fa-2x mb-3" style="color: #777;"></i>
              <p>No hay actividad reciente para mostrar.</p>
            </div>
          `;
      } else {
        activityArray.forEach((activity) => {
          const date = new Date(activity.timestamp);
          activityHTML += `
              <div class="activity-item">
                <div class="activity-icon">
                  <i class="fas ${getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                  <div><strong>${
                    activity.user || "Usuario"
                  }</strong> ${getActivityText(activity)}</div>
                  <div class="activity-time">${formatDate(date)}</div>
                </div>
              </div>
            `;
        });
      }

      // Actualizar el contenedor
      activityContainer.innerHTML = activityHTML;
    })
    .catch((error) => {
      console.error("Error cargando actividad reciente:", error);
      activityContainer.innerHTML = `
          <div class="alert alert-danger" role="alert">
            <i class="fas fa-exclamation-circle me-2"></i>
            Error al cargar la actividad reciente. Por favor, intenta de nuevo más tarde.
          </div>
        `;
    });
}

/**
 * Obtiene el icono correspondiente a un tipo de actividad
 * @param {string} type - Tipo de actividad
 * @returns {string} - Clase CSS del icono
 */
function getActivityIcon(type) {
  switch (type) {
    case "login":
      return "fa-sign-in-alt";
    case "logout":
      return "fa-sign-out-alt";
    case "create":
      return "fa-plus-circle";
    case "update":
      return "fa-edit";
    case "delete":
      return "fa-trash-alt";
    default:
      return "fa-circle";
  }
}

/**
 * Obtiene el texto descriptivo de una actividad
 * @param {Object} activity - Objeto de actividad
 * @returns {string} - Texto descriptivo
 */
function getActivityText(activity) {
  switch (activity.type) {
    case "login":
      return "inició sesión";
    case "logout":
      return "cerró sesión";
    case "create":
      return `creó ${activity.targetType || "un elemento"} ${
        activity.targetName ? `"${activity.targetName}"` : ""
      }`;
    case "update":
      return `actualizó ${activity.targetType || "un elemento"} ${
        activity.targetName ? `"${activity.targetName}"` : ""
      }`;
    case "delete":
      return `eliminó ${activity.targetType || "un elemento"} ${
        activity.targetName ? `"${activity.targetName}"` : ""
      }`;
    default:
      return activity.description || "realizó una acción";
  }
}

/**
 * Formatea una fecha para mostrarla de forma amigable
 * @param {Date} date - Objeto Date a formatear
 * @returns {string} - Fecha formateada
 */
function formatDate(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffDay > 0) {
    return `hace ${diffDay} ${diffDay === 1 ? "día" : "días"}`;
  }

  if (diffHour > 0) {
    return `hace ${diffHour} ${diffHour === 1 ? "hora" : "horas"}`;
  }

  if (diffMin > 0) {
    return `hace ${diffMin} ${diffMin === 1 ? "minuto" : "minutos"}`;
  }

  return "ahora mismo";
}

/**
 * Capitaliza la primera letra de un string
 * @param {string} str - String a capitalizar
 * @returns {string} - String con la primera letra en mayúscula
 */
function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
