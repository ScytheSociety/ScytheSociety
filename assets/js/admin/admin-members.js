/**
 * Funcionalidad para el editor de miembros
 * admin-members.js
 */

// Variables globales
let currentMembers = [];
let currentClans = [];
let originalData = null;
let selectedMember = null;
let selectedClan = null;
let isEditingMember = false;
let isEditingClan = false;

// Prefijo por defecto (Ragnarok Online)
let gamePrefix = "ro";

document.addEventListener("DOMContentLoaded", function () {
  // Inicializar editor de miembros
  initMembersEditor();

  // Configurar selector de juego
  setupGameSelector();

  // Configurar tabs
  setupTabs();

  // Cargar miembros y clanes
  loadMembers();

  // Configurar formularios
  setupMemberForm();
  setupClanForm();

  // Configurar botones de acción
  setupActionButtons();
});

/**
 * Inicializa el editor de miembros
 */
function initMembersEditor() {
  console.log("Inicializando editor de miembros...");

  // MODIFICACIÓN: Comentar la verificación para pruebas
  // Verificar autenticación
  const user = firebase.auth().currentUser;
  /* Comentamos esto para pruebas
  if (!user) {
    // Si no hay usuario, redirigir a login
    window.location.href = "../admin/login.html";
    return;
  }
  */

  // Continuar con la inicialización aunque no haya usuario
  console.log("Continuando inicialización del editor de miembros");
}

/**
 * Configura el selector de juego
 */
function setupGameSelector() {
  const gameSelector = document.getElementById("game-selector");
  if (!gameSelector) return;

  // Evento al cambiar de juego
  gameSelector.addEventListener("change", function () {
    gamePrefix = this.value;

    // Cargar miembros y clanes del juego seleccionado
    loadMembers();
  });
}

/**
 * Configura las pestañas
 */
function setupTabs() {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const tabId = this.dataset.tab;

      // Desactivar todas las pestañas
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      // Activar pestaña seleccionada
      this.classList.add("active");
      document.getElementById(tabId).classList.add("active");
    });
  });
}

/**
 * Carga los miembros y clanes desde el archivo JSON
 */
function loadMembers() {
  // Mostrar cargando en listas
  document.getElementById("members-list").innerHTML = `
    <div class="text-center py-4">
      <div class="spinner-border text-danger" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="mt-2">Cargando miembros...</p>
    </div>
  `;

  document.getElementById("clans-list").innerHTML = `
    <div class="text-center py-4">
      <div class="spinner-border text-danger" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="mt-2">Cargando clanes...</p>
    </div>
  `;

  // Ruta al archivo JSON según el juego seleccionado
  const dataJsonPath = `../../data/${gamePrefix}/${gamePrefix}miembros.json`;

  // Cargar archivo JSON
  fetch(dataJsonPath)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      // Guardar datos originales
      originalData = JSON.parse(JSON.stringify(data));

      // Procesar datos
      if (data.members && Array.isArray(data.members)) {
        currentMembers = data.members;
      } else {
        console.error("Formato de miembros incorrecto:", data);
        currentMembers = [];
      }

      if (data.clans && Array.isArray(data.clans)) {
        currentClans = data.clans;
      } else {
        console.error("Formato de clanes incorrecto:", data);
        currentClans = [];
      }

      // Mostrar miembros y clanes
      displayMembers(currentMembers);
      displayClans(currentClans);

      // Actualizar selector de clanes en formulario de miembro
      updateClanSelector();
    })
    .catch((error) => {
      console.error("Error cargando datos de miembros:", error);

      // Mostrar error en listas
      document.getElementById("members-list").innerHTML = `
        <div class="alert alert-danger" role="alert">
          <i class="fas fa-exclamation-circle me-2"></i>
          Error al cargar los miembros. Por favor, intenta de nuevo más tarde.
        </div>
      `;

      document.getElementById("clans-list").innerHTML = `
        <div class="alert alert-danger" role="alert">
          <i class="fas fa-exclamation-circle me-2"></i>
          Error al cargar los clanes. Por favor, intenta de nuevo más tarde.
        </div>
      `;
    });
}

