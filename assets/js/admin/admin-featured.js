/**
 * Funcionalidad para el editor de contenido destacado
 * admin-featured.js
 */

// Variables globales
let featuredItems = [];
let originalData = null;
let selectedItem = null;
let isEditing = false;

document.addEventListener("DOMContentLoaded", function () {
  // Inicializar editor de destacados
  initFeaturedEditor();

  // Cargar contenido destacado
  loadFeaturedContent();

  // Configurar eventos para el formulario de edición
  setupFeaturedForm();

  // Configurar botones de acción
  setupActionButtons();

  // Configurar ordenamiento
  setupSorting();
});

/**
 * Inicializa el editor de contenido destacado
 */
// En admin-featured.js, aproximadamente línea 15
function initFeaturedEditor() {
  console.log("Inicializando editor de contenido destacado...");

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
  console.log("Continuando inicialización del editor de contenido destacado");
}

/**
 * Carga el contenido destacado desde el archivo JSON
 */
function loadFeaturedContent() {
  const featuredList = document.getElementById("featured-items");
  if (!featuredList) return;

  // Mostrar cargando
  featuredList.innerHTML = `
    <div class="text-center py-4">
      <div class="spinner-border text-danger" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="mt-2">Cargando contenido destacado...</p>
    </div>
  `;

  // Cargar archivo JSON
  fetch("../../data/featured.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      // Guardar datos originales
      originalData = JSON.parse(JSON.stringify(data));

      // Procesar items
      if (Array.isArray(data)) {
        featuredItems = data;

        // Añadir índice para ordenamiento si no existe
        featuredItems.forEach((item, index) => {
          if (!item.order) {
            item.order = index + 1;
          }
        });

        // Ordenar por orden
        featuredItems.sort((a, b) => {
          return (a.order || 99) - (b.order || 99);
        });
      } else {
        console.error("Formato de contenido destacado incorrecto:", data);
        featuredItems = [];
      }

      // Mostrar items
      displayFeaturedItems(featuredItems);
    })
    .catch((error) => {
      console.error("Error cargando contenido destacado:", error);
      featuredList.innerHTML = `
        <div class="alert alert-danger" role="alert">
          <i class="fas fa-exclamation-circle me-2"></i>
          Error al cargar el contenido destacado. Por favor, intenta de nuevo más tarde.
        </div>
      `;
    });
}

/**
 * Muestra los items destacados en la lista
 * @param {Array} items - Array de items destacados
 */
