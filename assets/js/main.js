// Main JavaScript para Scythe Society

document.addEventListener("DOMContentLoaded", function () {
  // Inicializar tooltips de Bootstrap
  const tooltipTriggerList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]')
  );
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // Manejar dropdowns de Bootstrap
  const dropdownElementList = [].slice.call(
    document.querySelectorAll(".dropdown-toggle")
  );
  dropdownElementList.map(function (dropdownToggleEl) {
    return new bootstrap.Dropdown(dropdownToggleEl);
  });

  // Scroll suave para enlaces internos
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href");
      if (targetId === "#") return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });

  // Inicializar contenido dinámico según la página
  initializePage();
});

// Función para manejar la carga específica de cada página
function initializePage() {
  // Detectar que página se está mostrando actualmente
  const currentPath = window.location.pathname;

  // Marcado del enlace activo en el navbar
  highlightActiveNavLink(currentPath);

  // Cargar contenido destacado si estamos en la página principal
  if (
    currentPath.includes("/index.html") ||
    currentPath === "/" ||
    currentPath.endsWith("/")
  ) {
    loadFeaturedContent();
  }
}

// Marcar el enlace activo en el navbar
function highlightActiveNavLink(path) {
  const navLinks = document.querySelectorAll(".navbar-nav .nav-link");
  navLinks.forEach((link) => {
    link.classList.remove("active");

    // Si el enlace coincide con la ruta actual o si es un submenú
    const href = link.getAttribute("href");
    if (href && path.includes(href) && href !== "/" && href !== "./") {
      link.classList.add("active");

      // Si es parte de un dropdown, también marcar el dropdown padre
      const dropdownParent = link.closest(".dropdown");
      if (dropdownParent) {
        const dropdownToggle = dropdownParent.querySelector(".dropdown-toggle");
        if (dropdownToggle) {
          dropdownToggle.classList.add("active");
        }
      }
    } else if (
      (href === "/" || href === "./") &&
      (path === "/" || path === "/index.html" || path.endsWith("/"))
    ) {
      // Caso especial para la página de inicio
      link.classList.add("active");
    }
  });
}

// Cargar contenido destacado en la página principal
function loadFeaturedContent() {
  const featuredContainer = document.getElementById("featured-content");
  if (!featuredContainer) return;

  // Intentar cargar el contenido desde el JSON
  fetch("./data/featured.json")
    .then((response) => response.json())
    .then((data) => {
      // Crear tarjetas para cada elemento destacado
      featuredContainer.innerHTML = "";

      data.forEach((item) => {
        const card = document.createElement("div");
        card.className = "col-lg-4 col-md-6 mb-4";
        card.innerHTML = `
            <div class="news-card">
              <div class="image-container">
                <img src="${item.imagen}" alt="${item.titulo}">
              </div>
              <h5><a href="${item.link}">${item.titulo}</a></h5>
            </div>
          `;
        featuredContainer.appendChild(card);
      });
    })
    .catch((error) => {
      console.error("Error cargando el contenido destacado:", error);
    });
}