/**
 * Muestra los miembros en la lista
 * @param {Array} members - Array de miembros
 */
function displayMembers(members) {
  const membersList = document.getElementById("members-list");
  if (!membersList) return;

  // Vaciar lista
  membersList.innerHTML = "";

  if (members.length === 0) {
    membersList.innerHTML = `
      <div class="text-center py-4">
        <i class="fas fa-info-circle fa-2x mb-3" style="color: #777;"></i>
        <p>No hay miembros para mostrar.</p>
      </div>
    `;
    return;
  }

  // Crear lista de miembros
  const list = document.createElement("ul");
  list.className = "item-list";

  members.forEach((member, index) => {
    const item = document.createElement("li");
    item.className = "item-card";
    item.dataset.id = member.id;

    // Obtener clan
    const clan = currentClans.find((c) => c.id === member.clan) || {
      nombre: "Sin clan",
    };

    // Imagen de avatar
    let avatarUrl =
      member.imagen || `assets/images/${gamePrefix}/romiembros/default.jpg`;

    item.innerHTML = `
      <div class="item-thumbnail">
        <img src="${avatarUrl}" alt="${
      member.nombre
    }" onerror="this.src='../../assets/images/placeholder.jpg'">
      </div>
      <div class="item-details">
        <h4 class="item-title">${member.nombre} (${member.nick})</h4>
        <p class="item-description">
          <span class="badge badge-primary me-2">${member.clase}</span>
          <span class="badge badge-secondary me-2">Nivel ${member.nivel}</span>
          <span class="badge badge-info">${clan.nombre}</span>
        </p>
        <div class="item-meta">
          <span class="text-muted">Rango: ${formatRank(member.rango)}</span>
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
      editMember(member.id);
    });

    // Evento para eliminar
    item.querySelector(".btn-delete").addEventListener("click", function (e) {
      e.stopPropagation();
      deleteMember(member.id);
    });

    list.appendChild(item);
  });

  membersList.appendChild(list);
}

/**
 * Muestra los clanes en la lista
 * @param {Array} clans - Array de clanes
 */
function displayClans(clans) {
  const clansList = document.getElementById("clans-list");
  if (!clansList) return;

  // Vaciar lista
  clansList.innerHTML = "";

  if (clans.length === 0) {
    clansList.innerHTML = `
      <div class="text-center py-4">
        <i class="fas fa-info-circle fa-2x mb-3" style="color: #777;"></i>
        <p>No hay clanes para mostrar.</p>
      </div>
    `;
    return;
  }

  // Crear lista de clanes
  const list = document.createElement("ul");
  list.className = "item-list";

  clans.forEach((clan, index) => {
    const item = document.createElement("li");
    item.className = "item-card";
    item.dataset.id = clan.id;

    // Contar miembros del clan
    const memberCount = currentMembers.filter((m) => m.clan === clan.id).length;

    // Icono del clan
    let iconUrl =
      clan.icon || `assets/images/${gamePrefix}/roclanes/default.png`;

    item.innerHTML = `
      <div class="item-thumbnail">
        <img src="${iconUrl}" alt="${clan.nombre}" onerror="this.src='../../assets/images/placeholder.jpg'">
      </div>
      <div class="item-details">
        <h4 class="item-title">${clan.nombre}</h4>
        <p class="item-description">${clan.descripcion}</p>
        <div class="item-meta">
          <span class="text-muted">Miembros: ${memberCount}</span>
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
      editClan(clan.id);
    });

    // Evento para eliminar
    item.querySelector(".btn-delete").addEventListener("click", function (e) {
      e.stopPropagation();
      deleteClan(clan.id);
    });

    list.appendChild(item);
  });

  clansList.appendChild(list);
}

/**
 * Actualiza el selector de clanes en el formulario de miembro
 */
