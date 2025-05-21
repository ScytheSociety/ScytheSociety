/**
 * Funcionalidad para el editor de guías
 * admin-guides.js
 */

// Variables globales
let currentMission = null;
let missionData = null;
let currentSteps = [];
let currentGameCommands = [];

// Prefijo por defecto (Ragnarok Online)
let gamePrefix = "ro";

document.addEventListener("DOMContentLoaded", function () {
  // Inicializar editor de guías
  initGuidesEditor();

  // Cargar comandos del juego
  loadGameCommands();

  // Configurar selector de misión
  setupMissionSelector();

  // Configurar editor de pasos
  setupStepsEditor();

  // Configurar panel de comandos
  setupCommandsPanel();

  // Configurar vista previa
  setupPreview();

  // Configurar eventos para botones principales
  setupMainButtons();
});

/**
 * Inicializa el editor de guías
 */
function initGuidesEditor() {
  console.log("Inicializando editor de guías...");

  // MODIFICACIÓN: Comentar la verificación para pruebas
  const user = firebase.auth().currentUser;
  /* Comentamos esto para pruebas
  if (!user) {
    // Si no hay usuario, redirigir a login
    window.location.href = "../admin/login.html";
    return;
  }
  */

  // Continuar con la inicialización aunque no haya usuario
  console.log("Continuando inicialización del editor de guías");
}

/**
 * Carga las misiones desde el archivo JSON
 */
function loadMissions() {
  const missionSelector = document.getElementById("mission-selector");
  if (!missionSelector) return;

  // Limpiar selector
  missionSelector.innerHTML =
    '<option value="">Selecciona una misión...</option>';

  // Mostrar cargando
  missionSelector.disabled = true;
  missionSelector.innerHTML += "<option disabled>Cargando misiones...</option>";

  // Ruta al archivo JSON según el juego seleccionado
  const missionsJsonPath = `../../data/${gamePrefix}/${gamePrefix}misiones.json`;

  // Cargar archivo JSON
  fetch(missionsJsonPath)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      // Guardar datos
      missionData = data;

      // Limpiar selector
      missionSelector.innerHTML =
        '<option value="">Selecciona una misión...</option>';

      // Añadir opciones
      if (Array.isArray(data)) {
        data.forEach((mission) => {
          const option = document.createElement("option");
          option.value = mission.id;
          option.textContent = mission.titulo;
          missionSelector.appendChild(option);
        });
      } else {
        console.error("Formato de misiones incorrecto:", data);
      }

      // Habilitar selector
      missionSelector.disabled = false;
    })
    .catch((error) => {
      console.error("Error cargando misiones:", error);
      missionSelector.innerHTML =
        '<option value="">Error al cargar misiones</option>';
      missionSelector.disabled = false;
    });
}

/**
 * Carga los comandos del juego
 */
function loadGameCommands() {
  // Ruta al archivo JSON de comandos
  const commandsJsonPath = `../../data/${gamePrefix}/commands.json`;

  // Intentar cargar desde localStorage primero
  const cachedCommands = localStorage.getItem(`${gamePrefix}-commands`);
  if (cachedCommands) {
    try {
      currentGameCommands = JSON.parse(cachedCommands);
      updateCommandsPanel();
      return;
    } catch (error) {
      console.error("Error al cargar comandos desde localStorage:", error);
    }
  }

  // Cargar desde archivo
  fetch(commandsJsonPath)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      currentGameCommands = data;

      // Guardar en localStorage para futuras cargas
      localStorage.setItem(`${gamePrefix}-commands`, JSON.stringify(data));

      // Actualizar panel de comandos
      updateCommandsPanel();
    })
    .catch((error) => {
      console.error("Error cargando comandos:", error);

      // Usar comandos por defecto
      currentGameCommands = [
        {
          name: "Navegar a Prontera",
          command: "/navi prontera",
          description: "Navega a la ciudad de Prontera",
        },
        {
          name: "Navegar a Geffen",
          command: "/navi geffen",
          description: "Navega a la ciudad de Geffen",
        },
        {
          name: "Abrir Storage",
          command: "/storage",
          description: "Abre el almacén",
        },
        {
          name: "Abrir Tienda",
          command: "/shop",
          description: "Abre la tienda",
        },
      ];

      updateCommandsPanel();
    });
}

/**
 * Configura el selector de misión
 */
function setupMissionSelector() {
  const missionSelector = document.getElementById("mission-selector");
  if (!missionSelector) return;

  // Evento al cambiar de misión
  missionSelector.addEventListener("change", function () {
    const missionId = this.value;

    if (!missionId) {
      // No hay misión seleccionada
      currentMission = null;
      return;
    }

    // Buscar misión
    const mission = missionData.find((m) => m.id === missionId);
    if (!mission) {
      showToast("Misión no encontrada.", "error");
      return;
    }

    // Establecer misión actual
    currentMission = mission;

    // Cargar la guía existente o crear una nueva
    loadGuide(mission);
  });

  // Cargar misiones iniciales
  loadMissions();
}

/**
 * Carga la guía de una misión
 * @param {Object} mission - Misión seleccionada
 */
function loadGuide(mission) {
  // Mostrar información de la misión
  updateMissionInfo(mission);

  // Ruta al archivo HTML de la guía
  const guidePath = mission.url;

  // Verificar si la guía ya existe
  const loading = showLoading("Cargando guía...");

  // Aquí normalmente verificaríamos si el archivo existe en el repositorio
  // Por ahora, simularemos una verificación con setTimeout
  setTimeout(() => {
    loading.hide();

    // Comprobar si hay una versión en localStorage (para desarrollo)
    const savedGuide = localStorage.getItem(`guide-${mission.id}`);

    if (savedGuide) {
      try {
        // Cargar guía guardada
        const guideData = JSON.parse(savedGuide);
        currentSteps = guideData.steps || [];

        // Actualizar editor
        updateStepsEditor();

        showToast("Guía cargada desde borrador local.", "info");
      } catch (error) {
        console.error("Error al cargar guía guardada:", error);
        initNewGuide(mission);
      }
    } else {
      // Iniciar nueva guía
      initNewGuide(mission);
    }
  }, 1000);
}

