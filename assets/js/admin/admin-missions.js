/**
 * Funcionalidad para el editor de misiones
 * admin-missions.js
 */

// Variables globales
let currentMissions = [];
let selectedMission = null;
let originalData = null;
let isEditing = false;

// Ruta al archivo JSON de misiones según el juego seleccionado
let missionsJsonPath = "/data/ro/romisiones.json";
let gamePrefix = "ro"; // Prefijo por defecto (Ragnarok Online)

document.addEventListener("DOMContentLoaded", function () {
  // Inicializar editor de misiones
  initMissionsEditor();

  // Configurar selector de juego
  setupGameSelector();

  // Cargar las misiones
  loadMissions();

  // Configurar eventos para el formulario de edición
  setupMissionForm();

  // Configurar botones de acción
  setupActionButtons();
});

/**
 * Inicializa el editor de misiones
 */
function initMissionsEditor() {
  console.log("Inicializando editor de misiones...");

  // Verificar autenticación
  const user = firebase.auth().currentUser;
  if (!user) {
    // Si no hay usuario, redirigir a login
    window.location.href = "../admin/login.html";
    return;
  }

  // Inicializar editor SimpleMDE para descripciones
  if (
    typeof SimpleMDE !== "undefined" &&
    document.getElementById("mission-description")
  ) {
    new SimpleMDE({
      element: document.getElementById("mission-description"),
      spellChecker: false,
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
        "guide",
      ],
      placeholder: "Descripción de la misión...",
    });
  }
}

/**
 * Configura el selector de juego
 */
function setupGameSelector() {
  const gameSelector = document.getElementById("game-selector");
  if (!gameSelector) return;

  // Opciones de juegos
  const games = [
    { id: "ro", name: "Ragnarok Online", path: "/data/ro/romisiones.json" },
    {
      id: "wow",
      name: "World of Warcraft",
      path: "/data/wow/wowmisiones.json",
    },
  ];

  // Generar opciones
  games.forEach((game) => {
    const option = document.createElement("option");
    option.value = game.id;
    option.textContent = game.name;
    gameSelector.appendChild(option);
  });

  // Evento al cambiar de juego
  gameSelector.addEventListener("change", function () {
    gamePrefix = this.value;
    missionsJsonPath =
      games.find((g) => g.id === gamePrefix)?.path ||
      "/data/ro/romisiones.json";

    // Restablecer estado
    selectedMission = null;
    isEditing = false;

    // Cargar misiones del juego seleccionado
    loadMissions();

    // Mostrar vista de lista
    showListView();
  });
}

/**
 * Carga las misiones desde el archivo JSON
 */
function loadMissions() {
  const missionsList = document.getElementById("missions-list");
  if (!missionsList) return;

  // Mostrar cargando
  missionsList.innerHTML = `
    <div class="text-center py-4">
      <div class="spinner-border text-danger" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="mt-2">Cargando misiones...</p>
    </div>
  `;

  // Cargar archivo JSON
  fetch(missionsJsonPath)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      // Guardar datos originales
      originalData = JSON.parse(JSON.stringify(data));

      // Procesar misiones
      if (Array.isArray(data)) {
        currentMissions = data;
      } else {
        console.error("Formato de misiones incorrecto:", data);
        currentMissions = [];
      }

      // Mostrar misiones
      displayMissions(currentMissions);
    })
    .catch((error) => {
      console.error("Error cargando misiones:", error);
      missionsList.innerHTML = `
        <div class="alert alert-danger" role="alert">
          <i class="fas fa-exclamation-circle me-2"></i>
          Error al cargar las misiones. Por favor, intenta de nuevo más tarde.
        </div>
      `;
    });
}

/**
 * Muestra las misiones en la lista
 * @param {Array} missions - Array de misiones
 */
