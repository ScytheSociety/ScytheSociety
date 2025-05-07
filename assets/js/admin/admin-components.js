/**
 * Componentes reutilizables para el panel de administración
 * admin-components.js
 */

// Variables para componentes modales
let activeModal = null;
let activeToastTimeout = null;

/**
 * Crea y muestra un modal personalizado
 * @param {Object} options - Opciones de configuración
 * @returns {Object} - Objeto con métodos para controlar el modal
 */
function createModal(options = {}) {
  // Opciones por defecto
  const defaults = {
    id: "modal-" + Date.now(),
    title: "Modal",
    content: "",
    size: "medium", // small, medium, large
    closeButton: true,
    backdrop: true,
    backdropClose: true,
    buttons: [],
    onClose: null,
    onOpen: null,
  };

  // Combinar opciones
  const settings = { ...defaults, ...options };

  // Crear elemento del modal
  const modalBackdrop = document.createElement("div");
  modalBackdrop.id = settings.id;
  modalBackdrop.className = "modal-backdrop";

  // Tamaño del modal
  let sizeClass = "";
  switch (settings.size) {
    case "small":
      sizeClass = "modal-sm";
      break;
    case "large":
      sizeClass = "modal-lg";
      break;
    case "xl":
      sizeClass = "modal-xl";
      break;
    default:
      sizeClass = "";
  }

  // HTML del modal
  modalBackdrop.innerHTML = `
    <div class="modal-container ${sizeClass}">
      <div class="modal-header">
        <h3>${settings.title}</h3>
        ${
          settings.closeButton
            ? '<button type="button" class="modal-close" data-action="close"><i class="fas fa-times"></i></button>'
            : ""
        }
      </div>
      <div class="modal-body">
        ${settings.content}
      </div>
      ${
        settings.buttons.length > 0
          ? `
        <div class="modal-footer">
          ${settings.buttons
            .map(
              (btn) => `
            <button type="button" class="btn-${
              btn.type || "secondary"
            }" data-action="${btn.action || "close"}">${btn.text}</button>
          `
            )
            .join("")}
        </div>
      `
          : ""
      }
    </div>
  `;

  // Añadir al body
  document.body.appendChild(modalBackdrop);

  // Obtener elementos del modal
  const modalContainer = modalBackdrop.querySelector(".modal-container");
  const closeButton = modalContainer.querySelector('[data-action="close"]');

  // Configurar eventos
  if (closeButton) {
    closeButton.addEventListener("click", function () {
      hideModal();
    });
  }

  // Configurar botones personalizados
  settings.buttons.forEach((btn) => {
    const button = modalContainer.querySelector(
      `[data-action="${btn.action || "close"}"]`
    );
    if (button && btn.onClick) {
      button.addEventListener("click", function () {
        btn.onClick(modalBackdrop);
      });
    }
  });

  // Evento de clic en el backdrop
  if (settings.backdropClose) {
    modalBackdrop.addEventListener("click", function (e) {
      if (e.target === modalBackdrop) {
        hideModal();
      }
    });
  }

  // Función para ocultar el modal
  function hideModal() {
    modalBackdrop.classList.remove("show");
    setTimeout(() => {
      modalBackdrop.remove();
      activeModal = null;

      // Ejecutar callback
      if (typeof settings.onClose === "function") {
        settings.onClose();
      }
    }, 300);
  }

  // Mostrar el modal
  setTimeout(() => {
    modalBackdrop.classList.add("show");

    // Ejecutar callback
    if (typeof settings.onOpen === "function") {
      settings.onOpen(modalBackdrop);
    }
  }, 10);

  // Guardar referencia al modal actual
  activeModal = {
    element: modalBackdrop,
    hide: hideModal,
    id: settings.id,
  };

  // Devolver objeto con métodos para controlar el modal
  return {
    hide: hideModal,
    element: modalBackdrop,
    id: settings.id,
  };
}

/**
 * Muestra un mensaje toast
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de mensaje (success, error, warning, info)
 * @param {number} duration - Duración en milisegundos
 */
