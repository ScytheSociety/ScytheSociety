/**
 * Utilidades comunes para el panel de administración
 * admin-utils.js
 */

/**
 * Registra una actividad en el sistema
 * @param {string} type - Tipo de actividad (login, logout, create, update, delete)
 * @param {Object} details - Detalles adicionales de la actividad
 */
function logActivity(type, details = {}) {
  const user = firebase.auth().currentUser;

  if (!user) return;

  const activityData = {
    type: String(type), // Asegurarse de que sea una cadena
    userId: user.uid,
    user: user.email,
    timestamp: firebase.database.ServerValue.TIMESTAMP,
    ...details,
  };

  // Almacenar en Firebase
  firebase
    .database()
    .ref("/activity")
    .push(activityData)
    .then(() => {
      console.log("Actividad registrada correctamente:", type);
    })
    .catch((error) => {
      console.error("Error al registrar actividad:", error);
    });
}

/**
 * Muestra una notificación toast
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación (success, error, warning, info)
 * @param {number} duration - Duración en milisegundos
 */
function showToast(message, type = "info", duration = 3000) {
  // Crear contenedor de toasts si no existe
  let toastContainer = document.querySelector(".toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.classList.add("toast-container");
    document.body.appendChild(toastContainer);
  }

  // Crear toast
  const toastId = "toast-" + Date.now();
  const toast = document.createElement("div");
  toast.id = toastId;
  toast.classList.add("toast", `toast-${type}`);

  // Icono según tipo
  let icon = "fa-info-circle";
  switch (type) {
    case "success":
      icon = "fa-check-circle";
      break;
    case "error":
      icon = "fa-exclamation-circle";
      break;
    case "warning":
      icon = "fa-exclamation-triangle";
      break;
  }

  // Estructura del toast
  toast.innerHTML = `
    <div class="toast-header">
      <div class="toast-icon"><i class="fas ${icon}"></i></div>
      <div class="toast-title">${capitalize(type)}</div>
      <button type="button" class="toast-close" onclick="document.getElementById('${toastId}').remove()">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="toast-body">
      ${message}
    </div>
  `;

  // Añadir a contenedor
  toastContainer.appendChild(toast);

  // Eliminar después de duration
  setTimeout(() => {
    const toastElement = document.getElementById(toastId);
    if (toastElement) {
      toastElement.remove();
    }
  }, duration);
}

/**
 * Muestra un diálogo de confirmación
 * @param {string} message - Mensaje a mostrar
 * @param {Function} onConfirm - Función a ejecutar al confirmar
 * @param {string} confirmText - Texto del botón de confirmación
 * @param {string} cancelText - Texto del botón de cancelación
 */
function showConfirm(
  message,
  onConfirm,
  confirmText = "Confirmar",
  cancelText = "Cancelar"
) {
  // Crear modal de confirmación
  const modalId = "confirm-modal-" + Date.now();
  const modal = document.createElement("div");
  modal.id = modalId;
  modal.classList.add("modal-backdrop", "confirm-modal");

  modal.innerHTML = `
    <div class="modal-container">
      <div class="modal-header">
        <h3>Confirmar acción</h3>
        <button type="button" class="modal-close" onclick="document.getElementById('${modalId}').remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="confirm-message">
          <i class="fas fa-exclamation-triangle"></i>
          <p>${message}</p>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn-secondary" onclick="document.getElementById('${modalId}').remove()">
          ${cancelText}
        </button>
        <button type="button" class="btn-danger" id="confirm-btn-${modalId}">
          ${confirmText}
        </button>
      </div>
    </div>
  `;

  // Añadir al body
  document.body.appendChild(modal);

  // Mostrar modal
  setTimeout(() => {
    modal.classList.add("show");
  }, 10);

  // Configurar botón de confirmación
  const confirmBtn = document.getElementById(`confirm-btn-${modalId}`);
  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      // Cerrar modal
      modal.classList.remove("show");
      setTimeout(() => {
        modal.remove();
      }, 300);

      // Ejecutar callback
      if (typeof onConfirm === "function") {
        onConfirm();
      }
    });
  }
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
  loading.classList.add("loading-overlay");

  loading.innerHTML = `
    <div class="spinner"></div>
    <div class="loading-text">${message}</div>
  `;

  // Añadir al body
  document.body.appendChild(loading);

  // Devolver objeto con método para ocultar
  return {
    hide: function () {
      const loadingElement = document.getElementById(loadingId);
      if (loadingElement) {
        loadingElement.remove();
      }
    },
    updateMessage: function (newMessage) {
      const loadingElement = document.getElementById(loadingId);
      if (loadingElement) {
        const textElement = loadingElement.querySelector(".loading-text");
        if (textElement) {
          textElement.textContent = newMessage;
        }
      }
    },
  };
}

/**
 * Lee un archivo JSON del servidor
 * @param {string} path - Ruta del archivo
 * @returns {Promise<Object>} - Promesa que resuelve al contenido del archivo
 */
function fetchJSON(path) {
  return fetch(path)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      return response.json();
    })
    .catch((error) => {
      console.error(`Error al cargar ${path}:`, error);
      throw error;
    });
}

/**
 * Guarda un archivo JSON en el repositorio usando GitHub API
 * @param {string} path - Ruta del archivo en el repositorio
 * @param {Object} content - Contenido a guardar
 * @param {string} commitMessage - Mensaje del commit
 * @returns {Promise<Object>} - Promesa que resuelve a la respuesta del servidor
 */
