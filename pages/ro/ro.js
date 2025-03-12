/**
 * ro.js - JavaScript específico para la sección de Ragnarok Online
 * Scythe Society
 */

document.addEventListener("DOMContentLoaded", function () {
  // Inicializar componentes específicos de la página de RO
  initRoPage();
});

/**
 * Inicializa todos los componentes específicos de la página de Ragnarok Online
 */
function initRoPage() {
  // Cargar eventos desde el JSON
  loadEventosRO();

  // Inicializar el botón de volver arriba
  initBackToTopButton();

  // Inicializar animación de scroll suave para los enlaces internos
  initSmoothScroll();
}

/**
 * Carga los eventos de Ragnarok Online desde un archivo JSON
 */
function loadEventosRO() {
  // Obtener el contenedor donde se mostrarán los eventos
  const eventosContainer = document.getElementById("eventos-container");

  if (!eventosContainer) {
    console.error("No se encontró el contenedor de eventos");
    return;
  }

  // Datos de eventos predeterminados en caso de que falle la carga desde el archivo JSON
  const defaultEvents = [
    {
      titulo: "Evento de Pascua 2025",
      url: "/pages/ro/roeventos/pascua2025.html",
      imagen: "/assets/images/events/ro-easter.jpg",
    },
    {
      titulo: "20º Aniversario",
      url: "/pages/ro/roeventos/20aniversario.html",
      imagen: "/assets/images/events/ro-anniversary.jpg",
    },
    {
      titulo: "Año Nuevo Lunar 2025",
      url: "/pages/ro/roeventos/lunar2025.html",
      imagen: "/assets/images/events/ro-lunar.jpg",
    },
  ];

  // Cargar eventos desde el archivo JSON
  fetch("/pages/ro/roevents.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          "Error en la respuesta del servidor: " + response.status
        );
      }
      return response.json();
    })
    .then((data) => {
      // Limpiar el contenedor
      eventosContainer.innerHTML = "";

      // Limitar a exactamente 3 eventos (las 3 primeras imágenes del JSON)
      const eventsToShow = data.slice(0, 3);

      // Si no hay eventos, mostrar mensaje
      if (eventsToShow.length === 0) {
        eventosContainer.innerHTML =
          '<div class="col-12 text-center"><p>No hay eventos activos en este momento.</p></div>';
        return;
      }

      // Crear y añadir cada evento al contenedor
      eventsToShow.forEach((evento) => {
        const eventoHTML = `
              <div class="col-lg-4 col-md-6 mb-4">
                <div class="news-card">
                  <div class="image-container">
                    <img src="${evento.imagen}" alt="${evento.titulo}">
                  </div>
                  <h5><a href="${evento.url}">${evento.titulo}</a></h5>
                </div>
              </div>
            `;
        eventosContainer.innerHTML += eventoHTML;
      });
    })
    .catch((error) => {
      console.error("Error cargando eventos:", error);

      // Mostrar eventos predeterminados en caso de error
      eventosContainer.innerHTML = "";

      defaultEvents.forEach((evento) => {
        const eventoHTML = `
              <div class="col-lg-4 col-md-6 mb-4">
                <div class="news-card">
                  <div class="image-container">
                    <img src="${evento.imagen}" alt="${evento.titulo}">
                  </div>
                  <h5><a href="${evento.url}">${evento.titulo}</a></h5>
                </div>
              </div>
            `;
        eventosContainer.innerHTML += eventoHTML;
      });
    });
}

/**
 * Inicializa el botón para volver arriba
 */
function initBackToTopButton() {
  const backToTopButton = document.getElementById("back-to-top");

  if (!backToTopButton) return;

  // Mostrar/ocultar el botón según el scroll
  window.addEventListener("scroll", function () {
    if (window.pageYOffset > 300) {
      backToTopButton.classList.add("visible");
    } else {
      backToTopButton.classList.remove("visible");
    }
  });

  // Volver arriba al hacer clic
  backToTopButton.addEventListener("click", function (e) {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
}

/**
 * Inicializa el scroll suave para todos los enlaces internos
 */
function initSmoothScroll() {
  // Seleccionar todos los enlaces que comienzan con #
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      // Prevenir comportamiento predeterminado
      e.preventDefault();

      // Obtener el ID del elemento al que apunta el enlace
      const targetId = this.getAttribute("href");

      // Si el enlace es solo #, no hacer nada
      if (targetId === "#") return;

      // Obtener el elemento de destino
      const targetElement = document.querySelector(targetId);

      // Si el elemento existe, desplazarse hasta él
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });
}