function showToast(message, type = "info", duration = 3000) {
  // Crear contenedor de toasts si no existe
  let toastContainer = document.querySelector(".toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }

  // Limpiar timeout anterior
  if (activeToastTimeout) {
    clearTimeout(activeToastTimeout);
  }

  // Crear toast
  const toastId = "toast-" + Date.now();
  const toast = document.createElement("div");
  toast.id = toastId;
  toast.className = "toast toast-" + type;

  // Icono según tipo
  let icon = "fa-info-circle";
  let typeText = "Información";

  switch (type) {
    case "success":
      icon = "fa-check-circle";
      typeText = "Éxito";
      break;
    case "error":
      icon = "fa-exclamation-circle";
      typeText = "Error";
      break;
    case "warning":
      icon = "fa-exclamation-triangle";
      typeText = "Advertencia";
      break;
  }

  // Estructura del toast
  toast.innerHTML = `
    <div class="toast-header">
      <div class="toast-icon"><i class="fas ${icon}"></i></div>
      <div class="toast-title">${typeText}</div>
      <button type="button" class="toast-close">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="toast-body">
      ${message}
    </div>
  `;

  // Evento para cerrar el toast
  toast.querySelector(".toast-close").addEventListener("click", function () {
    removeToast(toast);
  });

  // Añadir al contenedor
  toastContainer.appendChild(toast);

  // Mostrar toast con animación
  setTimeout(() => {
    toast.classList.add("show");
  }, 10);

  // Remover después de duration
  activeToastTimeout = setTimeout(() => {
    removeToast(toast);
  }, duration);

  // Función para remover toast
  function removeToast(toastElement) {
    toastElement.classList.remove("show");
    setTimeout(() => {
      if (toastElement.parentNode) {
        toastElement.remove();
      }
    }, 300);
  }
}

/**
 * Muestra un diálogo de confirmación
 * @param {string} message - Mensaje a mostrar
 * @param {Function} onConfirm - Función a ejecutar al confirmar
 * @param {string} confirmText - Texto del botón de confirmación
 * @param {string} cancelText - Texto del botón de cancelación
 * @returns {Object} - Objeto con método hide() para cerrar el diálogo
 */
function showConfirm(
  message,
  onConfirm,
  confirmText = "Confirmar",
  cancelText = "Cancelar"
) {
  return createModal({
    title: "Confirmar acción",
    content: `
      <div class="confirm-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>${message}</p>
      </div>
    `,
    buttons: [
      {
        text: cancelText,
        type: "secondary",
        action: "cancel",
      },
      {
        text: confirmText,
        type: "danger",
        action: "confirm",
        onClick: function (modal) {
          // Ocultar modal
          modal.classList.remove("show");
          setTimeout(() => {
            modal.remove();
            activeModal = null;

            // Ejecutar callback
            if (typeof onConfirm === "function") {
              onConfirm();
            }
          }, 300);
        },
      },
    ],
  });
}

/**
 * Muestra un indicador de carga global
 * @param {string} message - Mensaje a mostrar
 * @returns {Object} - Objeto con método hide() para ocultar el indicador
 */
function showLoading(message = "Cargando...") {
  // Crear overlay de carga
  const loadingId = "loading-overlay-" + Date.now();
  const loading = document.createElement("div");
  loading.id = loadingId;
  loading.className = "loading-overlay";

  loading.innerHTML = `
    <div class="loading-content">
      <div class="spinner"></div>
      <div class="loading-text">${message}</div>
    </div>
  `;

  // Añadir al body
  document.body.appendChild(loading);

  // Mostrar overlay con animación
  setTimeout(() => {
    loading.classList.add("show");
  }, 10);

  // Devolver objeto con método para ocultar
  return {
    hide: function () {
      loading.classList.remove("show");
      setTimeout(() => {
        loading.remove();
      }, 300);
    },
    updateMessage: function (newMessage) {
      const textElement = loading.querySelector(".loading-text");
      if (textElement) {
        textElement.textContent = newMessage;
      }
    },
  };
}

/**
 * Inicializa las tabs
 * @param {string} containerId - ID del contenedor de tabs
 */
function initTabs(containerId = "tab-content") {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  // Evento para cambiar de tab
  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const targetId = this.dataset.tab;

      // Desactivar todos los botones
      tabButtons.forEach((btn) => {
        btn.classList.remove("active");
      });

      // Desactivar todos los contenidos
      tabContents.forEach((content) => {
        content.classList.remove("active");
      });

      // Activar botón y contenido seleccionado
      this.classList.add("active");
      document.getElementById(targetId).classList.add("active");
    });
  });
}