/**
 * Inicializa una nueva guía
 * @param {Object} mission - Misión para la que se crea la guía
 */
function initNewGuide(mission) {
  // Crear estructura básica de pasos
  currentSteps = [
    {
      title: "Introducción",
      content: `Esta es una guía para la misión "${mission.titulo}".\n\nNivel recomendado: ${mission.nivel}`,
    },
    {
      title: "Requisitos",
      content: "Para completar esta misión necesitarás:",
    },
    {
      title: "Paso 1",
      content: "Descripción del primer paso...",
    },
  ];

  // Actualizar editor
  updateStepsEditor();

  showToast("Nueva guía iniciada. Puedes comenzar a editarla.", "success");
}

/**
 * Actualiza la información de la misión
 * @param {Object} mission - Misión seleccionada
 */
function updateMissionInfo(mission) {
  const infoContainer = document.getElementById("mission-info");
  if (!infoContainer) return;

  // Imagen de portada
  let thumbnailUrl =
    mission.imagen || `assets/images/${gamePrefix}/default-mission.jpg`;

  // Construir HTML de información
  infoContainer.innerHTML = `
    <div class="mission-card">
      <div class="mission-thumbnail">
        <img src="${thumbnailUrl}" alt="${
    mission.titulo
  }" onerror="this.src='assets/images/placeholder.jpg'">
      </div>
      <div class="mission-details">
        <h3 class="mission-title">${mission.titulo}</h3>
        <div class="mission-meta">
          <span><i class="fas fa-signal"></i> Nivel: ${mission.nivel}</span>
          <span><i class="fas fa-calendar-alt"></i> Fecha: ${formatDate(
            mission.fecha
          )}</span>
        </div>
        <p class="mission-description">${mission.descripcion.substring(
          0,
          150
        )}...</p>
        <div class="tags-container">
          ${
            mission.tags
              ? mission.tags
                  .map(
                    (tag) => `<span class="badge badge-secondary">${tag}</span>`
                  )
                  .join(" ")
              : ""
          }
        </div>
      </div>
    </div>
  `;
}

/**
 * Configura el editor de pasos
 */
function setupStepsEditor() {
  const stepsContainer = document.getElementById("steps-container");
  const addStepBtn = document.getElementById("add-step-btn");

  if (!stepsContainer || !addStepBtn) return;

  // Evento para añadir paso
  addStepBtn.addEventListener("click", function () {
    addNewStep();
  });
}

/**
 * Añade un nuevo paso al final
 */
function addNewStep() {
  // Número de paso
  const stepNumber = currentSteps.length + 1;

  // Nuevo paso
  const newStep = {
    title: `Paso ${stepNumber}`,
    content: `Descripción del paso ${stepNumber}...`,
  };

  // Añadir al array
  currentSteps.push(newStep);

  // Actualizar editor
  updateStepsEditor();

  // Hacer scroll al nuevo paso
  setTimeout(() => {
    const lastStep = document.querySelector(".step-item:last-child");
    if (lastStep) {
      lastStep.scrollIntoView({ behavior: "smooth" });
    }
  }, 100);
}

/**
 * Actualiza el editor de pasos con los pasos actuales
 */
function updateStepsEditor() {
  const stepsContainer = document.getElementById("steps-container");
  if (!stepsContainer) return;

  // Vaciar contenedor
  stepsContainer.innerHTML = "";

  // Crear elementos para cada paso
  currentSteps.forEach((step, index) => {
    // Crear elemento
    const stepElement = document.createElement("div");
    stepElement.className = "step-item";
    stepElement.dataset.index = index;

    // Contenido del paso
    stepElement.innerHTML = `
      <div class="step-header">
        <div class="step-number">${index + 1}</div>
        <div class="step-title">
          <input type="text" class="form-control step-title-input" value="${escapeHtml(
            step.title
          )}" placeholder="Título del paso">
        </div>
        <div class="step-actions">
          <button type="button" class="btn-secondary btn-move-up" title="Mover arriba" ${
            index === 0 ? "disabled" : ""
          }>
            <i class="fas fa-arrow-up"></i>
          </button>
          <button type="button" class="btn-secondary btn-move-down" title="Mover abajo" ${
            index === currentSteps.length - 1 ? "disabled" : ""
          }>
            <i class="fas fa-arrow-down"></i>
          </button>
          <button type="button" class="btn-danger btn-delete-step" title="Eliminar paso">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </div>
      <div class="step-content">
        <textarea class="form-control step-content-textarea" rows="5" placeholder="Contenido del paso">${escapeHtml(
          step.content
        )}</textarea>
      </div>
      
      <div class="step-tools">
        <button type="button" class="btn-secondary btn-add-command" title="Añadir comando">
          <i class="fas fa-terminal"></i> Añadir comando
        </button>
        <button type="button" class="btn-secondary btn-add-npc-option" title="Añadir opción de NPC">
          <i class="fas fa-comment-dots"></i> Añadir opción NPC
        </button>
        <button type="button" class="btn-secondary btn-add-image" title="Añadir imagen">
          <i class="fas fa-image"></i> Añadir imagen
        </button>
      </div>
    `;

    // Eventos
    // - Cambio de título
    stepElement
      .querySelector(".step-title-input")
      .addEventListener("input", function () {
        currentSteps[index].title = this.value;

        // Actualizar preview
        updatePreview();
      });

    // - Cambio de contenido
    stepElement
      .querySelector(".step-content-textarea")
      .addEventListener("input", function () {
        currentSteps[index].content = this.value;

        // Actualizar preview
        updatePreview();
      });

    // - Mover arriba
    stepElement
      .querySelector(".btn-move-up")
      .addEventListener("click", function () {
        if (index > 0) {
          // Intercambiar con el anterior
          [currentSteps[index - 1], currentSteps[index]] = [
            currentSteps[index],
            currentSteps[index - 1],
          ];

          // Actualizar editor
          updateStepsEditor();

          // Actualizar preview
          updatePreview();
        }
      });

    // - Mover abajo
    stepElement
      .querySelector(".btn-move-down")
      .addEventListener("click", function () {
        if (index < currentSteps.length - 1) {
          // Intercambiar con el siguiente
          [currentSteps[index], currentSteps[index + 1]] = [
            currentSteps[index + 1],
            currentSteps[index],
          ];

          // Actualizar editor
          updateStepsEditor();

          // Actualizar preview
          updatePreview();
        }
      });

    // - Eliminar paso
    stepElement
      .querySelector(".btn-delete-step")
      .addEventListener("click", function () {
        // Confirmar eliminación
        showConfirm(
          `¿Estás seguro de que deseas eliminar el paso "${currentSteps[index].title}"?`,
          function () {
            // Eliminar paso
            currentSteps.splice(index, 1);

            // Actualizar editor
            updateStepsEditor();

            // Actualizar preview
            updatePreview();
          }
        );
      });

    // - Añadir comando
    stepElement
      .querySelector(".btn-add-command")
      .addEventListener("click", function () {
        showCommandSelector(index);
      });

    // - Añadir opción NPC
    stepElement
      .querySelector(".btn-add-npc-option")
      .addEventListener("click", function () {
        showNpcOptionDialog(index);
      });

    // - Añadir imagen
    stepElement
      .querySelector(".btn-add-image")
      .addEventListener("click", function () {
        showImageUploadDialog(index);
      });

    // Añadir al contenedor
    stepsContainer.appendChild(stepElement);
  });

  // Actualizar preview
  updatePreview();
}

