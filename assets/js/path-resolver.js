/**
 * Path Resolver - Detecta el nivel de la URL actual y ajusta las rutas
 * Scythe Society
 */

// Función para ajustar las rutas según el nivel de directorios
function adjustPaths() {
  // Detectar el nivel del directorio actual
  const path = window.location.pathname;
  const pathParts = path.split("/").filter((part) => part !== "");

  // Determinar el nivel de profundidad
  let depth = pathParts.length;

  // Si estamos en GitHub Pages, ajustar el nivel
  const isGitHubPages = window.location.hostname.includes("github.io");
  if (isGitHubPages && pathParts[0] === "ScytheSociety") {
    depth = pathParts.length - 1; // Restar el nombre del repositorio
  }

  // Prefijo para subir al directorio raíz
  let rootPrefix = "";
  for (let i = 0; i < depth; i++) {
    rootPrefix += "../";
  }

  // Si estamos en la raíz, el prefijo es './'
  if (rootPrefix === "") {
    rootPrefix = "./";
  }

  console.log("Path resolver: Nivel detectado:", depth, "Prefijo:", rootPrefix);

  // Ajustar logo - Caso especial que necesita atención particular
  const logoImg = document.getElementById("logo-img");
  if (logoImg) {
    // Guardar la ruta original para depuración
    const originalSrc = logoImg.getAttribute("src");

    // Usar una ruta absoluta desde la raíz del sitio
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

// Función para verificar si el elemento está completamente cargado
function checkElementLoaded(elementId, callback, maxAttempts = 10) {
  let attempts = 0;

  const checkElement = () => {
    const element = document.getElementById(elementId);
    if (element) {
      console.log(`Elemento ${elementId} encontrado, aplicando ajustes`);
      callback();
      return;
    }

    attempts++;
    if (attempts < maxAttempts) {
      console.log(`Esperando elemento ${elementId}, intento ${attempts}`);
      setTimeout(checkElement, 100);
    } else {
      console.warn(
        `Elemento ${elementId} no encontrado después de ${maxAttempts} intentos`
      );
    }
  };

  checkElement();
}

// Ejecutar después de que se haya cargado el documento
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM cargado, esperando navbar y footer");

  // Esperar a que el navbar y footer se carguen antes de ajustar las rutas
  const checkNavbarAndFooter = () => {
    const navbar = document.getElementById("navbar-container");
    const footer = document.getElementById("footer-container");

    // Verificar si tanto el navbar como el footer tienen contenido
    if (
      navbar &&
      navbar.children.length > 0 &&
      footer &&
      footer.children.length > 0
    ) {
      console.log("Navbar y footer cargados, aplicando ajustes de rutas");
      setTimeout(adjustPaths, 100);
    } else {
      console.log("Esperando carga completa de navbar y footer");
      setTimeout(checkNavbarAndFooter, 200);
    }
  };

  checkNavbarAndFooter();
});