function displayMissions(missions) {
  const missionsList = document.getElementById("missions-list");
  if (!missionsList) return;

  // Vaciar lista
  missionsList.innerHTML = "";

  if (missions.length === 0) {
    missionsList.innerHTML = `
      <div class="text-center py-4">
        <i class="fas fa-info-circle fa-2x mb-3" style="color: #777;"></i>
        <p>No hay misiones para mostrar.</p>
      </div>
    `;
    return;
  }

  // Crear lista de misiones
  const list = document.createElement("ul");
  list.className = "item-list";

  missions.forEach((mission) => {
    const item = document.createElement("li");
    item.className = "item-card";
    item.dataset.id = mission.id;

    // Imagen de portada
    let thumbnailUrl =
      mission.imagen || `assets/images/${gamePrefix}/default-mission.jpg`;

    item.innerHTML = `
      <div class="item-thumbnail">
        <img src="${thumbnailUrl}" alt="${
      mission.titulo
    }" onerror="this.src='assets/images/placeholder.jpg'">
      </div>
      <div class="item-details">
        <h4 class="item-title">${mission.titulo}</h4>
        <p class="item-description">${mission.descripcion.substring(
          0,
          100
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
          <span class="badge badge-primary">Nivel ${mission.nivel}</span>
        </div>
      </div>
      <div class="item-actions">
        <button type="button" class="btn-edit" title="Editar">
          <i class="fas fa-edit"></i>
        </button>
        <button type="button" class="btn-delete" title="Eliminar">
          <i class="fas fa-trash-alt"></i>
        </button>
      </div>
    `;

    // Evento para editar
    item.querySelector(".btn-edit").addEventListener("click", function (e) {
      e.stopPropagation();
      editMission(mission.id);
    });

    // Evento para eliminar
    item.querySelector(".btn-delete").addEventListener("click", function (e) {
      e.stopPropagation();
      deleteMission(mission.id);
    });

    // Evento para seleccionar/ver detalles
    item.addEventListener("click", function () {
      viewMission(mission.id);
    });

    list.appendChild(item);
  });

  missionsList.appendChild(list);
}

/**
 * Configura el formulario de edición de misiones
 */
function setupMissionForm() {
  const missionForm = document.getElementById("mission-form");
  if (!missionForm) return;

  // Evento de envío del formulario
  missionForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Validar formulario
    if (!validateMissionForm()) {
      showToast("Por favor, completa todos los campos obligatorios.", "error");
      return;
    }

    // Mostrar cargando
    const loading = showLoading("Guardando misión...");

    // Obtener datos del formulario
    const missionData = getMissionFormData();

    // Si estamos editando, actualizar misión existente
    if (isEditing && selectedMission) {
      const index = currentMissions.findIndex((m) => m.id === selectedMission);
      if (index !== -1) {
        currentMissions[index] = {
          ...currentMissions[index],
          ...missionData,
        };
      }
    } else {
      // Generar ID para nueva misión
      const newId = generateMissionId(missionData.titulo);

      // Añadir nueva misión
      currentMissions.push({
        id: newId,
        ...missionData,
      });
    }

    // Guardar cambios
    saveMissions()
      .then(() => {
        loading.hide();

        // Mostrar mensaje de éxito
        showToast(
          isEditing
            ? "Misión actualizada correctamente."
            : "Misión creada correctamente.",
          "success"
        );

        // Volver a la lista
        showListView();

        // Registrar actividad
        logActivity(isEditing ? "update" : "create", {
          targetType: "misión",
          targetName: missionData.titulo,
          gamePrefix,
        });
      })
      .catch((error) => {
        loading.hide();
        showToast("Error al guardar la misión: " + error.message, "error");
      });
  });

  // Botón para cancelar edición
  const cancelButton = document.getElementById("cancel-button");
  if (cancelButton) {
    cancelButton.addEventListener("click", function () {
      showListView();
    });
  }

  // Inicializar tags
  setupTagsInput();

  // Inicializar subida de imágenes
  setupImageUpload();
}

/**
 * Configura el input de tags
 */
function setupTagsInput() {
  const tagsContainer = document.getElementById("tags-container");
  const tagsInput = document.getElementById("tags-input");
  const addTagBtn = document.getElementById("add-tag-btn");

  if (!tagsContainer || !tagsInput || !addTagBtn) return;

  // Función para añadir tag
  const addTag = () => {
    const tagValue = tagsInput.value.trim();
    if (tagValue === "") return;

    // Crear elemento de tag
    const tag = document.createElement("div");
    tag.className = "tag";

    tag.innerHTML = `
      ${tagValue}
      <button type="button" class="tag-remove">
        <i class="fas fa-times"></i>
      </button>
    `;

    // Evento para eliminar tag
    tag.querySelector(".tag-remove").addEventListener("click", function () {
      tag.remove();
    });

    // Añadir a contenedor
    tagsContainer.appendChild(tag);

    // Limpiar input
    tagsInput.value = "";
    tagsInput.focus();
  };

  // Evento para añadir tag
  addTagBtn.addEventListener("click", addTag);

  // Evento para añadir tag con Enter
  tagsInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  });
}