function displayFeaturedItems(items) {
  const featuredList = document.getElementById("featured-items");
  if (!featuredList) return;

  // Vaciar lista
  featuredList.innerHTML = "";

  if (items.length === 0) {
    featuredList.innerHTML = `
      <div class="text-center py-4">
        <i class="fas fa-info-circle fa-2x mb-3" style="color: #777;"></i>
        <p>No hay contenido destacado para mostrar.</p>
      </div>
    `;
    return;
  }

  // Crear lista de items
  const list = document.createElement("div");
  list.className = "item-list";
  list.id = "sortable-featured";

  items.forEach((item, index) => {
    const itemElement = document.createElement("div");
    itemElement.className = "item-card";
    itemElement.dataset.id = index;

    // Imagen de portada
    let thumbnailUrl = item.imagen || "assets/images/placeholder.jpg";

    itemElement.innerHTML = `
      <div class="drag-handle me-2">
        <i class="fas fa-grip-vertical"></i>
      </div>
      <div class="item-thumbnail">
        <img src="${thumbnailUrl}" alt="${
      item.titulo
    }" onerror="this.src='../../assets/images/placeholder.jpg'">
      </div>
      <div class="item-details">
        <h4 class="item-title">${item.titulo}</h4>
        <p class="item-description">${item.descripcion || "Sin descripción"}</p>
        <div class="item-meta">
          <span class="badge badge-secondary me-2">Orden: ${
            item.order || index + 1
          }</span>
          <span class="text-muted">${item.link}</span>
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
    itemElement
      .querySelector(".btn-edit")
      .addEventListener("click", function (e) {
        e.stopPropagation();
        editFeaturedItem(index);
      });

    // Evento para eliminar
    itemElement
      .querySelector(".btn-delete")
      .addEventListener("click", function (e) {
        e.stopPropagation();
        deleteFeaturedItem(index);
      });

    list.appendChild(itemElement);
  });

  featuredList.appendChild(list);

  // Inicializar ordenamiento con SortableJS
  if (typeof Sortable !== "undefined") {
    new Sortable(list, {
      animation: 150,
      handle: ".drag-handle",
      ghostClass: "sortable-ghost",
      chosenClass: "sortable-chosen",
      dragClass: "sortable-drag",
      onEnd: function (evt) {
        updateItemsOrder();
      },
    });
  }
}

/**
 * Actualiza el orden de los items después de ordenar
 */
function updateItemsOrder() {
  const itemElements = document.querySelectorAll(
    "#sortable-featured .item-card"
  );

  itemElements.forEach((item, index) => {
    const itemIndex = parseInt(item.dataset.id);
    if (!isNaN(itemIndex) && featuredItems[itemIndex]) {
      featuredItems[itemIndex].order = index + 1;

      // Actualizar número de orden visible
      const orderBadge = item.querySelector(".badge");
      if (orderBadge) {
        orderBadge.textContent = `Orden: ${index + 1}`;
      }
    }
  });
}

/**
 * Configura el formulario de edición de items destacados
 */
function setupFeaturedForm() {
  const featuredForm = document.getElementById("featured-form");
  if (!featuredForm) return;

  // Evento de envío del formulario
  featuredForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Validar formulario
    if (!validateFeaturedForm()) {
      showToast("Por favor, completa todos los campos obligatorios.", "error");
      return;
    }

    // Mostrar cargando
    const loading = showLoading("Guardando item destacado...");

    // Obtener datos del formulario
    const itemData = getFeaturedFormData();

    // Si estamos editando, actualizar item existente
    if (isEditing && selectedItem !== null) {
      featuredItems[selectedItem] = {
        ...featuredItems[selectedItem],
        ...itemData,
      };
    } else {
      // Añadir nuevo item
      featuredItems.push(itemData);
    }

    // Guardar cambios
    saveFeaturedItems()
      .then(() => {
        loading.hide();

        // Mostrar mensaje de éxito
        showToast(
          isEditing
            ? "Item actualizado correctamente."
            : "Item creado correctamente.",
          "success"
        );

        // Volver a la lista
        showListView();

        // Registrar actividad
        logActivity(isEditing ? "update" : "create", {
          targetType: "contenido destacado",
          targetName: itemData.titulo,
        });
      })
      .catch((error) => {
        loading.hide();
        showToast("Error al guardar el item: " + error.message, "error");
      });
  });

  // Botón para cancelar edición
  const cancelButton = document.getElementById("cancel-button");
  if (cancelButton) {
    cancelButton.addEventListener("click", function () {
      showListView();
    });
  }

  // Inicializar subida de imágenes
  setupImageUpload();
}

/**
 * Obtiene los datos del formulario de item destacado
 * @returns {Object} - Datos del item
 */
function getFeaturedFormData() {
  // Obtener valores de los campos
  const title = document.getElementById("featured-title").value;
  const description = document.getElementById("featured-description").value;
  const link = document.getElementById("featured-link").value;
  const image = document.getElementById("featured-image").value;
  const order =
    parseInt(document.getElementById("featured-order").value) ||
    featuredItems.length + 1;

  // Construir objeto de item
  return {
    titulo: title,
    descripcion: description,
    link: link,
    imagen: image,
    order: order,
  };
}

/**
 * Valida el formulario de item destacado
 * @returns {boolean} - true si es válido
 */
function validateFeaturedForm() {
  // Campos obligatorios
  const requiredFields = ["featured-title", "featured-link", "featured-image"];

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
 * Configura la subida de imágenes
 */
function setupImageUpload() {
  const imageUpload = document.getElementById("featured-image-upload");
  const imagePreview = document.getElementById("featured-image-preview");

  if (!imageUpload || !imagePreview) return;

  // Evento para cambio de archivo
  const imageFileInput = document.createElement("input");
  imageFileInput.type = "file";
  imageFileInput.accept = "image/*";
  imageFileInput.style.display = "none";
  imageFileInput.id = "image-file";
  imageUpload.appendChild(imageFileInput);

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
      showToast("Por favor, selecciona un archivo de imagen válido.", "error");
      return;
    }

    // Mostrar vista previa
    const reader = new FileReader();
    reader.onload = function (e) {
      imagePreview.innerHTML = `<img src="${e.target.result}" class="preview-image" alt="Vista previa">`;

      // En un entorno real, aquí se subiría la imagen a un servidor
      // Para este ejemplo, simularemos la subida
      const loading = showLoading("Subiendo imagen...");

      setTimeout(() => {
        loading.hide();

        // Simular URL de imagen subida
        const imageUrl = `assets/images/index/uploaded_${Date.now()}.jpg`;
        document.getElementById("featured-image").value = imageUrl;

        showToast("Imagen subida correctamente.", "success");
      }, 1500);
    };
    reader.readAsDataURL(file);
  }
}

/**
 * Configura los botones de acción
 */
function setupActionButtons() {
  // Botón para nuevo item
  const newItemBtn = document.getElementById("new-item-btn");
  if (newItemBtn) {
    newItemBtn.addEventListener("click", function () {
      createNewItem();
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
 * Configura el ordenamiento de items
 */
function setupSorting() {
  // Botón para ordenar ascendente
  const sortUpBtn = document.getElementById("sort-up-btn");
  if (sortUpBtn) {
    sortUpBtn.addEventListener("click", function () {
      sortItems("asc");
    });
  }

  // Botón para ordenar descendente
  const sortDownBtn = document.getElementById("sort-down-btn");
  if (sortDownBtn) {
    sortDownBtn.addEventListener("click", function () {
      sortItems("desc");
    });
  }
}

/**
 * Ordena los items
 * @param {string} direction - Dirección de ordenamiento ('asc' o 'desc')
 */
function sortItems(direction = "asc") {
  // Ordenar por orden
  featuredItems.sort((a, b) => {
    const orderA = a.order || 99;
    const orderB = b.order || 99;

    return direction === "asc" ? orderA - orderB : orderB - orderA;
  });

  // Actualizar órdenes
  featuredItems.forEach((item, index) => {
    item.order = index + 1;
  });

  // Actualizar vista
  displayFeaturedItems(featuredItems);

  // Mostrar mensaje
  showToast(
    `Items ordenados ${
      direction === "asc" ? "ascendentemente" : "descendentemente"
    }.`,
    "success"
  );
}

/**
 * Inicia la creación de un nuevo item
 */
function createNewItem() {
  // Limpiar formulario
  clearFeaturedForm();

  // Mostrar vista de edición
  showEditView();

  // Establecer modo creación
  isEditing = false;
  selectedItem = null;

  // Establecer orden por defecto
  document.getElementById("featured-order").value = featuredItems.length + 1;

  // Cambiar título
  document.getElementById("form-title").textContent =
    "Crear Nuevo Item Destacado";
}

/**
 * Inicia la edición de un item existente
 * @param {number} itemIndex - Índice del item
 */
function editFeaturedItem(itemIndex) {
  // Buscar item
  const item = featuredItems[itemIndex];
  if (!item) {
    showToast("Item no encontrado.", "error");
    return;
  }

  // Establecer modo edición
  isEditing = true;
  selectedItem = itemIndex;

  // Llenar formulario
  fillFeaturedForm(item);

  // Mostrar vista de edición
  showEditView();

  // Cambiar título
  document.getElementById("form-title").textContent = "Editar Item Destacado";
}

/**
 * Elimina un item destacado
 * @param {number} itemIndex - Índice del item
 */
function deleteFeaturedItem(itemIndex) {
  // Buscar item
  const item = featuredItems[itemIndex];
  if (!item) {
    showToast("Item no encontrado.", "error");
    return;
  }

  // Mostrar confirmación
  showConfirm(
    `¿Estás seguro de que deseas eliminar el item "${item.titulo}"? Esta acción no se puede deshacer.`,
    function () {
      // Eliminar item
      featuredItems.splice(itemIndex, 1);

      // Actualizar órdenes
      featuredItems.forEach((item, index) => {
        item.order = index + 1;
      });

      // Guardar cambios
      const loading = showLoading("Eliminando item...");

      saveFeaturedItems()
        .then(() => {
          loading.hide();

          // Mostrar mensaje de éxito
          showToast("Item eliminado correctamente.", "success");

          // Actualizar vista
          displayFeaturedItems(featuredItems);

          // Registrar actividad
          logActivity("delete", {
            targetType: "contenido destacado",
            targetName: item.titulo,
          });
        })
        .catch((error) => {
          loading.hide();
          showToast("Error al eliminar el item: " + error.message, "error");
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

      // Guardar items
      saveFeaturedItems()
        .then(() => {
          loading.hide();

          // Mostrar mensaje de éxito
          showToast("Cambios guardados correctamente.", "success");

          // Registrar actividad
          logActivity("update", {
            targetType: "contenido destacado",
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
        featuredItems = JSON.parse(JSON.stringify(originalData));

        // Actualizar vista
        displayFeaturedItems(featuredItems);

        // Mostrar mensaje
        showToast("Cambios descartados.", "info");
      }
    }
  );
}

/**
 * Guarda los items destacados en el archivo JSON
 * @returns {Promise} - Promesa que resuelve cuando se completa el guardado
 */
function saveFeaturedItems() {
  return new Promise((resolve, reject) => {
    // Por ahora, simularemos un guardado exitoso con setTimeout
    // En un entorno real, usaríamos la API de GitHub o Firebase
    setTimeout(() => {
      try {
        // Podríamos usar localStorage para guardar temporalmente
        // Podríamos usar localStorage para guardar temporalmente
        localStorage.setItem("featured-items", JSON.stringify(featuredItems));

        // En implementación real:
        // return saveJSON('/data/featured.json', featuredItems, 'Actualización de contenido destacado');

        resolve();
      } catch (error) {
        reject(error);
      }
    }, 1000);
  });
}

/**
 * Limpia el formulario de item destacado
 */
function clearFeaturedForm() {
  // Limpiar campos
  document.getElementById("featured-title").value = "";
  document.getElementById("featured-description").value = "";
  document.getElementById("featured-link").value = "";
  document.getElementById("featured-image").value = "";
  document.getElementById("featured-order").value = "";

  // Limpiar preview de imagen
  const imagePreview = document.getElementById("featured-image-preview");
  if (imagePreview) {
    imagePreview.innerHTML = "";
  }
}

/**
 * Llena el formulario con los datos de un item
 * @param {Object} item - Item a editar
 */
function fillFeaturedForm(item) {
  // Llenar campos
  document.getElementById("featured-title").value = item.titulo || "";
  document.getElementById("featured-description").value =
    item.descripcion || "";
  document.getElementById("featured-link").value = item.link || "";
  document.getElementById("featured-image").value = item.imagen || "";
  document.getElementById("featured-order").value = item.order || "";

  // Mostrar preview de imagen
  const imagePreview = document.getElementById("featured-image-preview");
  if (imagePreview && item.imagen) {
    imagePreview.innerHTML = `
      <img src="${item.imagen}" class="preview-image" alt="Vista previa" onerror="this.src='../../assets/images/placeholder.jpg'">
    `;
  }
}

/**
 * Muestra la vista de lista
 */
function showListView() {
  // Mostrar/ocultar secciones
  document.getElementById("featured-list-section").style.display = "block";
  document.getElementById("featured-edit-section").style.display = "none";
}

/**
 * Muestra la vista de edición
 */
function showEditView() {
  // Mostrar/ocultar secciones
  document.getElementById("featured-list-section").style.display = "none";
  document.getElementById("featured-edit-section").style.display = "block";
}
