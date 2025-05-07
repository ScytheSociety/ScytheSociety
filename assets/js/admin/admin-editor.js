/**
 * Funcionalidades comunes para los editores
 * admin-editor.js
 */

/**
 * Inicializa un editor de código
 * @param {string} elementId - ID del elemento
 * @param {string} mode - Modo del editor (html, css, javascript, json)
 * @param {Object} options - Opciones adicionales
 * @returns {Object} - Instancia del editor
 */
function initCodeEditor(elementId, mode = "json", options = {}) {
  // Verificar si CodeMirror está disponible
  if (typeof CodeMirror === "undefined") {
    console.error(
      "CodeMirror no está disponible. Incluye la librería en tu HTML."
    );
    return null;
  }

  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Elemento con ID "${elementId}" no encontrado.`);
    return null;
  }

  // Opciones por defecto
  const defaults = {
    lineNumbers: true,
    theme: "monokai",
    indentUnit: 2,
    smartIndent: true,
    tabSize: 2,
    indentWithTabs: false,
    lineWrapping: true,
    autoCloseBrackets: true,
    matchBrackets: true,
    autofocus: false,
    viewportMargin: Infinity,
  };

  // Combinar opciones
  const editorOptions = { ...defaults, ...options, mode };

  // Crear editor
  const editor = CodeMirror.fromTextArea(element, editorOptions);

  // Ajustar altura automáticamente
  editor.setSize(null, "auto");

  return editor;
}

/**
 * Inicializa un editor WYSIWYG
 * @param {string} elementId - ID del elemento
 * @param {Object} options - Opciones adicionales
 * @returns {Object} - Instancia del editor
 */
function initWysiwygEditor(elementId, options = {}) {
  // Verificar si SimpleMDE está disponible
  if (typeof SimpleMDE === "undefined") {
    console.error(
      "SimpleMDE no está disponible. Incluye la librería en tu HTML."
    );
    return null;
  }

  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Elemento con ID "${elementId}" no encontrado.`);
    return null;
  }

  // Opciones por defecto
  const defaults = {
    element,
    spellChecker: false,
    autofocus: false,
    placeholder: "Escribe aquí...",
    toolbar: [
      "bold",
      "italic",
      "heading",
      "|",
      "quote",
      "unordered-list",
      "ordered-list",
      "|",
      "link",
      "image",
      "|",
      "preview",
      "side-by-side",
      "fullscreen",
      "|",
      "guide",
    ],
  };

  // Combinar opciones
  const editorOptions = { ...defaults, ...options };

  // Crear editor
  return new SimpleMDE(editorOptions);
}

/**
 * Inicializa un editor de imágenes
 * @param {string} uploadElementId - ID del elemento de subida
 * @param {string} previewElementId - ID del elemento de vista previa
 * @param {string} inputElementId - ID del input para la URL
 * @param {Function} onUpload - Función a ejecutar después de subir
 */
