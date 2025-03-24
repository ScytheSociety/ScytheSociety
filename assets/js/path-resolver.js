/**
 * Path Resolver - Detecta el nivel de la URL actual y ajusta las rutas
 * Scythe Society
 */

// Función para ajustar las rutas según el nivel de directorios
function adjustPaths() {
  // Detectar el nivel del directorio actual
  const path = window.location.pathname;
  const pathParts = path.split("/").filter((part) => part !== "");

  // Si estamos en GitHub Pages, el primer directorio es el nombre del repositorio
  // Ajustamos esto para contar correctamente el nivel de profundidad
  const isGitHubPages =
    pathParts[0] === "ScytheSociety" ||
    pathParts[0] === "scythesociety.github.io";
  const depth = isGitHubPages ? pathParts.length - 1 : pathParts.length;

  // Prefijo para subir al directorio raíz
  let rootPrefix = "";
  for (let i = 0; i < depth; i++) {
    rootPrefix += "../";
  }

  // Si estamos en la raíz, el prefijo es './'
  if (rootPrefix === "") {
    rootPrefix = "./";
  }

  console.log("Nivel detectado:", depth, "Prefijo:", rootPrefix);

  // Ajustar logo
  const logoImg = document.getElementById("logo-img");
  if (logoImg) {
    logoImg.src = rootPrefix + "assets/images/logos/logosss.png";
  }

  // Ajustar enlaces de inicio
  const homeLinks = document.querySelectorAll("#home-link, #home-nav");
  homeLinks.forEach((link) => {
    link.href = rootPrefix;
  });

  // Ajustar todos los enlaces con data-path
  const pathLinks = document.querySelectorAll("[data-path]");
  pathLinks.forEach((link) => {
    const relativePath = link.getAttribute("data-path");
    link.href = rootPrefix + relativePath;
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
      item.href = rootPrefix + relativePath;
    });
  });

  // Enlaces individuales
  const streamsLink = document.getElementById("streams-link");
  if (streamsLink) {
    streamsLink.href = rootPrefix + "pages/streams.html";
  }

  const contactLink = document.getElementById("contact-link");
  if (contactLink) {
    contactLink.href = rootPrefix + "pages/contacto.html";
  }
}

// Ejecutar después de que se haya cargado el contenido
document.addEventListener("DOMContentLoaded", function () {
  // Esperar a que se carguen los componentes antes de ajustar las rutas
  setTimeout(adjustPaths, 100);
});