function saveJSON(path, content, commitMessage) {
  // Verificar token de GitHub
  const githubToken = localStorage.getItem("github-token");
  if (!githubToken) {
    // Si no hay token guardado, pedir al usuario
    showGitHubTokenDialog()
      .then((token) => {
        localStorage.setItem("github-token", token);
        return saveJSON(path, content, commitMessage);
      })
      .catch((error) => {
        showToast("No se pudo guardar en GitHub: " + error.message, "error");
        return Promise.reject(error);
      });
    return Promise.reject(
      new Error("Se requiere configurar el token de GitHub.")
    );
  }

  // Parámetros del repositorio
  const owner = "ScytheSociety"; // Tu usuario de GitHub
  const repo = "ScytheSociety"; // Tu repositorio

  // URL de la API de GitHub
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  // Primero, obtener el archivo actual para su sha
  return fetch(apiUrl, {
    headers: {
      Authorization: `token ${githubToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        if (response.status === 404) {
          // El archivo no existe, crearlo
          return { sha: null };
        }
        throw new Error(`Error HTTP: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      // Preparar el contenido para la API de GitHub
      const payload = {
        message: commitMessage,
        content: btoa(JSON.stringify(content, null, 2)), // Convertir a base64
        branch: "main", // O la rama que uses
      };

      // Si el archivo existe, incluir su SHA
      if (data.sha) {
        payload.sha = data.sha;
      }

      // Actualizar el archivo
      return fetch(apiUrl, {
        method: "PUT",
        headers: {
          Authorization: `token ${githubToken}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json",
        },
        body: JSON.stringify(payload),
      });
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      return response.json();
    })
    .catch((error) => {
      console.error(`Error al guardar ${path}:`, error);
      throw error;
    });
}

/**
 * Muestra un diálogo para introducir el token de GitHub
 * @returns {Promise<string>} - Promesa que resuelve al token introducido
 */
function showGitHubTokenDialog() {
  return new Promise((resolve, reject) => {
    // Crear modal
    const modalId = "github-token-modal";
    const modal = document.createElement("div");
    modal.id = modalId;
    modal.className = "modal-backdrop";
    modal.innerHTML = `
      <div class="modal-container">
        <div class="modal-header">
          <h3>Configurar Token de GitHub</h3>
          <button type="button" class="modal-close" data-dismiss="modal">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>Para guardar cambios en el repositorio, necesitas proporcionar un token de acceso personal de GitHub con permisos <code>repo</code>.</p>
          <p>Puedes crear uno en: <a href="https://github.com/settings/tokens" target="_blank">https://github.com/settings/tokens</a></p>
          
          <div class="form-group mt-3">
            <label for="github-token">Token de GitHub:</label>
            <input type="password" class="form-control" id="github-token" placeholder="ghp_...">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-secondary" data-dismiss="modal">Cancelar</button>
          <button type="button" class="btn-primary" id="save-token-btn">Guardar</button>
        </div>
      </div>
    `;

    // Añadir al body
    document.body.appendChild(modal);

    // Mostrar modal
    setTimeout(() => {
      modal.classList.add("show");
    }, 10);

    // Configurar eventos
    const closeButtons = modal.querySelectorAll("[data-dismiss=modal]");
    closeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        modal.classList.remove("show");
        setTimeout(() => {
          modal.remove();
          reject(new Error("Configuración cancelada por el usuario."));
        }, 300);
      });
    });

    const saveButton = modal.querySelector("#save-token-btn");
    const tokenInput = modal.querySelector("#github-token");

    saveButton.addEventListener("click", () => {
      const token = tokenInput.value.trim();
      if (!token) {
        showToast("Por favor, introduce un token válido.", "error");
        return;
      }

      modal.classList.remove("show");
      setTimeout(() => {
        modal.remove();
        resolve(token);
      }, 300);
    });

    // También permitir Enter
    tokenInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        saveButton.click();
      }
    });
  });
}

/**
 * Valida un objeto JSON contra un esquema
 * @param {Object} data - Datos a validar
 * @param {Object} schema - Esquema de validación
 * @returns {Object} - Resultado de validación { valid, errors }
 */
function validateJSON(data, schema) {
  // Usando AJV (debe estar incluido en la página)
  if (typeof ajv === "undefined") {
    console.error("AJV no está disponible. Incluye la librería en tu HTML.");
    return { valid: false, errors: ["Validador no disponible"] };
  }

  const validate = ajv.compile(schema);
  const valid = validate(data);

  return {
    valid,
    errors: validate.errors || [],
  };
}

/**
 * Capitaliza la primera letra de un string
 * @param {string} str - String a capitalizar
 * @returns {string} - String con la primera letra en mayúscula
 */
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Formatea una fecha para mostrarla de forma amigable
 * @param {Date|string|number} date - Fecha a formatear
 * @param {boolean} includeTime - Si se debe incluir la hora
 * @returns {string} - Fecha formateada
 */
function formatDate(date, includeTime = false) {
  if (!date) return "";

  // Convertir a objeto Date si no lo es
  if (!(date instanceof Date)) {
    date = new Date(date);
  }

  // Opciones de formato
  const options = {
    day: "2-digit",
    month: "long",
    year: "numeric",
  };

  if (includeTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
  }

  return date.toLocaleDateString("es-ES", options);
}

/**
 * Genera un ID único
 * @param {string} prefix - Prefijo para el ID
 * @returns {string} - ID único
 */
function generateId(prefix = "") {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 5);
  return prefix + timestamp + randomStr;
}

/**
 * Obtiene la extensión de un archivo
 * @param {string} filename - Nombre del archivo
 * @returns {string} - Extensión del archivo
 */
function getFileExtension(filename) {
  return filename.split(".").pop().toLowerCase();
}

/**
 * Comprueba si una URL es válida
 * @param {string} url - URL a comprobar
 * @returns {boolean} - true si es válida
 */
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Escapa caracteres HTML
 * @param {string} str - String a escapar
 * @returns {string} - String escapado
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