function initImageUploader(
  uploadElementId,
  previewElementId,
  inputElementId,
  onUpload
) {
  const uploadElement = document.getElementById(uploadElementId);
  const previewElement = document.getElementById(previewElementId);
  const inputElement = document.getElementById(inputElementId);

  if (!uploadElement || !previewElement || !inputElement) {
    console.error("Elementos de subida de imagen no encontrados.");
    return;
  }

  // Crear input de archivo oculto
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.style.display = "none";
  uploadElement.appendChild(fileInput);

  // Evento de clic para abrir selector de archivos
  uploadElement.addEventListener("click", function () {
    fileInput.click();
  });

  // Eventos de arrastrar y soltar
  uploadElement.addEventListener("dragover", function (e) {
    e.preventDefault();
    this.classList.add("drag-over");
  });

  uploadElement.addEventListener("dragleave", function () {
    this.classList.remove("drag-over");
  });

  uploadElement.addEventListener("drop", function (e) {
    e.preventDefault();
    this.classList.remove("drag-over");

    if (e.dataTransfer.files.length) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  });

  // Evento de cambio de archivo
  fileInput.addEventListener("change", function () {
    if (this.files.length) {
      handleImageFile(this.files[0]);
    }
  });

  // Función para manejar la subida de imágenes
  function handleImageFile(file) {
    // Verificar tipo de archivo
    if (!file.type.startsWith("image/")) {
      showToast("Por favor, selecciona un archivo de imagen válido.", "error");
      return;
    }

    // Mostrar vista previa
    const reader = new FileReader();
    reader.onload = function (e) {
      previewElement.innerHTML = `<img src="${e.target.result}" class="preview-image" alt="Vista previa">`;

      // En un entorno real, aquí se subiría la imagen a un servidor
      // Por ahora, simulamos una URL y guardamos en el input
      simulateImageUpload(file, function (imageUrl) {
        inputElement.value = imageUrl;

        // Ejecutar callback si existe
        if (typeof onUpload === "function") {
          onUpload(imageUrl);
        }
      });
    };
    reader.readAsDataURL(file);
  }

  // Función para simular subida de imagen
  function simulateImageUpload(file, callback) {
    // Mostrar carga
    const loading = showLoading("Subiendo imagen...");

    // Simular carga con setTimeout
    setTimeout(() => {
      loading.hide();

      // Generar URL simulada
      const timestamp = Date.now();
      const fileExt = file.name.split(".").pop();
      const imageUrl = `assets/images/uploads/${timestamp}.${fileExt}`;

      // Mostrar mensaje de éxito
      showToast("Imagen subida correctamente.", "success");

      // Ejecutar callback
      callback(imageUrl);
    }, 1500);
  }
}

/**
 * Inicializa un selector de etiquetas
 * @param {string} containerId - ID del contenedor de etiquetas
 * @param {string} inputId - ID del input
 * @param {string} buttonId - ID del botón
 * @param {Array} initialTags - Etiquetas iniciales
 */
function initTagsInput(containerId, inputId, buttonId, initialTags = []) {
  const container = document.getElementById(containerId);
  const input = document.getElementById(inputId);
  const button = document.getElementById(buttonId);

  if (!container || !input || !button) {
    console.error("Elementos de etiquetas no encontrados.");
    return;
  }

  // Función para añadir etiqueta
  function addTag(tagText) {
    if (!tagText) return;

    // Verificar si ya existe
    const existingTags = Array.from(container.querySelectorAll(".tag")).map(
      (tag) => tag.textContent.trim().replace(/×$/, "").trim()
    );

    if (existingTags.includes(tagText)) {
      showToast("Esta etiqueta ya existe.", "warning");
      return;
    }

    // Crear elemento de etiqueta
    const tag = document.createElement("div");
    tag.className = "tag";
    tag.innerHTML = `
      ${tagText}
      <button type="button" class="tag-remove">
        <i class="fas fa-times"></i>
      </button>
    `;

    // Evento para eliminar
    tag.querySelector(".tag-remove").addEventListener("click", function () {
      tag.remove();
    });

    // Añadir al contenedor
    container.appendChild(tag);

    // Limpiar input
    input.value = "";
    input.focus();
  }

  // Añadir etiquetas iniciales
  if (Array.isArray(initialTags)) {
    initialTags.forEach((tag) => {
      addTag(tag);
    });
  }

  // Evento para botón de añadir
  button.addEventListener("click", function () {
    const tagText = input.value.trim();
    addTag(tagText);
  });

  // Evento para Enter en el input
  input.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const tagText = this.value.trim();
      addTag(tagText);
    }
  });

  // Devolver funciones útiles
  return {
    addTag,
    getTags: function () {
      return Array.from(container.querySelectorAll(".tag")).map((tag) =>
        tag.textContent.trim().replace(/×$/, "").trim()
      );
    },
    clearTags: function () {
      container.innerHTML = "";
    },
    setTags: function (tags) {
      container.innerHTML = "";
      tags.forEach((tag) => {
        addTag(tag);
      });
    },
  };
}

/**
 * Inicializa un selector de pasos
 * @param {string} containerId - ID del contenedor de pasos
 * @param {Array} initialSteps - Pasos iniciales
 * @param {Function} onChange - Función a ejecutar cuando cambia
 */