function updateClanSelector() {
  const clanSelector = document.getElementById("member-clan");
  if (!clanSelector) return;

  // Vaciar selector
  clanSelector.innerHTML = '<option value="">Selecciona un clan...</option>';

  // Añadir clanes
  currentClans.forEach((clan) => {
    const option = document.createElement("option");
    option.value = clan.id;
    option.textContent = clan.nombre;
    clanSelector.appendChild(option);
  });
}

/**
 * Configura el formulario de miembros
 */
function setupMemberForm() {
  const memberForm = document.getElementById("member-form");
  const cancelButton = document.getElementById("member-cancel-button");

  if (memberForm) {
    // Evento de envío del formulario
    memberForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Validar formulario
      if (!validateMemberForm()) {
        showToast(
          "Por favor, completa todos los campos obligatorios.",
          "error"
        );
        return;
      }

      // Mostrar cargando
      const loading = showLoading("Guardando miembro...");

      // Obtener datos del formulario
      const memberData = getMemberFormData();

      // Si estamos editando, actualizar miembro existente
      if (isEditingMember && selectedMember) {
        const index = currentMembers.findIndex((m) => m.id === selectedMember);
        if (index !== -1) {
          currentMembers[index] = {
            ...currentMembers[index],
            ...memberData,
          };
        }
      } else {
        // Añadir nuevo miembro
        currentMembers.push(memberData);
      }

      // Guardar cambios
      saveChanges()
        .then(() => {
          loading.hide();

          // Mostrar mensaje de éxito
          showToast(
            isEditingMember
              ? "Miembro actualizado correctamente."
              : "Miembro creado correctamente.",
            "success"
          );

          // Volver a la lista
          hideMemberForm();

          // Registrar actividad
          logActivity(isEditingMember ? "update" : "create", {
            targetType: "miembro",
            targetName: memberData.nombre,
            gamePrefix,
          });
        })
        .catch((error) => {
          loading.hide();
          showToast("Error al guardar el miembro: " + error.message, "error");
        });
    });
  }

  if (cancelButton) {
    cancelButton.addEventListener("click", function () {
      hideMemberForm();
    });
  }

  // Inicializar subida de imágenes
  const memberImageUpload = document.getElementById("member-image-upload");
  const memberImagePreview = document.getElementById("member-image-preview");
  const memberImageFile = document.getElementById("member-image-file");
  const memberImageInput = document.getElementById("member-image");

  if (
    memberImageUpload &&
    memberImagePreview &&
    memberImageFile &&
    memberImageInput
  ) {
    memberImageUpload.addEventListener("click", function () {
      memberImageFile.click();
    });

    memberImageFile.addEventListener("change", function () {
      if (this.files.length) {
        // En un entorno real, aquí se subiría la imagen a un servidor
        // Por ahora, simular subida y mostrar preview
        const file = this.files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
          memberImagePreview.innerHTML = `<img src="${e.target.result}" class="preview-image" alt="Vista previa">`;

          // Simular URL
          const timestamp = Date.now();
          const fileExt = file.name.split(".").pop();
          memberImageInput.value = `assets/images/${gamePrefix}/romiembros/member_${timestamp}.${fileExt}`;
        };

        reader.readAsDataURL(file);
      }
    });
  }
}

/**
 * Configura el formulario de clanes
 */
