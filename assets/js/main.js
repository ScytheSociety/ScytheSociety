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

  // Cargar cualquier contenido dinámico según la página
  if (currentPath.includes("/streams.html")) {
    // Si estamos en la página de streams, inicializar
    if (typeof initializeStreams === "function") {
      initializeStreams();
    }
  } else if (currentPath.includes("/index.html") || currentPath === "/") {
    // Si estamos en la página principal
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
    if (href && path.includes(href) && href !== "/") {
      link.classList.add("active");

      // Si es parte de un dropdown, también marcar el dropdown padre
      const dropdownParent = link.closest(".dropdown");
      if (dropdownParent) {
        const dropdownToggle = dropdownParent.querySelector(".dropdown-toggle");
        if (dropdownToggle) {
          dropdownToggle.classList.add("active");
        }
      }
    } else if (href === "/" && (path === "/" || path === "/index.html")) {
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
  fetch("/data/featured.json")
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

// Función para mostrar el contenido de streams
function showContent(channel) {
  let displayDiv = document.getElementById("display");
  let chatDiv = document.getElementById("chat");

  if (!displayDiv || !chatDiv) return;

  // Limpia el contenido actual
  displayDiv.innerHTML = "";
  chatDiv.innerHTML = "";

  switch (channel) {
    case "twitch1":
      displayDiv.innerHTML =
        '<iframe src="https://player.twitch.tv/?channel=pandarina&parent=scythesociety.github.io" frameborder="0" allowfullscreen="true" scrolling="no" height="400" width="100%"></iframe>';
      chatDiv.innerHTML =
        '<iframe src="https://www.twitch.tv/pandarina/chat" frameborder="0" allowfullscreen="true" height="400" width="100%"></iframe>';
      break;
    case "twitch2":
      displayDiv.innerHTML =
        '<iframe src="https://www.youtube.com/embed/live_stream?channel=UCc9x200As2pVAv6jos1wY7A&autoplay=1" frameborder="0" allowfullscreen="true" height="400" width="100%"></iframe>';
      chatDiv.innerHTML =
        '<iframe src="https://www.youtube.com/embed/live_chat?channel=UCc9x200As2pVAv6jos1wY7A&autoplay=1" frameborder="0" allowfullscreen="true" height="400" width="100%"></iframe>';
      break;
    case "twitch3":
      displayDiv.innerHTML =
        '<iframe src="https://player.twitch.tv/?channel=spursito&parent=scythesociety.github.io" frameborder="0" allowfullscreen="true" scrolling="no" height="400" width="100%"></iframe>';
      chatDiv.innerHTML =
        '<iframe src="https://www.twitch.tv/spursito/chat" frameborder="0" allowfullscreen="true" height="400" width="100%"></iframe>';
      break;
    case "twitch4":
      displayDiv.innerHTML =
        '<iframe src="https://player.twitch.tv/?channel=auronplay&parent=scythesociety.github.io" frameborder="0" allowfullscreen="true" scrolling="no" height="400" width="100%"></iframe>';
      chatDiv.innerHTML =
        '<iframe src="https://www.twitch.tv/auronplay/chat" frameborder="0" allowfullscreen="true" height="400" width="100%"></iframe>';
      break;
    case "twitch5":
      displayDiv.innerHTML =
        '<iframe src="https://player.twitch.tv/?channel=ibai&parent=scythesociety.github.io" frameborder="0" allowfullscreen="true" scrolling="no" height="400" width="100%"></iframe>';
      chatDiv.innerHTML =
        '<iframe src="https://www.twitch.tv/ibai/chat" frameborder="0" allowfullscreen="true" height="400" width="100%"></iframe>';
      break;
    default:
      displayDiv.innerHTML =
        "<p>Selecciona un canal para ver su contenido.</p>";
      chatDiv.innerHTML = "<p>Selecciona un canal para ver su chat.</p>";
  }

  // Agregar la clase 'show' para hacer la animación
  setTimeout(() => {
    const iframes = displayDiv.querySelectorAll("iframe");
    if (iframes.length > 0) {
      iframes[0].classList.add("show");
    }

    const chatIframes = chatDiv.querySelectorAll("iframe");
    if (chatIframes.length > 0) {
      chatIframes[0].classList.add("show");
    }
  }, 50);
}

// Inicialización para la página de streams
function initializeStreams() {
  // Mostrar el primer stream por defecto
  showContent("twitch1");

  // Añadir manejadores de eventos a los botones
  const streamButtons = document.querySelectorAll(".stream-button");
  streamButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Remover la clase active de todos los botones
      streamButtons.forEach((btn) => btn.classList.remove("active"));

      // Añadir la clase active al botón clickeado
      this.classList.add("active");

      // Mostrar el stream seleccionado
      const channel = this.getAttribute("data-channel");
      showContent(channel);
    });
  });
}