function initStepsEditor(containerId, initialSteps = [], onChange) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Contenedor de pasos "${containerId}" no encontrado.`);
    return;
  }

  // Variable para almacenar pasos
  let steps = [...initialSteps];

  // Función para renderizar pasos
  function renderSteps() {
    container.innerHTML = "";

    steps.forEach((step, index) => {
      const stepElement = document.createElement("div");
      stepElement.className = "step-item";
      stepElement.dataset.index = index;

      stepElement.innerHTML = `
        <div class="step-header">
          <div class="step-number">${index + 1}</div>
          <div class="step-title">
            <input type="text" class="form-control step-title-input" value="${
              step.title || ""
            }" placeholder="Título del paso">
          </div>
          <div class="step-actions">
            <button type="button" class="btn-secondary btn-move-up" title="Mover arriba" ${
              index === 0 ? "disabled" : ""
            }>
              <i class="fas fa-arrow-up"></i>
            </button>
            <button type="button" class="btn-secondary btn-move-down" title="Mover abajo" ${
              index === steps.length - 1 ? "disabled" : ""
            }>
              <i class="fas fa-arrow-down"></i>
            </button>
            <button type="button" class="btn-danger btn-delete-step" title="Eliminar paso">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
        <div class="step-content">
          <textarea class="form-control step-content-textarea" rows="5" placeholder="Contenido del paso">${
            step.content || ""
          }</textarea>
        </div>
      `;

      // Eventos
      // - Cambio de título
      stepElement
        .querySelector(".step-title-input")
        .addEventListener("input", function () {
          steps[index].title = this.value;
          notifyChange();
        });

      // - Cambio de contenido
      stepElement
        .querySelector(".step-content-textarea")
        .addEventListener("input", function () {
          steps[index].content = this.value;
          notifyChange();
        });

      // - Mover arriba
      stepElement
        .querySelector(".btn-move-up")
        .addEventListener("click", function () {
          if (index > 0) {
            // Intercambiar posición
            [steps[index - 1], steps[index]] = [steps[index], steps[index - 1]];
            renderSteps();
            notifyChange();
          }
        });

      // - Mover abajo
      stepElement
        .querySelector(".btn-move-down")
        .addEventListener("click", function () {
          if (index < steps.length - 1) {
            // Intercambiar posición
            [steps[index], steps[index + 1]] = [steps[index + 1], steps[index]];
            renderSteps();
            notifyChange();
          }
        });

      // - Eliminar paso
      stepElement
        .querySelector(".btn-delete-step")
        .addEventListener("click", function () {
          // Confirmar eliminación
          showConfirm(
            `¿Estás seguro de que deseas eliminar el paso "${
              steps[index].title || "Sin título"
            }"?`,
            function () {
              steps.splice(index, 1);
              renderSteps();
              notifyChange();
            }
          );
        });

      container.appendChild(stepElement);
    });

    // Botón para añadir nuevo paso
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "add-step-btn";
    addButton.innerHTML = '<i class="fas fa-plus me-2"></i>Añadir Paso';

    addButton.addEventListener("click", function () {
      addStep();
    });

    container.appendChild(addButton);
  }

  // Función para añadir paso
  function addStep() {
    const stepNumber = steps.length + 1;

    steps.push({
      title: `Paso ${stepNumber}`,
      content: `Descripción del paso ${stepNumber}...`,
    });

    renderSteps();
    notifyChange();

    // Hacer scroll al nuevo paso
    setTimeout(() => {
      const lastStep = container.querySelector(".step-item:last-child");
      if (lastStep) {
        lastStep.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  }

  // Función para notificar cambios
  function notifyChange() {
    if (typeof onChange === "function") {
      onChange(steps);
    }
  }

  // Renderizar pasos iniciales
  renderSteps();

  // Devolver funciones útiles
  return {
    getSteps: function () {
      return [...steps];
    },
    setSteps: function (newSteps) {
      steps = [...newSteps];
      renderSteps();
    },
    addStep,
    clear: function () {
      steps = [];
      renderSteps();
    },
  };
}