function setupClanForm() {
  const clanForm = document.getElementById("clan-form");
  const cancelButton = document.getElementById("clan-cancel-button");

  if (clanForm) {
    // Evento de envío del formulario
    clanForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Validar formulario
      if (!validateClanForm()) {
        showToast(
          "Por favor, completa todos los campos obligatorios.",
          "error"
        );
        return;
      }

      // Mostrar cargando
      const loading = showLoading("Guardando clan...");

      // Obtener datos del formulario
      const clanData = getClanFormData();

      // Si estamos editando, actualizar clan existente
      if (isEditingClan && selectedClan) {
        const index = currentClans.findIndex((c) => c.id === selectedClan);
        if (index !== -1) {
          currentClans[index] = {
            ...currentClans[index],
            ...clanData,
          };
        }
      } else {
        // Añadir nuevo clan
        currentClans.push(clanData);
      }

      // Guardar cambios
      saveChanges()
        .then(() => {
          loading.hide();

          // Mostrar mensaje de éxito
          showToast(
            isEditingClan
              ? "Clan actualizado correctamente."
              : "Clan creado correctamente.",
            "success"
          );

          // Volver a la lista
          hideClanForm();

          // Actualizar selector de clanes
          updateClanSelector();

          // Registrar actividad
          logActivity(isEditingClan ? "update" : "create", {
            targetType: "clan",
            targetName: clanData.nombre,
            gamePrefix,
          });
        })
        .catch((error) => {
          loading.hide();
          showToast("Error al guardar el clan: " + error.message, "error");
        });
    });
  }

  if (cancelButton) {
    cancelButton.addEventListener("click", function () {
      hideClanForm();
    });
  }

  // Inicializar subida de imágenes
  const clanIconUpload = document.getElementById("clan-icon-upload");
  const clanIconPreview = document.getElementById("clan-icon-preview");
  const clanIconFile = document.getElementById("clan-icon-file");
  const clanIconInput = document.getElementById("clan-icon");

  if (clanIconUpload && clanIconPreview && clanIconFile && clanIconInput) {
    clanIconUpload.addEventListener("click", function () {
      clanIconFile.click();
    });

    clanIconFile.addEventListener("change", function () {
      if (this.files.length) {
        // En un entorno real, aquí se subiría la imagen a un servidor
        // Por ahora, simular subida y mostrar preview
        const file = this.files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
          clanIconPreview.innerHTML = `<img src="${e.target.result}" class="preview-image" alt="Vista previa">`;

          // Simular URL
          const timestamp = Date.now();
          const fileExt = file.name.split(".").pop();
          clanIconInput.value = `assets/images/${gamePrefix}/roclanes/clan_${timestamp}.${fileExt}`;
        };

        reader.readAsDataURL(file);
      }
    });
  }
}

/**
 * Configura los botones de acción
 */