/**
 * Inicializa el sidebar
 */
function initSidebar() {
  const sidebarToggle = document.getElementById("sidebar-toggle");
  const sidebar = document.querySelector(".admin-sidebar");
  const content = document.querySelector(".admin-content");

  if (sidebarToggle && sidebar && content) {
    // Evento para alternar sidebar
    sidebarToggle.addEventListener("click", function () {
      sidebar.classList.toggle("collapsed");
      content.classList.toggle("expanded");

      // Guardar estado en localStorage
      const isCollapsed = sidebar.classList.contains("collapsed");
      localStorage.setItem("sidebar-collapsed", isCollapsed.toString());
    });

    // Cargar estado desde localStorage
    const storedState = localStorage.getItem("sidebar-collapsed");
    if (storedState === "true") {
      sidebar.classList.add("collapsed");
      content.classList.add("expanded");
    }
  }

  // Configurar logout
  const logoutBtns = document.querySelectorAll(
    "#logout-btn, #logout-sidebar-btn"
  );
  logoutBtns.forEach((btn) => {
    if (btn) {
      btn.addEventListener("click", function () {
        // Confirmar cierre de sesión
        showConfirm("¿Estás seguro de que deseas cerrar sesión?", function () {
          // Cerrar sesión
          firebase
            .auth()
            .signOut()
            .then(() => {
              // Redirigir a login
              window.location.href = "./login.html";
            })
            .catch((error) => {
              console.error("Error al cerrar sesión:", error);
              showToast("Error al cerrar sesión: " + error.message, "error");
            });
        });
      });
    }
  });
}

/**
 * Configura el botón de regreso
 * @param {string} buttonId - ID del botón
 * @param {string} targetUrl - URL de destino
 */
function setupBackButton(buttonId, targetUrl) {
  const backButton = document.getElementById(buttonId);
  if (backButton) {
    backButton.addEventListener("click", function () {
      window.location.href = targetUrl;
    });
  }
}

/**
 * Configura un formulario con validación y manejo de errores
 * @param {string} formId - ID del formulario
 * @param {Function} onSubmit - Función a ejecutar al enviar el formulario
 * @param {Function} onCancel - Función a ejecutar al cancelar
 */
function setupForm(formId, onSubmit, onCancel) {
  const form = document.getElementById(formId);
  if (!form) return;

  // Evento submit
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Validar formulario
    if (!validateForm(form)) {
      showToast("Por favor, completa todos los campos obligatorios.", "error");
      return;
    }

    // Ejecutar callback
    if (typeof onSubmit === "function") {
      onSubmit(form);
    }
  });

  // Botón cancelar
  const cancelButton = form.querySelector('button[type="button"]');
  if (cancelButton && typeof onCancel === "function") {
    cancelButton.addEventListener("click", onCancel);
  }
}

/**
 * Valida un formulario
 * @param {HTMLFormElement} form - Elemento del formulario
 * @returns {boolean} - true si el formulario es válido
 */
function validateForm(form) {
  // Obtener todos los campos requeridos
  const requiredFields = form.querySelectorAll("[required]");
  let isValid = true;

  // Verificar cada campo
  requiredFields.forEach((field) => {
    if (!field.value.trim()) {
      isValid = false;
      field.classList.add("is-invalid");
    } else {
      field.classList.remove("is-invalid");
    }
  });

  return isValid;
}

/**
 * Inicializa una tabla con funciones de ordenación y filtrado
 * @param {string} tableId - ID de la tabla
 * @param {Array} data - Datos para la tabla
 * @param {Array} columns - Configuración de columnas
 * @param {Object} options - Opciones adicionales
 */
