/**
 * Path Resolver - Detecta el nivel de la URL actual y ajusta las rutas
 * Scythe Society - Versión mejorada
 */

// Función para ajustar las rutas según el nivel de directorios
function adjustPaths() {
  console.log("Ejecutando adjustPaths...");

  // Determinar si estamos en GitHub Pages
  const isGitHubPages = window.location.hostname.includes("github.io");

  // Calcular ruta base según si estamos en GitHub Pages o desarrollo local
  let rootPrefix = "";

  if (isGitHubPages) {
    // En GitHub Pages, siempre usamos la ruta absoluta al repositorio
    rootPrefix = "/ScytheSociety/";
    console.log("Entorno GitHub Pages detectado, usando prefijo:", rootPrefix);
  } else {
    // En desarrollo local, calculamos la profundidad del directorio
    const path = window.location.pathname;
    const pathParts = path.split("/").filter((part) => part !== "");
    const depth = pathParts.length;

    // Construir el prefijo para subir al nivel raíz
    for (let i = 0; i < depth; i++) {
      rootPrefix += "../";
    }

    // Si estamos en la raíz, el prefijo es './'
    if (rootPrefix === "") {
      rootPrefix = "./";
    }

    console.log(
      "Entorno local detectado, nivel:",
      depth,
      "prefijo:",
      rootPrefix
    );
  }

  // Ajustar logo
  const logoImg = document.getElementById("logo-img");
  if (logoImg) {
    const originalSrc = logoImg.getAttribute("src");
    logoImg.src = rootPrefix + "assets/images/logos/logosss.png";
    console.log("Logo ajustado de:", originalSrc, "a:", logoImg.src);
  }

  // Ajustar enlaces de inicio
  const homeLinks = document.querySelectorAll("#home-link, #home-nav");
  homeLinks.forEach((link) => {
    const originalHref = link.getAttribute("href");
    link.href = rootPrefix;
    console.log("Enlace de inicio ajustado de:", originalHref, "a:", link.href);
  });

  // Ajustar todos los enlaces con data-path
  const pathLinks = document.querySelectorAll("[data-path]");
  pathLinks.forEach((link) => {
    const relativePath = link.getAttribute("data-path");
    const originalHref = link.getAttribute("href");
    link.href = rootPrefix + relativePath;
    console.log("Enlace ajustado de:", originalHref, "a:", link.href);
  });

  // Ajustar enlaces de menú para cada dropdown
  const allMenus = [
    "games-menu",
    "content-menu",
    "ro-menu",
    "wow-menu",
    "quick-links",
  ];

  allMenus.forEach((menuId) => {
    const menuItems = document.querySelectorAll(`#${menuId} a[data-path]`);
    menuItems.forEach((item) => {
      const relativePath = item.getAttribute("data-path");
      const originalHref = item.getAttribute("href");
      item.href = rootPrefix + relativePath;
      console.log("Enlace de menú ajustado de:", originalHref, "a:", item.href);
    });
  });

  // Enlaces individuales
  const streamsLink = document.getElementById("streams-link");
  if (streamsLink) {
    const originalHref = streamsLink.getAttribute("href");
    streamsLink.href = rootPrefix + "pages/streams.html";
    console.log(
      "Enlace de streams ajustado de:",
      originalHref,
      "a:",
      streamsLink.href
    );
  }

  const contactLink = document.getElementById("contact-link");
  if (contactLink) {
    const originalHref = contactLink.getAttribute("href");
    contactLink.href = rootPrefix + "pages/contacto.html";
    console.log(
      "Enlace de contacto ajustado de:",
      originalHref,
      "a:",
      contactLink.href
    );
  }
}

// Asegurarse de que el ajuste de rutas se ejecute después de cargar navbar y footer
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM cargado, configurando observadores para componentes");

  // Verificar periódicamente si ya se cargaron navbar y footer
  const componentsCheck = setInterval(() => {
    const navbar = document.getElementById("navbar-container");
    const footer = document.getElementById("footer-container");

    const navbarLoaded = navbar && navbar.children.length > 0;
    const footerLoaded = footer && footer.children.length > 0;

    if (navbarLoaded && footerLoaded) {
      console.log("Navbar y footer detectados, aplicando ajustes de rutas");
      clearInterval(componentsCheck);

      // Darle tiempo a que los componentes se inicialicen completamente
      setTimeout(adjustPaths, 200);
    }
  }, 100);

  // Establecer un tiempo máximo de espera (5 segundos)
  setTimeout(() => {
    clearInterval(componentsCheck);
    console.log(
      "Tiempo de espera agotado. Aplicando ajustes de rutas de todas formas"
    );
    adjustPaths();
  }, 5000);
});

// Ejecutar también cuando la ventana termina de cargar (como respaldo)
window.addEventListener("load", function () {
  console.log(
    "Ventana completamente cargada, verificando si hay que ajustar rutas"
  );

  // Verificar si el navbar tiene enlaces activos
  const activeLinks = document.querySelectorAll(".navbar-nav .nav-link.active");
  if (activeLinks.length === 0) {
    console.log("No se detectaron enlaces activos, aplicando ajustes de rutas");
    adjustPaths();
  }
});