/**
 * Muestra el selector de comandos
 * @param {number} stepIndex - Índice del paso
 */
function showCommandSelector(stepIndex) {
  // Crear modal
  const modalId = "command-selector-modal";
  const modal = document.createElement("div");
  modal.id = modalId;
  modal.className = "modal-backdrop";

  // Contenido del modal
  modal.innerHTML = `
    <div class="modal-container">
      <div class="modal-header">
        <h3>Seleccionar Comando</h3>
        <button type="button" class="modal-close" onclick="document.getElementById('${modalId}').remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <input type="text" class="form-control" id="command-search" placeholder="Buscar comando...">
        </div>
        
        <div class="command-list">
          ${currentGameCommands
            .map(
              (cmd) => `
            <div class="command-item" data-command="${escapeHtml(cmd.command)}">
              <div class="command-name">${cmd.name}</div>
              <div class="command-text">${cmd.command}</div>
              <div class="command-description">${cmd.description || ""}</div>
            </div>
          `
            )
            .join("")}
        </div>
        
        <div class="form-group mt-3">
          <label for="custom-command">O especifica un comando personalizado:</label>
          <div class="input-group">
            <input type="text" class="form-control" id="custom-command" placeholder="Ejemplo: /navi prontera 150/150">
            <button type="button" class="btn-primary" id="add-custom-command">Añadir</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Añadir al body
  document.body.appendChild(modal);

  // Mostrar modal
  setTimeout(() => {
    modal.classList.add("show");
  }, 10);

  // Eventos
  // - Búsqueda
  const searchInput = document.getElementById("command-search");
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase();
      const commandItems = document.querySelectorAll(".command-item");

      commandItems.forEach((item) => {
        const name = item
          .querySelector(".command-name")
          .textContent.toLowerCase();
        const command = item
          .querySelector(".command-text")
          .textContent.toLowerCase();
        const description = item
          .querySelector(".command-description")
          .textContent.toLowerCase();

        if (
          name.includes(searchTerm) ||
          command.includes(searchTerm) ||
          description.includes(searchTerm)
        ) {
          item.style.display = "block";
        } else {
          item.style.display = "none";
        }
      });
    });
  }

  // - Selección de comando
  const commandItems = document.querySelectorAll(".command-item");
  commandItems.forEach((item) => {
    item.addEventListener("click", function () {
      const command = this.dataset.command;

      // Insertar comando en el paso
      insertCommandInStep(stepIndex, command);

      // Cerrar modal
      modal.remove();
    });
  });

  // - Comando personalizado
  const addCustomBtn = document.getElementById("add-custom-command");
  const customCommandInput = document.getElementById("custom-command");

  if (addCustomBtn && customCommandInput) {
    addCustomBtn.addEventListener("click", function () {
      const command = customCommandInput.value.trim();

      if (command) {
        // Insertar comando en el paso
        insertCommandInStep(stepIndex, command);

        // Cerrar modal
        modal.remove();
      }
    });

    // También permitir Enter
    customCommandInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter" && this.value.trim()) {
        addCustomBtn.click();
      }
    });
  }
}

/**
 * Inserta un comando en un paso
 * @param {number} stepIndex - Índice del paso
 * @param {string} command - Comando a insertar
 */
function insertCommandInStep(stepIndex, command) {
  // Obtener textarea
  const textarea = document.querySelector(
    `.step-item[data-index="${stepIndex}"] .step-content-textarea`
  );
  if (!textarea) return;

  // Posición del cursor
  const startPos = textarea.selectionStart;
  const endPos = textarea.selectionEnd;

  // Texto actual
  const text = textarea.value;

  // Formato de comando
  const commandMark = `[COMANDO="${command}"]`;

  // Insertar comando
  const newText =
    text.substring(0, startPos) + commandMark + text.substring(endPos);
  textarea.value = newText;

  // Actualizar valor en el array
  currentSteps[stepIndex].content = newText;

  // Actualizar preview
  updatePreview();

  // Poner foco en el textarea
  textarea.focus();
  textarea.selectionStart = startPos + commandMark.length;
  textarea.selectionEnd = startPos + commandMark.length;
}

/**
 * Muestra el diálogo para añadir opciones de NPC
 * @param {number} stepIndex - Índice del paso
 */
function showNpcOptionDialog(stepIndex) {
  // Crear modal
  const modalId = "npc-option-modal";
  const modal = document.createElement("div");
  modal.id = modalId;
  modal.className = "modal-backdrop";

  // Contenido del modal
  modal.innerHTML = `
    <div class="modal-container">
      <div class="modal-header">
        <h3>Añadir Opción de NPC</h3>
        <button type="button" class="modal-close" onclick="document.getElementById('${modalId}').remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label for="npc-option-text">Texto de la opción:</label>
          <input type="text" class="form-control" id="npc-option-text" placeholder="Ejemplo: Sí, quiero continuar con la misión">
        </div>
        
        <div class="form-group">
          <label for="npc-option-correct">¿Es la opción correcta?</label>
          <div class="switch-container">
            <label class="switch">
              <input type="checkbox" id="npc-option-correct">
              <span class="slider"></span>
            </label>
            <span id="correct-label">No</span>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn-secondary" onclick="document.getElementById('${modalId}').remove()">Cancelar</button>
        <button type="button" class="btn-primary" id="add-npc-option-btn">Añadir</button>
      </div>
    </div>
  `;

  // Añadir al body
  document.body.appendChild(modal);

  // Mostrar modal
  setTimeout(() => {
    modal.classList.add("show");
  }, 10);

  // Eventos
  // - Switch de opción correcta
  const correctSwitch = document.getElementById("npc-option-correct");
  const correctLabel = document.getElementById("correct-label");

  if (correctSwitch && correctLabel) {
    correctSwitch.addEventListener("change", function () {
      correctLabel.textContent = this.checked ? "Sí" : "No";
    });
  }

  // - Botón de añadir
  const addBtn = document.getElementById("add-npc-option-btn");
  const optionTextInput = document.getElementById("npc-option-text");

  if (addBtn && optionTextInput) {
    addBtn.addEventListener("click", function () {
      const optionText = optionTextInput.value.trim();

      if (optionText) {
        const isCorrect = correctSwitch.checked;

        // Insertar opción en el paso
        insertNpcOptionInStep(stepIndex, optionText, isCorrect);

        // Cerrar modal
        modal.remove();
      } else {
        showToast("Por favor, introduce el texto de la opción.", "error");
      }
    });

    // También permitir Enter
    optionTextInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter" && this.value.trim()) {
        addBtn.click();
      }
    });
  }
}

/**
 * Inserta una opción de NPC en un paso
 * @param {number} stepIndex - Índice del paso
 * @param {string} optionText - Texto de la opción
 * @param {boolean} isCorrect - Si es la opción correcta
 */
function insertNpcOptionInStep(stepIndex, optionText, isCorrect) {
  // Obtener textarea
  const textarea = document.querySelector(
    `.step-item[data-index="${stepIndex}"] .step-content-textarea`
  );
  if (!textarea) return;

  // Posición del cursor
  const startPos = textarea.selectionStart;
  const endPos = textarea.selectionEnd;

  // Texto actual
  const text = textarea.value;

  // Formato de opción
  const optionMark = `[OPCION${
    isCorrect ? "=CORRECTA" : ""
  }]${optionText}[/OPCION]`;

  // Insertar opción
  const newText =
    text.substring(0, startPos) + optionMark + text.substring(endPos);
  textarea.value = newText;

  // Actualizar valor en el array
  currentSteps[stepIndex].content = newText;

  // Actualizar preview
  updatePreview();

  // Poner foco en el textarea
  textarea.focus();
  textarea.selectionStart = startPos + optionMark.length;
  textarea.selectionEnd = startPos + optionMark.length;
}

/**
 * Muestra el diálogo para subir imágenes
 * @param {number} stepIndex - Índice del paso
 */
function showImageUploadDialog(stepIndex) {
  // Crear modal
  const modalId = "image-upload-modal";
  const modal = document.createElement("div");
  modal.id = modalId;
  modal.className = "modal-backdrop";

  // Contenido del modal
  modal.innerHTML = `
    <div class="modal-container">
      <div class="modal-header">
        <h3>Añadir Imagen</h3>
        <button type="button" class="modal-close" onclick="document.getElementById('${modalId}').remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label for="image-url">URL de la imagen:</label>
          <input type="text" class="form-control" id="image-url" placeholder="https://...">
        </div>
        
        <div class="form-group">
          <label>O sube una imagen desde tu dispositivo:</label>
          <div class="image-upload">
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Arrastra una imagen aquí o haz clic para seleccionar</p>
            <input type="file" id="image-file" accept="image/*" style="display: none;">
          </div>
          <div id="image-preview" class="image-preview"></div>
        </div>
        
        <div class="form-group">
          <label for="image-description">Descripción de la imagen:</label>
          <input type="text" class="form-control" id="image-description" placeholder="Describe brevemente la imagen">
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn-secondary" onclick="document.getElementById('${modalId}').remove()">Cancelar</button>
        <button type="button" class="btn-primary" id="add-image-btn">Añadir</button>
      </div>
    </div>
  `;

  // Añadir al body
  document.body.appendChild(modal);

  // Mostrar modal
  setTimeout(() => {
    modal.classList.add("show");
  }, 10);

  // Eventos
  // - Subida de imagen
  const imageUpload = modal.querySelector(".image-upload");
  const imageFileInput = document.getElementById("image-file");
  const imagePreview = document.getElementById("image-preview");
  const imageUrlInput = document.getElementById("image-url");

  if (imageUpload && imageFileInput && imagePreview) {
    // Clic en la zona de subida
    imageUpload.addEventListener("click", function () {
      imageFileInput.click();
    });

    // Arrastrar y soltar
    imageUpload.addEventListener("dragover", function (e) {
      e.preventDefault();
      this.classList.add("drag-over");
    });

    imageUpload.addEventListener("dragleave", function () {
      this.classList.remove("drag-over");
    });

    imageUpload.addEventListener("drop", function (e) {
      e.preventDefault();
      this.classList.remove("drag-over");

      if (e.dataTransfer.files.length) {
        imageFileInput.files = e.dataTransfer.files;
        handleImageFile(imageFileInput.files[0]);
      }
    });

    // Cambio de archivo
    imageFileInput.addEventListener("change", function () {
      if (this.files.length) {
        handleImageFile(this.files[0]);
      }
    });

    // Función para manejar la imagen
    function handleImageFile(file) {
      if (!file.type.startsWith("image/")) {
        showToast(
          "Por favor, selecciona un archivo de imagen válido.",
          "error"
        );
        return;
      }

      // Mostrar vista previa
      const reader = new FileReader();
      reader.onload = function (e) {
        imagePreview.innerHTML = `<img src="${e.target.result}" class="preview-image" alt="Vista previa">`;

        // Limpiar URL si se ha subido una imagen
        imageUrlInput.value = "";
      };
      reader.readAsDataURL(file);
    }
  }

  // - Botón de añadir
  const addBtn = document.getElementById("add-image-btn");
  const descriptionInput = document.getElementById("image-description");

  if (addBtn && descriptionInput) {
    addBtn.addEventListener("click", function () {
      let imageUrl = imageUrlInput.value.trim();
      const description = descriptionInput.value.trim();

      // Verificar si hay una imagen
      if (
        !imageUrl &&
        (!imageFileInput.files || !imageFileInput.files.length)
      ) {
        showToast("Por favor, proporciona una URL o sube una imagen.", "error");
        return;
      }

      // Si hay una imagen subida, procesarla
      if (imageFileInput.files && imageFileInput.files.length) {
        const file = imageFileInput.files[0];

        // En un entorno real, aquí se subiría la imagen a un servidor
        // Para este ejemplo, simularemos la subida
        const loading = showLoading("Subiendo imagen...");

        setTimeout(() => {
          loading.hide();

          // Simular URL de imagen subida
          imageUrl = `assets/images/${gamePrefix}/romisiones/uploaded_${Date.now()}.jpg`;

          // Insertar imagen en el paso
          insertImageInStep(stepIndex, imageUrl, description);

          // Cerrar modal
          modal.remove();

          showToast("Imagen subida correctamente.", "success");
        }, 1500);
      } else {
        // Usar URL proporcionada
        insertImageInStep(stepIndex, imageUrl, description);

        // Cerrar modal
        modal.remove();
      }
    });
  }
}

/**
 * Inserta una imagen en un paso
 * @param {number} stepIndex - Índice del paso
 * @param {string} imageUrl - URL de la imagen
 * @param {string} description - Descripción de la imagen
 */
function insertImageInStep(stepIndex, imageUrl, description) {
  // Obtener textarea
  const textarea = document.querySelector(
    `.step-item[data-index="${stepIndex}"] .step-content-textarea`
  );
  if (!textarea) return;

  // Posición del cursor
  const startPos = textarea.selectionStart;
  const endPos = textarea.selectionEnd;

  // Texto actual
  const text = textarea.value;

  // Formato de imagen
  const imageMark = `[IMAGEN="${imageUrl}"${
    description ? ` ALT="${description}"` : ""
  }]`;

  // Insertar imagen
  const newText =
    text.substring(0, startPos) + imageMark + text.substring(endPos);
  textarea.value = newText;

  // Actualizar valor en el array
  currentSteps[stepIndex].content = newText;

  // Actualizar preview
  updatePreview();

  // Poner foco en el textarea
  textarea.focus();
  textarea.selectionStart = startPos + imageMark.length;
  textarea.selectionEnd = startPos + imageMark.length;
}

/**
 * Configura el panel de comandos
 */
function setupCommandsPanel() {
  // Inicialmente vacío, se llena con loadGameCommands()
}

/**
 * Actualiza el panel de comandos con los comandos actuales
 */
function updateCommandsPanel() {
  const commandsPanel = document.getElementById("commands-panel");
  if (!commandsPanel) return;

  // Vaciar panel
  commandsPanel.innerHTML = "";

  // Panel vacío si no hay comandos
  if (!currentGameCommands || currentGameCommands.length === 0) {
    commandsPanel.innerHTML = `
      <div class="text-center py-4">
        <i class="fas fa-info-circle fa-2x mb-3" style="color: #777;"></i>
        <p>No hay comandos disponibles para este juego.</p>
      </div>
    `;
    return;
  }

  // Crear elementos para cada comando
  const commandsList = document.createElement("div");
  commandsList.className = "command-list";

  currentGameCommands.forEach((cmd) => {
    const commandItem = document.createElement("div");
    commandItem.className = "command-item";
    commandItem.dataset.command = cmd.command;

    commandItem.innerHTML = `
      <div class="command-name">${cmd.name}</div>
      <div class="command-text">${cmd.command}</div>
    `;

    // Evento para añadir comando
    commandItem.addEventListener("click", function () {
      // Si no hay paso seleccionado, mostrar mensaje
      if (currentSteps.length === 0) {
        showToast("Primero debes crear al menos un paso.", "warning");
        return;
      }

      // Obtener textarea activo
      const activeTextarea = document.activeElement;
      if (
        activeTextarea &&
        activeTextarea.classList.contains("step-content-textarea")
      ) {
        // Insertar comando en el textarea activo
        const stepIndex = parseInt(
          activeTextarea.closest(".step-item").dataset.index
        );
        insertCommandInStep(stepIndex, cmd.command);
      } else {
        // Insertar en el último paso
        insertCommandInStep(currentSteps.length - 1, cmd.command);
      }
    });

    commandsList.appendChild(commandItem);
  });

  commandsPanel.appendChild(commandsList);
}

/**
 * Configura la vista previa
 */
function setupPreview() {
  // Botón para mostrar/ocultar vista previa
  const togglePreviewBtn = document.getElementById("toggle-preview");
  const previewContainer = document.getElementById("preview-container");

  if (togglePreviewBtn && previewContainer) {
    togglePreviewBtn.addEventListener("click", function () {
      // Mostrar/ocultar preview
      previewContainer.style.display =
        previewContainer.style.display === "none" ? "block" : "none";

      // Cambiar texto del botón
      this.textContent =
        previewContainer.style.display === "none"
          ? "Mostrar Vista Previa"
          : "Ocultar Vista Previa";

      // Si se muestra, actualizar
      if (previewContainer.style.display === "block") {
        updatePreview();
      }
    });
  }
}

/**
 * Actualiza la vista previa
 */
function updatePreview() {
  const previewContainer = document.getElementById("preview-content");
  if (!previewContainer) return;

  // Si no hay misión seleccionada
  if (!currentMission) {
    previewContainer.innerHTML = `
      <div class="text-center py-4">
        <i class="fas fa-info-circle fa-2x mb-3" style="color: #777;"></i>
        <p>Selecciona una misión para ver la vista previa.</p>
      </div>
    `;
    return;
  }

  // Si no hay pasos
  if (currentSteps.length === 0) {
    previewContainer.innerHTML = `
      <div class="text-center py-4">
        <i class="fas fa-info-circle fa-2x mb-3" style="color: #777;"></i>
        <p>Añade pasos a la guía para ver la vista previa.</p>
      </div>
    `;
    return;
  }

  // Construir HTML de la guía
  let guideHTML = `
    <h1 class="guide-title">${currentMission.titulo}</h1>
    <div class="guide-meta">
      <span><i class="fas fa-signal"></i> Nivel: ${currentMission.nivel}</span>
      <span><i class="fas fa-calendar-alt"></i> Fecha: ${formatDate(
        currentMission.fecha
      )}</span>
    </div>
  `;

  // Índice
  guideHTML += `
    <div class="guide-index">
      <h2>Índice</h2>
      <ul>
        ${currentSteps
          .map(
            (step, index) => `
          <li><a href="#step-${index + 1}">${step.title}</a></li>
        `
          )
          .join("")}
      </ul>
    </div>
  `;

  // Pasos
  currentSteps.forEach((step, index) => {
    guideHTML += `
      <div class="guide-step" id="step-${index + 1}">
        <h2>${index + 1}. ${step.title}</h2>
        <div class="guide-step-content">
          ${formatStepContent(step.content)}
        </div>
      </div>
    `;
  });

  // Recompensas
  const rewards = currentMission.recompensas || {};
  let rewardsHTML = "";

  if (rewards.exp) {
    rewardsHTML += `<li><strong>Experiencia:</strong> ${rewards.exp}</li>`;
  }

  if (rewards.zeny) {
    rewardsHTML += `<li><strong>Zeny:</strong> ${rewards.zeny}</li>`;
  }

  if (rewards.items && rewards.items.length > 0) {
    rewardsHTML += `<li><strong>Objetos:</strong> ${rewards.items.join(
      ", "
    )}</li>`;
  }

  if (rewards.skills && rewards.skills.length > 0) {
    rewardsHTML += `<li><strong>Habilidades:</strong> ${rewards.skills.join(
      ", "
    )}</li>`;
  }

  if (rewardsHTML) {
    guideHTML += `
      <div class="guide-rewards">
        <h2>Recompensas</h2>
        <ul>${rewardsHTML}</ul>
      </div>
    `;
  }

  // Asignar HTML a la vista previa
  previewContainer.innerHTML = guideHTML;

  // Procesar comandos de juego
  processGameCommands();
}

/**
 * Formatea el contenido de un paso
 * @param {string} content - Contenido del paso
 * @returns {string} - Contenido formateado
 */
function formatStepContent(content) {
  if (!content) return "";

  // Convertir saltos de línea
  content = content.replace(/\n/g, "<br>");

  // Procesar marcadores

  // - Comandos de juego
  content = content.replace(
    /\[COMANDO="([^"]+)"\]/g,
    '<span class="game-command" data-command="$1">$1</span>'
  );

  // - Opciones de NPC
  content = content.replace(
    /\[OPCION=CORRECTA\](.*?)\[\/OPCION\]/g,
    '<div class="npc-option correct">$1 ✓</div>'
  );
  content = content.replace(
    /\[OPCION\](.*?)\[\/OPCION\]/g,
    '<div class="npc-option">$1</div>'
  );

  // - Imágenes
  content = content.replace(
    /\[IMAGEN="([^"]+)"(?: ALT="([^"]+)")?\]/g,
    (match, url, alt) => {
      return `<div class="guide-image">
      <img src="${url}" alt="${
        alt || "Imagen de la guía"
      }" onerror="this.src='assets/images/placeholder.jpg'">
      ${alt ? `<div class="image-caption">${alt}</div>` : ""}
    </div>`;
    }
  );

  return content;
}

/**
 * Procesa los comandos de juego en la vista previa
 */
function processGameCommands() {
  const commandElements = document.querySelectorAll(".game-command");

  commandElements.forEach((element) => {
    element.addEventListener("click", function () {
      const command = this.dataset.command;

      // Simular copia al portapapeles
      navigator.clipboard
        .writeText(command)
        .then(() => {
          // Animación de copiado
          this.classList.add("copied");

          // Mostrar mensaje
          showToast("Comando copiado al portapapeles.", "success");

          // Quitar clase después de la animación
          setTimeout(() => {
            this.classList.remove("copied");
          }, 1000);
        })
        .catch((error) => {
          console.error("Error al copiar el comando:", error);
          showToast("Error al copiar el comando.", "error");
        });
    });
  });
}

/**
 * Configura los botones principales
 */
function setupMainButtons() {
  // Botón para guardar
  const saveBtn = document.getElementById("save-guide-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", function () {
      saveGuide();
    });
  }

  // Botón para guardar como borrador
  const saveDraftBtn = document.getElementById("save-draft-btn");
  if (saveDraftBtn) {
    saveDraftBtn.addEventListener("click", function () {
      saveDraft();
    });
  }

  // Botón para vista previa
  const previewBtn = document.getElementById("preview-guide-btn");
  if (previewBtn) {
    previewBtn.addEventListener("click", function () {
      previewGuide();
    });
  }
}

/**
 * Guarda la guía
 */
function saveGuide() {
  // Verificar si hay misión seleccionada
  if (!currentMission) {
    showToast("Por favor, selecciona una misión primero.", "error");
    return;
  }

  // Verificar si hay pasos
  if (currentSteps.length === 0) {
    showToast("Por favor, añade al menos un paso a la guía.", "error");
    return;
  }

  // Mostrar confirmación
  showConfirm(
    "¿Estás seguro de que deseas publicar esta guía? Una vez publicada, estará disponible para todos los usuarios.",
    function () {
      // Mostrar cargando
      const loading = showLoading("Guardando guía...");

      // Simular guardado
      setTimeout(() => {
        // Guardar primero en localStorage (para desarrollo)
        try {
          localStorage.setItem(
            `guide-${currentMission.id}`,
            JSON.stringify({
              missionId: currentMission.id,
              steps: currentSteps,
              lastUpdated: new Date().toISOString(),
            })
          );
        } catch (error) {
          console.error("Error al guardar en localStorage:", error);
        }

        // En un entorno real, aquí se guardaría en el repositorio
        // Generar HTML final de la guía
        const guideHTML = generateGuideHTML();

        // Mostrar HTML generado (para desarrollo)
        console.log("HTML de la guía generado:", guideHTML);

        // Simular guardado en el repositorio
        loading.updateMessage("Guardando guía en el repositorio...");

        setTimeout(() => {
          loading.hide();

          // Mostrar mensaje de éxito
          showToast("¡Guía publicada con éxito!", "success");

          // Registrar actividad
          logActivity("create", {
            targetType: "guía",
            targetName: currentMission.titulo,
            gamePrefix,
          });
        }, 1500);
      }, 1500);
    }
  );
}

/**
 * Guarda la guía como borrador
 */
function saveDraft() {
  // Verificar si hay misión seleccionada
  if (!currentMission) {
    showToast("Por favor, selecciona una misión primero.", "error");
    return;
  }

  // Guardar en localStorage
  try {
    localStorage.setItem(
      `guide-${currentMission.id}`,
      JSON.stringify({
        missionId: currentMission.id,
        steps: currentSteps,
        lastUpdated: new Date().toISOString(),
        isDraft: true,
      })
    );

    showToast("Borrador guardado correctamente.", "success");
  } catch (error) {
    console.error("Error al guardar borrador:", error);
    showToast("Error al guardar el borrador: " + error.message, "error");
  }
}

/**
 * Muestra la vista previa de la guía en una nueva ventana
 */
function previewGuide() {
  // Verificar si hay misión seleccionada
  if (!currentMission) {
    showToast("Por favor, selecciona una misión primero.", "error");
    return;
  }

  // Verificar si hay pasos
  if (currentSteps.length === 0) {
    showToast("Por favor, añade al menos un paso a la guía.", "error");
    return;
  }

  // Generar HTML final
  const guideHTML = generateGuideHTML();

  // Abrir nueva ventana con la vista previa
  const previewWindow = window.open("", "_blank");
  if (!previewWindow) {
    showToast(
      "No se pudo abrir la ventana de vista previa. Por favor, permite las ventanas emergentes.",
      "error"
    );
    return;
  }

  // Escribir HTML en la nueva ventana
  previewWindow.document.write(guideHTML);
}

/**
 * Genera el HTML final de la guía
 * @returns {string} - HTML de la guía
 */
function generateGuideHTML() {
  // Plantilla base
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${currentMission.titulo} | Scythe Society</title>

  <!-- Favicon -->
  <link rel="icon" href="../../../assets/images/logos/logosss.ico" type="image/x-icon">

  <!-- CSS de Bootstrap 5 -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

  <!-- Font Awesome para iconos -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">

  <!-- CSS personalizado -->
  <link rel="stylesheet" href="../../../assets/css/style.css">
  <link rel="stylesheet" href="../../../assets/css/responsive.css">
  <link rel="stylesheet" href="../../../assets/css/${gamePrefix}/${gamePrefix}.css">
  <link rel="stylesheet" href="../../../assets/css/${gamePrefix}/${gamePrefix}misiones.css">

  <style>
    /* Estilos específicos para la guía */
    .guide-title {
      margin-bottom: 20px;
      color: var(--accent-color);
      border-bottom: 2px solid var(--accent-color);
      padding-bottom: 10px;
    }
    
    .guide-meta {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
      color: #aaa;
    }
    
    .guide-meta span {
      display: flex;
      align-items: center;
    }
    
    .guide-meta i {
      margin-right: 5px;
    }
    
    .guide-index {
      background-color: var(--secondary-bg);
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    
    .guide-index h2 {
      margin-bottom: 15px;
      font-size: 1.5rem;
    }
    
    .guide-index ul {
      padding-left: 20px;
    }
    
    .guide-index li {
      margin-bottom: 5px;
    }
    
    .guide-index a {
      color: var(--text-color);
      text-decoration: none;
      transition: color 0.3s;
    }
    
    .guide-index a:hover {
      color: var(--accent-color);
    }
    
    .guide-step {
      margin-bottom: 40px;
    }
    
    .guide-step h2 {
      color: var(--accent-color);
      margin-bottom: 15px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 10px;
    }
    
    .guide-step-content {
      line-height: 1.8;
    }
    
    .game-command {
      background-color: #3a3a3a;
      color: #75c8ff;
      font-family: 'Consolas', 'Monaco', monospace;
      padding: 5px 10px;
      border-radius: 4px;
      display: inline-block;
      margin: 5px 0;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .game-command:hover {
      background-color: #4a4a4a;
    }
    
    .game-command::before {
      content: '\\f0c5';
      font-family: 'Font Awesome 5 Free';
      font-weight: 400;
      margin-right: 5px;
    }
    
    .npc-option {
      background-color: #36454F;
      color: #ffd700;
      padding: 8px 12px;
      border-radius: 4px;
      margin: 10px 0;
      border-left: 3px solid #ffd700;
    }
    
    .npc-option.correct {
      background-color: #2E4B2C;
      color: #7CFC00;
      border-left: 3px solid #7CFC00;
    }
    
    .guide-image {
      margin: 20px 0;
      text-align: center;
    }
    
    .guide-image img {
      max-width: 100%;
      border-radius: 8px;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    }
    
    .image-caption {
      margin-top: 10px;
      font-style: italic;
      color: #aaa;
    }
    
    .guide-rewards {
      background-color: var(--secondary-bg);
      padding: 20px;
      border-radius: 8px;
      margin-top: 40px;
    }
    
    .guide-rewards h2 {
      color: var(--accent-color);
      margin-bottom: 15px;
    }
    
    .guide-rewards ul {
      padding-left: 20px;
    }
    
    .guide-rewards li {
      margin-bottom: 5px;
    }
  </style>
</head>

<body>
  <!-- Navbar -->
  <div id="navbar-container">
    <!-- El contenido del navbar se cargará aquí -->
  </div>

  <!-- Contenido principal -->
  <main class="main-content">
    <!-- Banner con el ID específico para la página principal -->
    <section class="banner" id="${gamePrefix}-banner">
      <div class="banner-content">
        <div class="container">
          <h1 class="main-title">Guía de Misión</h1>
          <p class="sub-title">${currentMission.titulo}</p>
        </div>
      </div>
    </section>

    <!-- Contenido de la guía -->
    <section class="py-5">
      <div class="container">
        <div class="row">
          <div class="col-lg-8 mx-auto">
            <!-- Título principal -->
            <h1 class="guide-title">${currentMission.titulo}</h1>
            
            <!-- Meta información -->
            <div class="guide-meta">
              <span><i class="fas fa-signal"></i> Nivel: ${
                currentMission.nivel
              }</span>
              <span><i class="fas fa-calendar-alt"></i> Fecha: ${formatDate(
                currentMission.fecha
              )}</span>
            </div>
            
            <!-- Índice -->
            <div class="guide-index">
              <h2>Índice</h2>
              <ul>
                ${currentSteps
                  .map(
                    (step, index) => `
                  <li><a href="#step-${index + 1}">${step.title}</a></li>
                `
                  )
                  .join("")}
              </ul>
            </div>
            
            <!-- Pasos -->
            ${currentSteps
              .map(
                (step, index) => `
              <div class="guide-step" id="step-${index + 1}">
                <h2>${index + 1}. ${step.title}</h2>
                <div class="guide-step-content">
                  ${formatStepContent(step.content)}
                </div>
              </div>
            `
              )
              .join("")}
            
            <!-- Recompensas -->
            ${getCurrentRewardsHTML()}
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- Footer -->
  <div id="footer-container">
    <!-- El contenido del footer se cargará aquí -->
  </div>

  <!-- JavaScript de Bootstrap 5 y Popper.js -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
  
  <!-- jQuery (para compatibilidad con scripts más antiguos) -->
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
  
  <!-- JavaScript personalizado -->
  <script src="../../../assets/js/main.js"></script>
  <script src="../../../assets/js/path-resolver.js"></script>
  
  <!-- Scripts específicos para comandos del juego -->
  <script>
    // Procesar comandos de juego
    document.addEventListener('DOMContentLoaded', function() {
      const commandElements = document.querySelectorAll('.game-command');
      
      commandElements.forEach(element => {
        element.addEventListener('click', function() {
          const command = this.textContent.trim();
          
          // Copiar al portapapeles
          navigator.clipboard.writeText(command)
            .then(() => {
              // Animación de copiado
              this.classList.add('copied');
              
              // Crear notificación
              const notification = document.createElement('div');
              notification.className = 'copy-notification';
              notification.textContent = '¡Copiado!';
              document.body.appendChild(notification);
              
              // Ocultar notificación después de 2 segundos
              setTimeout(() => {
                notification.remove();
                this.classList.remove('copied');
              }, 2000);
            })
            .catch(error => {
              console.error('Error al copiar el comando:', error);
            });
        });
      });
    });
  </script>
</body>
</html>`;
}

/**
 * Obtiene el HTML de las recompensas de la misión actual
 * @returns {string} - HTML de las recompensas
 */
function getCurrentRewardsHTML() {
  if (!currentMission) return "";

  const rewards = currentMission.recompensas || {};
  let rewardsHTML = "";

  if (rewards.exp) {
    rewardsHTML += `<li><strong>Experiencia:</strong> ${rewards.exp}</li>`;
  }

  if (rewards.zeny) {
    rewardsHTML += `<li><strong>Zeny:</strong> ${rewards.zeny}</li>`;
  }

  if (rewards.items && rewards.items.length > 0) {
    rewardsHTML += `<li><strong>Objetos:</strong> ${rewards.items.join(
      ", "
    )}</li>`;
  }

  if (rewards.skills && rewards.skills.length > 0) {
    rewardsHTML += `<li><strong>Habilidades:</strong> ${rewards.skills.join(
      ", "
    )}</li>`;
  }

  if (!rewardsHTML) return "";

  return `
    <div class="guide-rewards">
      <h2>Recompensas</h2>
      <ul>${rewardsHTML}</ul>
    </div>
  `;
}