function initDataTable(tableId, data, columns, options = {}) {
  const table = document.getElementById(tableId);
  if (!table) return;

  // Opciones por defecto
  const defaults = {
    pagination: true,
    itemsPerPage: 10,
    search: true,
    sortable: true,
    responsive: true,
  };

  // Combinar opciones
  const settings = { ...defaults, ...options };

  // Crear estructura de tabla
  let tableHTML = `
    <table class="data-table ${settings.responsive ? "table-responsive" : ""}">
      <thead>
        <tr>
          ${columns
            .map(
              (col) => `
            <th ${
              settings.sortable && col.sortable !== false
                ? 'class="sortable" data-sort="' + col.key + '"'
                : ""
            }>
              ${col.title}
              ${
                settings.sortable && col.sortable !== false
                  ? '<i class="fas fa-sort"></i>'
                  : ""
              }
            </th>
          `
            )
            .join("")}
        </tr>
      </thead>
      <tbody>
        ${renderTableRows(data, columns)}
      </tbody>
    </table>
  `;

  // Añadir búsqueda si está habilitada
  if (settings.search) {
    tableHTML = `
      <div class="table-search mb-3">
        <input type="text" class="form-control" placeholder="Buscar..." id="${tableId}-search">
      </div>
      ${tableHTML}
    `;
  }

  // Añadir paginación si está habilitada
  if (settings.pagination) {
    tableHTML += `
      <div class="table-pagination" id="${tableId}-pagination"></div>
    `;
  }

  // Insertar en el contenedor
  table.innerHTML = tableHTML;

  // Configurar búsqueda
  if (settings.search) {
    const searchInput = document.getElementById(`${tableId}-search`);
    if (searchInput) {
      searchInput.addEventListener("input", function () {
        const searchTerm = this.value.toLowerCase();
        filterTableData(tableId, data, columns, searchTerm);
      });
    }
  }

  // Configurar ordenación
  if (settings.sortable) {
    const sortableHeaders = table.querySelectorAll("th.sortable");
    sortableHeaders.forEach((header) => {
      header.addEventListener("click", function () {
        const sortKey = this.dataset.sort;
        sortTableData(tableId, data, columns, sortKey);
      });
    });
  }

  // Configurar paginación
  if (settings.pagination) {
    renderPagination(tableId, data.length, settings.itemsPerPage);
  }
}

/**
 * Renderiza las filas de una tabla
 * @param {Array} data - Datos para la tabla
 * @param {Array} columns - Configuración de columnas
 * @returns {string} - HTML de las filas
 */
function renderTableRows(data, columns) {
  return data
    .map(
      (item) => `
    <tr data-id="${item.id || ""}">
      ${columns
        .map((col) => {
          let cellContent = "";

          if (col.render) {
            cellContent = col.render(item);
          } else {
            cellContent = item[col.key] || "";
          }

          return `<td>${cellContent}</td>`;
        })
        .join("")}
    </tr>
  `
    )
    .join("");
}

/**
 * Filtra los datos de una tabla
 * @param {string} tableId - ID de la tabla
 * @param {Array} data - Datos originales
 * @param {Array} columns - Configuración de columnas
 * @param {string} searchTerm - Término de búsqueda
 */
function filterTableData(tableId, data, columns, searchTerm) {
  // Filtrar datos
  const filteredData = data.filter((item) => {
    return columns.some((col) => {
      const value = item[col.key];
      if (typeof value === "string") {
        return value.toLowerCase().includes(searchTerm);
      }
      return false;
    });
  });

  // Actualizar tabla
  const tableBody = document.querySelector(`#${tableId} tbody`);
  if (tableBody) {
    tableBody.innerHTML = renderTableRows(filteredData, columns);
  }

  // Actualizar paginación
  const paginationContainer = document.getElementById(`${tableId}-pagination`);
  if (paginationContainer) {
    const itemsPerPage =
      parseInt(paginationContainer.dataset.itemsPerPage) || 10;
    renderPagination(tableId, filteredData.length, itemsPerPage);
  }
}

/**
 * Ordena los datos de una tabla
 * @param {string} tableId - ID de la tabla
 * @param {Array} data - Datos originales
 * @param {Array} columns - Configuración de columnas
 * @param {string} sortKey - Clave para ordenar
 */
