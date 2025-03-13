/**
 * featured.js - Script para cargar y mostrar el contenido destacado con paginación
 * Scythe Society
 */

// Función para cargar y mostrar el contenido destacado con paginación
function loadFeaturedContent() {
  const featuredContainer = document.getElementById("featured-content");
  const paginationContainer = document.getElementById("featured-pagination");

  if (!featuredContainer || !paginationContainer) {
    console.error(
      "No se encontraron los contenedores para el contenido destacado"
    );
    return;
  }

  // Configuración de la paginación
  const itemsPerPage = 5;
  let currentPage = 1;

  // Cargar el contenido desde el JSON
  fetch("./data/featured.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Error al cargar el archivo: " + response.status);
      }
      return response.json();
    })
    .then((data) => {
      // Función para mostrar los elementos según la página actual
      function showPage(page) {
        // Calcular el rango de elementos a mostrar
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageItems = data.slice(startIndex, endIndex);

        // Crear HTML para los elementos
        let contentHTML = "";

        pageItems.forEach((item) => {
          contentHTML += `
              <div class="news-item">
                <a href="${item.link}" class="news-thumbnail">
                  <img src="${item.imagen}" alt="${item.titulo}">
                </a>
                <div class="news-content">
                  <h3 class="news-title"><a href="${item.link}">${
            item.titulo
          }</a></h3>
                  <p class="news-description">${
                    item.descripcion || "Sin descripción disponible"
                  }</p>
                </div>
              </div>
            `;
        });

        // Insertar en el contenedor
        featuredContainer.innerHTML = contentHTML;

        // Actualizar la paginación
        updatePagination(page, Math.ceil(data.length / itemsPerPage));
      }

      // Función para actualizar la paginación
      function updatePagination(currentPage, totalPages) {
        let paginationHTML = "";

        // Añadir botón "Anterior" si no estamos en la primera página
        if (currentPage > 1) {
          paginationHTML += `
              <div class="pagination-item prev" data-page="${currentPage - 1}">
                <i class="fas fa-chevron-left"></i>
              </div>
            `;
        }

        // Determinar qué páginas mostrar
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);

        if (endPage - startPage < 4 && startPage > 1) {
          startPage = Math.max(1, endPage - 4);
        }

        // Añadir números de página
        for (let i = startPage; i <= endPage; i++) {
          paginationHTML += `
              <div class="pagination-item ${
                i === currentPage ? "active" : ""
              }" data-page="${i}">
                ${i}
              </div>
            `;
        }

        // Añadir botón "Siguiente" si no estamos en la última página
        if (currentPage < totalPages) {
          paginationHTML += `
              <div class="pagination-item next" data-page="${currentPage + 1}">
                <i class="fas fa-chevron-right"></i>
              </div>
            `;
        }

        paginationContainer.innerHTML = paginationHTML;

        // Añadir eventos a los botones de paginación
        document.querySelectorAll(".pagination-item").forEach((item) => {
          item.addEventListener("click", function () {
            const page = parseInt(this.getAttribute("data-page"));
            currentPage = page;
            showPage(page);

            // Hacer scroll suavemente hacia el inicio de la sección
            document
              .querySelector("#destacado")
              .scrollIntoView({ behavior: "smooth", block: "start" });
          });
        });
      }

      // Mostrar la primera página al cargar
      showPage(currentPage);
    })
    .catch((error) => {
      console.error("Error cargando el contenido destacado:", error);
      featuredContainer.innerHTML = `
          <div class="alert alert-danger m-3" role="alert">
            <i class="fas fa-exclamation-triangle me-2"></i>
            No se pudo cargar el contenido destacado. Por favor, intenta de nuevo más tarde.
          </div>
        `;
    });
}

// Esperar a que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", function () {
  // Iniciar la carga del contenido destacado
  loadFeaturedContent();
});