/**
 * Configura la subida de imágenes
 */
function setupImageUpload() {
  const imageUpload = document.getElementById("mission-image-upload");
  const imagePreview = document.getElementById("mission-image-preview");

  if (!imageUpload || !imagePreview) return;

  // Evento para cambio de archivo
  imageUpload.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    // Verificar tipo de archivo
    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      showToast(
        "Por favor, selecciona un archivo de imagen válido (JPEG, PNG, GIF).",
        "error"
      );
      imageUpload.value = "";
      return;
    }

    // Mostrar vista previa
    const reader = new FileReader();
    reader.onload = function (event) {
      imagePreview.innerHTML = `
        <img src="${event.target.result}" class="preview-image" alt="Vista previa">
      `;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Obtiene los datos del formulario de misión
 * @returns {Object} - Datos de la misión
 */
function getMissionFormData() {
  // Obtener valores de los campos
  const title = document.getElementById("mission-title").value;
  const level = document.getElementById("mission-level").value;

  // Obtener descripción del editor SimpleMDE
  let description = "";
  if (typeof SimpleMDE !== "undefined") {
    const simplemde = document
      .querySelector(".CodeMirror")
      .CodeMirror.getValue();
    description = simplemde;
  } else {
    description = document.getElementById("mission-description").value;
  }

  // Obtener tags
  const tags = [];
  document.querySelectorAll("#tags-container .tag").forEach((tag) => {
    const tagText = tag.textContent.trim();
    if (tagText) {
      tags.push(tagText);
    }
  });

  // Obtener recompensas
  const rewards = {
    exp: parseInt(document.getElementById("reward-exp").value) || 0,
    zeny: parseInt(document.getElementById("reward-zeny").value) || 0,
    items: document
      .getElementById("reward-items")
      .value.split(",")
      .map((item) => item.trim())
      .filter((item) => item !== ""),
    skills: document
      .getElementById("reward-skills")
      .value.split(",")
      .map((skill) => skill.trim())
      .filter((skill) => skill !== ""),
  };

  // Construir objeto de misión
  return {
    titulo: title,
    descripcion: description,
    nivel: level,
    fecha: new Date().toISOString().split("T")[0],
    tags,
    recompensas: rewards,
    // Nota: La imagen se subirá por separado
    imagen:
      document.getElementById("mission-image").value ||
      `assets/images/${gamePrefix}/romisiones/default.jpg`,
    url:
      document.getElementById("mission-url").value ||
      `pages/${gamePrefix}/romisiones/${generateSlug(title)}.html`,
  };
}

/**
 * Valida el formulario de misión
 * @returns {boolean} - true si es válido
 */
function validateMissionForm() {
  // Campos obligatorios
  const requiredFields = ["mission-title", "mission-level"];

  // Verificar campos
  for (const fieldId of requiredFields) {
    const field = document.getElementById(fieldId);
    if (!field || !field.value.trim()) {
      return false;
    }
  }

  return true;
}

/**
 * Configura los botones de acción
 */
function setupActionButtons() {
  // Botón para nueva misión
  const newMissionBtn = document.getElementById("new-mission-btn");
  if (newMissionBtn) {
    newMissionBtn.addEventListener("click", function () {
      createNewMission();
    });
  }

  // Botón para guardar todos los cambios
  const saveAllBtn = document.getElementById("save-all-btn");
  if (saveAllBtn) {
    saveAllBtn.addEventListener("click", function () {
      saveAllChanges();
    });
  }

  // Botón para descartar los cambios
  const discardBtn = document.getElementById("discard-btn");
  if (discardBtn) {
    discardBtn.addEventListener("click", function () {
      discardChanges();
    });
  }
}

/**
 * Inicia la creación de una nueva misión
 */
function createNewMission() {
  // Limpiar formulario
  clearMissionForm();

  // Mostrar vista de edición
  showEditView();

  // Establecer modo creación
  isEditing = false;
  selectedMission = null;

  // Cambiar título
  document.getElementById("form-title").textContent = "Crear Nueva Misión";
}

/**
 * Inicia la edición de una misión existente
 * @param {string} missionId - ID de la misión
 */
function editMission(missionId) {
  // Buscar misión
  const mission = currentMissions.find((m) => m.id === missionId);
  if (!mission) {
    showToast("Misión no encontrada.", "error");
    return;
  }

  // Establecer modo edición
  isEditing = true;
  selectedMission = missionId;

  // Llenar formulario
  fillMissionForm(mission);

  // Mostrar vista de edición
  showEditView();

  // Cambiar título
  document.getElementById("form-title").textContent = "Editar Misión";
}

/**
 * Muestra los detalles de una misión
 * @param {string} missionId - ID de la misión
 */
function viewMission(missionId) {
  // Buscar misión
  const mission = currentMissions.find((m) => m.id === missionId);
  if (!mission) {
    showToast("Misión no encontrada.", "error");
    return;
  }

  // Llenar vista de detalles
  fillMissionDetails(mission);

  // Mostrar vista de detalles
  showDetailView();
}

/**
 * Elimina una misión
 * @param {string} missionId - ID de la misión
 */
function deleteMission(missionId) {
  // Buscar misión
  const mission = currentMissions.find((m) => m.id === missionId);
  if (!mission) {
    showToast("Misión no encontrada.", "error");
    return;
  }

  // Mostrar confirmación
  showConfirm(
    `¿Estás seguro de que deseas eliminar la misión "${mission.titulo}"? Esta acción no se puede deshacer.`,
    function () {
      // Eliminar misión
      currentMissions = currentMissions.filter((m) => m.id !== missionId);

      // Guardar cambios
      const loading = showLoading("Eliminando misión...");

      saveMissions()
        .then(() => {
          loading.hide();

          // Mostrar mensaje de éxito
          showToast("Misión eliminada correctamente.", "success");

          // Actualizar vista
          displayMissions(currentMissions);

          // Registrar actividad
          logActivity("delete", {
            targetType: "misión",
            targetName: mission.titulo,
            gamePrefix,
          });
        })
        .catch((error) => {
          loading.hide();
          showToast("Error al eliminar la misión: " + error.message, "error");
        });
    }
  );
}

/**
 * Guarda todos los cambios
 */
function saveAllChanges() {
  // Mostrar confirmación
  showConfirm(
    "Se guardarán todos los cambios realizados. ¿Estás seguro?",
    function () {
      // Mostrar cargando
      const loading = showLoading("Guardando cambios...");

      // Guardar misiones
      saveMissions()
        .then(() => {
          loading.hide();

          // Mostrar mensaje de éxito
          showToast("Cambios guardados correctamente.", "success");

          // Registrar actividad
          logActivity("update", {
            targetType: "misiones",
            gamePrefix,
          });
        })
        .catch((error) => {
          loading.hide();
          showToast("Error al guardar los cambios: " + error.message, "error");
        });
    }
  );
}

/**
 * Descarta todos los cambios
 */
function discardChanges() {
  // Mostrar confirmación
  showConfirm(
    "Se perderán todos los cambios realizados. ¿Estás seguro?",
    function () {
      // Restaurar datos originales
      if (originalData) {
        currentMissions = JSON.parse(JSON.stringify(originalData));

        // Actualizar vista
        displayMissions(currentMissions);

        // Mostrar mensaje
        showToast("Cambios descartados.", "info");
      }
    }
  );
}

/**
 * Guarda las misiones en el archivo JSON
 * @returns {Promise} - Promesa que resuelve cuando se completa el guardado
 */
function saveMissions() {
  return new Promise((resolve, reject) => {
    // Por ahora, simularemos un guardado exitoso con setTimeout
    // En un entorno real, usaríamos la API de GitHub o Firebase
    setTimeout(() => {
      try {
        // Podríamos usar localStorage para guardar temporalmente
        localStorage.setItem(
          `${gamePrefix}-missions`,
          JSON.stringify(currentMissions)
        );

        // En implementación real:
        // return saveJSON(missionsJsonPath, currentMissions, `Actualización de misiones de ${gamePrefix}`);

        resolve();
      } catch (error) {
        reject(error);
      }
    }, 1000);
  });
}

/**
 * Limpia el formulario de misión
 */
function clearMissionForm() {
  // Limpiar campos
  document.getElementById("mission-title").value = "";
  document.getElementById("mission-level").value = "";
  document.getElementById("mission-url").value = "";
  document.getElementById("mission-image").value = "";

  // Limpiar editor SimpleMDE
  if (typeof SimpleMDE !== "undefined") {
    const editor = document.querySelector(".CodeMirror").CodeMirror;
    editor.setValue("");
  } else {
    document.getElementById("mission-description").value = "";
  }

  // Limpiar tags
  const tagsContainer = document.getElementById("tags-container");
  if (tagsContainer) {
    tagsContainer.innerHTML = "";
  }

  // Limpiar recompensas
  document.getElementById("reward-exp").value = "0";
  document.getElementById("reward-zeny").value = "0";
  document.getElementById("reward-items").value = "";
  document.getElementById("reward-skills").value = "";

  // Limpiar preview de imagen
  const imagePreview = document.getElementById("mission-image-preview");
  if (imagePreview) {
    imagePreview.innerHTML = "";
  }
}

/**
 * Llena el formulario con los datos de una misión
 * @param {Object} mission - Misión a editar
 */
function fillMissionForm(mission) {
  // Llenar campos
  document.getElementById("mission-title").value = mission.titulo || "";
  document.getElementById("mission-level").value = mission.nivel || "";
  document.getElementById("mission-url").value = mission.url || "";
  document.getElementById("mission-image").value = mission.imagen || "";

  // Llenar editor SimpleMDE
  if (typeof SimpleMDE !== "undefined") {
    const editor = document.querySelector(".CodeMirror").CodeMirror;
    editor.setValue(mission.descripcion || "");
  } else {
    document.getElementById("mission-description").value =
      mission.descripcion || "";
  }

  // Llenar tags
  const tagsContainer = document.getElementById("tags-container");
  if (tagsContainer) {
    tagsContainer.innerHTML = "";

    if (mission.tags && Array.isArray(mission.tags)) {
      mission.tags.forEach((tag) => {
        // Crear elemento de tag
        const tagElement = document.createElement("div");
        tagElement.className = "tag";

        tagElement.innerHTML = `
          ${tag}
          <button type="button" class="tag-remove">
            <i class="fas fa-times"></i>
          </button>
        `;

        // Evento para eliminar tag
        tagElement
          .querySelector(".tag-remove")
          .addEventListener("click", function () {
            tagElement.remove();
          });

        // Añadir a contenedor
        tagsContainer.appendChild(tagElement);
      });
    }
  }

  // Llenar recompensas
  const rewards = mission.recompensas || {};
  document.getElementById("reward-exp").value = rewards.exp || "0";
  document.getElementById("reward-zeny").value = rewards.zeny || "0";
  document.getElementById("reward-items").value = Array.isArray(rewards.items)
    ? rewards.items.join(", ")
    : "";
  document.getElementById("reward-skills").value = Array.isArray(rewards.skills)
    ? rewards.skills.join(", ")
    : "";

  // Mostrar preview de imagen
  const imagePreview = document.getElementById("mission-image-preview");
  if (imagePreview && mission.imagen) {
    imagePreview.innerHTML = `
      <img src="${mission.imagen}" class="preview-image" alt="Vista previa" onerror="this.src='assets/images/placeholder.jpg'">
    `;
  }
}

/**
 * Llena la vista de detalles con los datos de una misión
 * @param {Object} mission - Misión a mostrar
 */
function fillMissionDetails(mission) {
  const detailsContainer = document.getElementById("mission-details");
  if (!detailsContainer) return;

  // Imagen de portada
  let thumbnailUrl =
    mission.imagen || `assets/images/${gamePrefix}/default-mission.jpg`;

  // Formato de recompensas
  const rewards = mission.recompensas || {};
  let rewardsHTML = "";

  if (rewards.exp) {
    rewardsHTML += `<div><strong>Experiencia:</strong> ${rewards.exp}</div>`;
  }

  if (rewards.zeny) {
    rewardsHTML += `<div><strong>Zeny:</strong> ${rewards.zeny}</div>`;
  }

  if (rewards.items && rewards.items.length > 0) {
    rewardsHTML += `<div><strong>Objetos:</strong> ${rewards.items.join(
      ", "
    )}</div>`;
  }

  if (rewards.skills && rewards.skills.length > 0) {
    rewardsHTML += `<div><strong>Habilidades:</strong> ${rewards.skills.join(
      ", "
    )}</div>`;
  }

  // Construir HTML de detalles
  detailsContainer.innerHTML = `
    <div class="mission-header">
      <img src="${thumbnailUrl}" class="mission-cover" alt="${
    mission.titulo
  }" onerror="this.src='assets/images/placeholder.jpg'">
      <div class="mission-title-container">
        <h2>${mission.titulo}</h2>
        <div class="mission-meta">
          <span><i class="fas fa-signal"></i> Nivel: ${mission.nivel}</span>
          <span><i class="fas fa-calendar-alt"></i> Fecha: ${formatDate(
            mission.fecha
          )}</span>
        </div>
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
    
    <div class="mission-section">
      <h3>Descripción</h3>
      <div class="mission-description">
        ${mission.descripcion}
      </div>
    </div>
    
    <div class="mission-section">
      <h3>Recompensas</h3>
      <div class="mission-rewards">
        ${rewardsHTML || "<p>No hay recompensas especificadas.</p>"}
      </div>
    </div>
    
    <div class="mission-section">
      <h3>Información Adicional</h3>
      <div class="mission-info">
        <div><strong>ID:</strong> ${mission.id}</div>
        <div><strong>URL:</strong> <a href="${mission.url}" target="_blank">${
    mission.url
  }</a></div>
      </div>
    </div>
    
    <div class="mission-actions">
      <button type="button" class="btn-primary" id="edit-mission-btn">
        <i class="fas fa-edit"></i> Editar
      </button>
      <button type="button" class="btn-danger" id="delete-mission-btn">
        <i class="fas fa-trash-alt"></i> Eliminar
      </button>
      <button type="button" class="btn-secondary" id="back-to-list-btn">
        <i class="fas fa-arrow-left"></i> Volver
      </button>
    </div>
  `;

  // Configurar botones
  detailsContainer
    .querySelector("#edit-mission-btn")
    .addEventListener("click", function () {
      editMission(mission.id);
    });

  detailsContainer
    .querySelector("#delete-mission-btn")
    .addEventListener("click", function () {
      deleteMission(mission.id);
    });

  detailsContainer
    .querySelector("#back-to-list-btn")
    .addEventListener("click", function () {
      showListView();
    });
}

/**
 * Muestra la vista de lista
 */
function showListView() {
  // Mostrar/ocultar secciones
  document.getElementById("missions-list-section").style.display = "block";
  document.getElementById("mission-edit-section").style.display = "none";
  document.getElementById("mission-detail-section").style.display = "none";
}

/**
 * Muestra la vista de edición
 */
function showEditView() {
  // Mostrar/ocultar secciones
  document.getElementById("missions-list-section").style.display = "none";
  document.getElementById("mission-edit-section").style.display = "block";
  document.getElementById("mission-detail-section").style.display = "none";
}

/**
 * Muestra la vista de detalles
 */
function showDetailView() {
  // Mostrar/ocultar secciones
  document.getElementById("missions-list-section").style.display = "none";
  document.getElementById("mission-edit-section").style.display = "none";
  document.getElementById("mission-detail-section").style.display = "block";
}

/**
 * Genera un ID para una misión
 * @param {string} title - Título de la misión
 * @returns {string} - ID generado
 */
function generateMissionId(title) {
  return generateSlug(title) + "-" + Date.now().toString(36);
}

/**
 * Genera un slug a partir de un texto
 * @param {string} text - Texto a convertir
 * @returns {string} - Slug generado
 */
function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[áàäâãå]/g, "a")
    .replace(/[éèëê]/g, "e")
    .replace(/[íìïî]/g, "i")
    .replace(/[óòöôõ]/g, "o")
    .replace(/[úùüû]/g, "u")
    .replace(/[ñ]/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