function sortTableData(tableId, data, columns, sortKey) {
  // Obtener dirección de ordenación
  const header = document.querySelector(
    `#${tableId} th[data-sort="${sortKey}"]`
  );
  if (!header) return;

  const currentDirection = header.dataset.direction || "asc";
  const newDirection = currentDirection === "asc" ? "desc" : "asc";

  // Actualizar iconos de ordenación
  document.querySelectorAll(`#${tableId} th.sortable`).forEach((th) => {
    th.dataset.direction = "";
    th.querySelector("i").className = "fas fa-sort";
  });

  header.dataset.direction = newDirection;
  header.querySelector("i").className = `fas fa-sort-${
    newDirection === "asc" ? "up" : "down"
  }`;

  // Ordenar datos
  data.sort((a, b) => {
    const valueA = a[sortKey];
    const valueB = b[sortKey];

    if (typeof valueA === "string" && typeof valueB === "string") {
      return newDirection === "asc"
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }

    return newDirection === "asc" ? valueA - valueB : valueB - valueA;
  });

  // Actualizar tabla
  const tableBody = document.querySelector(`#${tableId} tbody`);
  if (tableBody) {
    tableBody.innerHTML = renderTableRows(data, columns);
  }
}

/**
 * Renderiza la paginación
 * @param {string} tableId - ID de la tabla
 * @param {number} totalItems - Total de items
 * @param {number} itemsPerPage - Items por página
 */
function renderPagination(tableId, totalItems, itemsPerPage) {
  const paginationContainer = document.getElementById(`${tableId}-pagination`);
  if (!paginationContainer) return;

  // Calcular número de páginas
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Guardar items por página
  paginationContainer.dataset.itemsPerPage = itemsPerPage;

  // Si no hay suficientes items, ocultar paginación
  if (totalPages <= 1) {
    paginationContainer.innerHTML = "";
    return;
  }

  // Crear HTML de paginación
  let paginationHTML = "";

  // Botón anterior
  paginationHTML += `
    <div class="pagination-item prev ${
      currentPage === 1 ? "disabled" : ""
    }" data-page="${currentPage - 1}">
      <i class="fas fa-chevron-left"></i>
    </div>
  `;

  // Páginas
  for (let i = 1; i <= totalPages; i++) {
    // Mostrar solo un rango de páginas
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 2 && i <= currentPage + 2)
    ) {
      paginationHTML += `
        <div class="pagination-item ${
          i === currentPage ? "active" : ""
        }" data-page="${i}">
          ${i}
        </div>
      `;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      paginationHTML += `
        <div class="pagination-dots">...</div>
      `;
    }
  }

  // Botón siguiente
  paginationHTML += `
    <div class="pagination-item next ${
      currentPage === totalPages ? "disabled" : ""
    }" data-page="${currentPage + 1}">
      <i class="fas fa-chevron-right"></i>
    </div>
  `;

  // Insertar en el contenedor
  paginationContainer.innerHTML = paginationHTML;

  // Configurar eventos de clic
  const pageButtons = paginationContainer.querySelectorAll(
    ".pagination-item:not(.disabled)"
  );
  pageButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const page = parseInt(this.dataset.page);

      // Actualizar página actual
      currentPage = page;

      // Mostrar nueva página
      showPage(tableId, page, itemsPerPage);

      // Actualizar paginación
      renderPagination(tableId, totalItems, itemsPerPage);
    });
  });
}

/**
 * Muestra una página específica
 * @param {string} tableId - ID de la tabla
 * @param {number} page - Número de página
 * @param {number} itemsPerPage - Items por página
 */
function showPage(tableId, page, itemsPerPage) {
  const tableRows = document.querySelectorAll(`#${tableId} tbody tr`);

  // Calcular rango de items
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Mostrar/ocultar filas
  tableRows.forEach((row, index) => {
    row.style.display =
      index >= startIndex && index < endIndex ? "table-row" : "none";
  });
}

// Inicializar componentes cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", function () {
  // Inicializar sidebar
  initSidebar();

  // Inicializar tabs
  initTabs();
});