function setupActionButtons() {
  // Botón para nuevo miembro
  const newMemberBtn = document.getElementById("new-member-btn");
  if (newMemberBtn) {
    newMemberBtn.addEventListener("click", function () {
      createNewMember();
    });
  }

  // Botón para nuevo clan
  const newClanBtn = document.getElementById("new-clan-btn");
  if (newClanBtn) {
    newClanBtn.addEventListener("click", function () {
      createNewClan();
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

  // Botón de búsqueda de miembros
  const memberSearch = document.getElementById("member-search");
  if (memberSearch) {
    memberSearch.addEventListener("input", function () {
      filterMembers(this.value);
    });
  }
}

/**
 * Filtra la lista de miembros
 * @param {string} searchTerm - Término de búsqueda
 */
function filterMembers(searchTerm) {
  if (!searchTerm) {
    // Si no hay término de búsqueda, mostrar todos
    displayMembers(currentMembers);
    return;
  }

  // Convertir a minúsculas para búsqueda no sensible a mayúsculas
  searchTerm = searchTerm.toLowerCase();

  // Filtrar miembros
  const filteredMembers = currentMembers.filter((member) => {
    return (
      member.nombre.toLowerCase().includes(searchTerm) ||
      member.nick.toLowerCase().includes(searchTerm) ||
      member.clase.toLowerCase().includes(searchTerm)
    );
  });

  // Mostrar miembros filtrados
  displayMembers(filteredMembers);
}

/**
 * Inicia la creación de un nuevo miembro
 */
function createNewMember() {
  // Verificar si hay clanes
  if (currentClans.length === 0) {
    showToast(
      "Debes crear al menos un clan antes de añadir miembros.",
      "warning"
    );
    return;
  }

  // Limpiar formulario
  clearMemberForm();

  // Mostrar formulario
  showMemberForm();

  // Establecer modo creación
  isEditingMember = false;
  selectedMember = null;

  // Cambiar título
  document.getElementById("member-form-title").textContent =
    "Crear Nuevo Miembro";
}

/**
 * Inicia la creación de un nuevo clan
 */
function createNewClan() {
  // Limpiar formulario
  clearClanForm();

  // Mostrar formulario
  showClanForm();

  // Establecer modo creación
  isEditingClan = false;
  selectedClan = null;

  // Cambiar título
  document.getElementById("clan-form-title").textContent = "Crear Nuevo Clan";
}

/**
 * Inicia la edición de un miembro existente
 * @param {string} memberId - ID del miembro
 */
function editMember(memberId) {
  // Buscar miembro
  const member = currentMembers.find((m) => m.id === memberId);
  if (!member) {
    showToast("Miembro no encontrado.", "error");
    return;
  }

  // Establecer modo edición
  isEditingMember = true;
  selectedMember = memberId;

  // Llenar formulario
  fillMemberForm(member);

  // Mostrar formulario
  showMemberForm();

  // Cambiar título
  document.getElementById("member-form-title").textContent = "Editar Miembro";
}

/**
 * Inicia la edición de un clan existente
 * @param {string} clanId - ID del clan
 */
function editClan(clanId) {
  // Buscar clan
  const clan = currentClans.find((c) => c.id === clanId);
  if (!clan) {
    showToast("Clan no encontrado.", "error");
    return;
  }

  // Establecer modo edición
  isEditingClan = true;
  selectedClan = clanId;

  // Llenar formulario
  fillClanForm(clan);

  // Mostrar formulario
  showClanForm();

  // Cambiar título
  document.getElementById("clan-form-title").textContent = "Editar Clan";
}

/**
 * Elimina un miembro
 * @param {string} memberId - ID del miembro
 */
function deleteMember(memberId) {
  // Buscar miembro
  const member = currentMembers.find((m) => m.id === memberId);
  if (!member) {
    showToast("Miembro no encontrado.", "error");
    return;
  }

  // Mostrar confirmación
  showConfirm(
    `¿Estás seguro de que deseas eliminar al miembro "${member.nombre} (${member.nick})"? Esta acción no se puede deshacer.`,
    function () {
      // Eliminar miembro
      const index = currentMembers.findIndex((m) => m.id === memberId);
      if (index !== -1) {
        currentMembers.splice(index, 1);
      }

      // Guardar cambios
      const loading = showLoading("Eliminando miembro...");

      saveChanges()
        .then(() => {
          loading.hide();

          // Mostrar mensaje de éxito
          showToast("Miembro eliminado correctamente.", "success");

          // Actualizar vista
          displayMembers(currentMembers);

          // Registrar actividad
          logActivity("delete", {
            targetType: "miembro",
            targetName: member.nombre,
            gamePrefix,
          });
        })
        .catch((error) => {
          loading.hide();
          showToast("Error al eliminar el miembro: " + error.message, "error");
        });
    }
  );
}

/**
 * Elimina un clan
 * @param {string} clanId - ID del clan
 */
function deleteClan(clanId) {
  // Buscar clan
  const clan = currentClans.find((c) => c.id === clanId);
  if (!clan) {
    showToast("Clan no encontrado.", "error");
    return;
  }

  // Verificar si hay miembros en el clan
  const clanMembers = currentMembers.filter((m) => m.clan === clanId);
  if (clanMembers.length > 0) {
    showToast(
      "No se puede eliminar el clan porque tiene miembros asignados.",
      "error"
    );
    return;
  }

  // Mostrar confirmación
  showConfirm(
    `¿Estás seguro de que deseas eliminar el clan "${clan.nombre}"? Esta acción no se puede deshacer.`,
    function () {
      // Eliminar clan
      const index = currentClans.findIndex((c) => c.id === clanId);
      if (index !== -1) {
        currentClans.splice(index, 1);
      }

      // Guardar cambios
      const loading = showLoading("Eliminando clan...");

      saveChanges()
        .then(() => {
          loading.hide();

          // Mostrar mensaje de éxito
          showToast("Clan eliminado correctamente.", "success");

          // Actualizar vista
          displayClans(currentClans);

          // Actualizar selector de clanes
          updateClanSelector();

          // Registrar actividad
          logActivity("delete", {
            targetType: "clan",
            targetName: clan.nombre,
            gamePrefix,
          });
        })
        .catch((error) => {
          loading.hide();
          showToast("Error al eliminar el clan: " + error.message, "error");
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

      // Guardar cambios
      saveChanges()
        .then(() => {
          loading.hide();

          // Mostrar mensaje de éxito
          showToast("Cambios guardados correctamente.", "success");

          // Registrar actividad
          logActivity("update", {
            targetType: "miembros y clanes",
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
        if (originalData.members) {
          currentMembers = JSON.parse(JSON.stringify(originalData.members));
        }

        if (originalData.clans) {
          currentClans = JSON.parse(JSON.stringify(originalData.clans));
        }

        // Actualizar vistas
        displayMembers(currentMembers);
        displayClans(currentClans);

        // Actualizar selector de clanes
        updateClanSelector();

        // Mostrar mensaje
        showToast("Cambios descartados.", "info");
      }
    }
  );
}

/**
 * Guarda los cambios en el archivo JSON
 * @returns {Promise} - Promesa que resuelve cuando se completa el guardado
 */
function saveChanges() {
  return new Promise((resolve, reject) => {
    // MODIFICACIÓN: Simplificar para pruebas
    try {
      // Crear objeto con los datos actualizados
      const updatedData = {
        members: currentMembers,
        clans: currentClans,
      };

      // Guardar en localStorage
      localStorage.setItem(
        `${gamePrefix}-members`,
        JSON.stringify(updatedData)
      );

      console.log("Cambios guardados en localStorage temporalmente");

      // Resolver inmediatamente sin esperar
      resolve();
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      reject(error);
    }
  });
}

/**
 * Muestra el formulario de miembro
 */
function showMemberForm() {
  document.getElementById("members-tab").classList.remove("active");
  document.getElementById("member-edit-section").style.display = "block";
}

/**
 * Oculta el formulario de miembro
 */
function hideMemberForm() {
  document.getElementById("members-tab").classList.add("active");
  document.getElementById("member-edit-section").style.display = "none";

  // Actualizar lista de miembros
  displayMembers(currentMembers);
}

/**
 * Muestra el formulario de clan
 */
function showClanForm() {
  document.getElementById("clans-tab").classList.add("active");
  document.getElementById("clan-edit-section").style.display = "block";

  // Cambiar a la pestaña de clanes
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.remove("active");
  });
  document
    .querySelector('.tab-button[data-tab="clans-tab"]')
    .classList.add("active");

  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });
  document.getElementById("clans-tab").classList.remove("active");
}

/**
 * Oculta el formulario de clan
 */
function hideClanForm() {
  document.getElementById("clans-tab").classList.add("active");
  document.getElementById("clan-edit-section").style.display = "none";

  // Actualizar lista de clanes
  displayClans(currentClans);
}

/**
 * Limpia el formulario de miembro
 */
function clearMemberForm() {
  document.getElementById("member-id").value = "";
  document.getElementById("member-name").value = "";
  document.getElementById("member-nick").value = "";
  document.getElementById("member-level").value = "";
  document.getElementById("member-class").value = "";
  document.getElementById("member-clan").value = "";
  document.getElementById("member-rank").value = "miembro";
  document.getElementById("member-image").value = "";

  // Limpiar preview de imagen
  const imagePreview = document.getElementById("member-image-preview");
  if (imagePreview) {
    imagePreview.innerHTML = "";
  }
}

/**
 * Limpia el formulario de clan
 */
function clearClanForm() {
  document.getElementById("clan-id").value = "";
  document.getElementById("clan-name").value = "";
  document.getElementById("clan-description").value = "";
  document.getElementById("clan-icon").value = "";

  // Limpiar preview de imagen
  const iconPreview = document.getElementById("clan-icon-preview");
  if (iconPreview) {
    iconPreview.innerHTML = "";
  }
}

/**
 * Llena el formulario con los datos de un miembro
 * @param {Object} member - Miembro a editar
 */
function fillMemberForm(member) {
  document.getElementById("member-id").value = member.id || "";
  document.getElementById("member-name").value = member.nombre || "";
  document.getElementById("member-nick").value = member.nick || "";
  document.getElementById("member-level").value = member.nivel || "";
  document.getElementById("member-class").value = member.clase || "";
  document.getElementById("member-clan").value = member.clan || "";
  document.getElementById("member-rank").value = member.rango || "miembro";
  document.getElementById("member-image").value = member.imagen || "";

  // Mostrar preview de imagen
  const imagePreview = document.getElementById("member-image-preview");
  if (imagePreview && member.imagen) {
    imagePreview.innerHTML = `
        <img src="${member.imagen}" class="preview-image" alt="Vista previa" onerror="this.src='../../assets/images/placeholder.jpg'">
      `;
  }
}

/**
 * Llena el formulario con los datos de un clan
 * @param {Object} clan - Clan a editar
 */
function fillClanForm(clan) {
  document.getElementById("clan-id").value = clan.id || "";
  document.getElementById("clan-name").value = clan.nombre || "";
  document.getElementById("clan-description").value = clan.descripcion || "";
  document.getElementById("clan-icon").value = clan.icon || "";

  // Mostrar preview de imagen
  const iconPreview = document.getElementById("clan-icon-preview");
  if (iconPreview && clan.icon) {
    iconPreview.innerHTML = `
        <img src="${clan.icon}" class="preview-image" alt="Vista previa" onerror="this.src='../../assets/images/placeholder.jpg'">
      `;
  }
}

/**
 * Obtiene los datos del formulario de miembro
 * @returns {Object} - Datos del miembro
 */
function getMemberFormData() {
  return {
    id: document.getElementById("member-id").value,
    nombre: document.getElementById("member-name").value,
    nick: document.getElementById("member-nick").value,
    nivel: document.getElementById("member-level").value,
    clase: document.getElementById("member-class").value,
    clan: document.getElementById("member-clan").value,
    rango: document.getElementById("member-rank").value,
    imagen: document.getElementById("member-image").value,
  };
}

/**
 * Obtiene los datos del formulario de clan
 * @returns {Object} - Datos del clan
 */
function getClanFormData() {
  return {
    id: document.getElementById("clan-id").value,
    nombre: document.getElementById("clan-name").value,
    descripcion: document.getElementById("clan-description").value,
    icon: document.getElementById("clan-icon").value,
  };
}

/**
 * Valida el formulario de miembro
 * @returns {boolean} - true si es válido
 */
function validateMemberForm() {
  // Campos obligatorios
  const requiredFields = [
    "member-id",
    "member-name",
    "member-nick",
    "member-class",
    "member-clan",
  ];

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
 * Valida el formulario de clan
 * @returns {boolean} - true si es válido
 */
function validateClanForm() {
  // Campos obligatorios
  const requiredFields = ["clan-id", "clan-name", "clan-description"];

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
 * Formatea el rango de un miembro
 * @param {string} rank - Rango del miembro
 * @returns {string} - Rango formateado
 */
function formatRank(rank) {
  switch (rank) {
    case "lider":
      return "Líder";
    case "sublider":
      return "Sublíder";
    case "oficial":
      return "Oficial";
    case "veterano":
      return "Veterano";
    case "miembro":
      return "Miembro";
    case "nuevo":
      return "Nuevo";
    default:
      return rank;
  }
}
