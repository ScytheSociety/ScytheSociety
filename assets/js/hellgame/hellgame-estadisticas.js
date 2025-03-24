/**
 * hellgame-estadisticas.js
 * Script principal para cargar y mostrar las estadísticas de HellGame
 */

// Cargar los módulos necesarios cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", function () {
  // Inicializar el sistema de estadísticas
  initHellGameStats();
});

// Función principal para inicializar el sistema de estadísticas
function initHellGameStats() {
  console.log("Inicializando sistema de estadísticas de HellGame...");

  // Cargar las estadísticas desde la API
  loadHellGameEstadisticas();
}

// Función para cargar los datos de estadísticas desde la API
function loadHellGameEstadisticas() {
  const estadisticasContainer = document.getElementById(
    "hellgame-estadisticas-container"
  );

  if (!estadisticasContainer) {
    console.error("No se encontró el contenedor para estadísticas de HellGame");
    return;
  }

  // URL de tu API de estadísticas
  const estadisticasURL =
    "https://hellgameapi.duckdns.org:5002/api/estadisticas";

  // Añadir timestamp para evitar caché
  const timestamp = new Date().getTime();
  const urlWithTimestamp = `${estadisticasURL}?t=${timestamp}`;

  // Mostrar spinner mientras carga
  estadisticasContainer.innerHTML = `
    <div class="text-center py-4">
      <div class="spinner-border text-danger" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
      <p class="mt-2">Cargando estadísticas...</p>
    </div>
  `;

  // Configurar un timeout para la solicitud
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

  // Cargar los datos de estadísticas
  fetch(urlWithTimestamp, {
    method: "GET",
    mode: "cors",
    credentials: "omit",
    signal: controller.signal,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: window.location.origin,
    },
  })
    .then((response) => {
      clearTimeout(timeoutId);

      if (!response.ok) {
        return response.text().then((text) => {
          throw new Error(
            `HTTP error! status: ${response.status}, message: ${text}`
          );
        });
      }
      return response.json();
    })
    .then((data) => {
      console.log("Datos recibidos de la API:", data);

      // Renderizar la interfaz
      renderizarInterfazEstadisticas(data, estadisticasContainer);

      // Cargar datos adicionales para las otras pestañas
      cargarDatosAdicionales();
    })
    .catch((error) => {
      clearTimeout(timeoutId);
      handleNetworkError(error, estadisticasContainer);
    });
}

// Función para manejar errores de red
function handleNetworkError(error, container) {
  console.error("Error de red completo:", error);

  // Mensaje de error más descriptivo
  let errorMessage = "No se pudieron cargar las estadísticas. ";

  if (error instanceof TypeError) {
    errorMessage += "Problema de conexión o CORS. ";
  } else if (error.name === "AbortError") {
    errorMessage += "La solicitud fue cancelada por timeout. ";
  }

  container.innerHTML = `
    <div class="alert alert-danger" role="alert">
      <i class="fas fa-exclamation-triangle me-2"></i>
      ${errorMessage}
      <details>
        <summary>Detalles técnicos</summary>
        <pre>${error.toString()}</pre>
        <p>Código de error: ${error.name}</p>
      </details>
    </div>
  `;
}

// Función principal para renderizar la interfaz de estadísticas
function renderizarInterfazEstadisticas(data, container) {
  // Crear estructura de pestañas
  const contenidoHTML = `
    <div class="statistics-container">
      <ul class="nav nav-tabs" id="myTab" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link active" id="cartas-tab" data-bs-toggle="tab" data-bs-target="#cartas" type="button" role="tab" aria-controls="cartas" aria-selected="true">
            <i class="fas fa-trophy me-2"></i>Cartas
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="pvp-tab" data-bs-toggle="tab" data-bs-target="#pvp" type="button" role="tab" aria-controls="pvp" aria-selected="false">
            <i class="fas fa-fist-raised me-2"></i>PVP
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="fusion-tab" data-bs-toggle="tab" data-bs-target="#fusion" type="button" role="tab" aria-controls="fusion" aria-selected="false">
            <i class="fas fa-fire me-2"></i>Fusiones
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="revenge-tab" data-bs-toggle="tab" data-bs-target="#revenge" type="button" role="tab" aria-controls="revenge" aria-selected="false">
            <i class="fas fa-skull-crossbones me-2"></i>Revenge
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="trades-tab" data-bs-toggle="tab" data-bs-target="#trades" type="button" role="tab" aria-controls="trades" aria-selected="false">
            <i class="fas fa-exchange-alt me-2"></i>Trades
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="instancias-tab" data-bs-toggle="tab" data-bs-target="#instancias" type="button" role="tab" aria-controls="instancias" aria-selected="false">
            <i class="fas fa-dragon me-2"></i>Instancias
          </button>
        </li>
      </ul>
      
      <div class="tab-content py-4" id="myTabContent">
        <div class="tab-pane fade show active" id="cartas" role="tabpanel" aria-labelledby="cartas-tab">
          <div id="cartas-container" class="loading-container">
            <div class="text-center py-3">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
              <p>Cargando datos de cartas...</p>
            </div>
          </div>
        </div>
        <div class="tab-pane fade" id="pvp" role="tabpanel" aria-labelledby="pvp-tab">
          <div id="pvp-container" class="loading-container">
            <div class="text-center py-3">
              <div class="spinner-border text-success" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
              <p>Cargando datos de PVP...</p>
            </div>
          </div>
        </div>
        <div class="tab-pane fade" id="fusion" role="tabpanel" aria-labelledby="fusion-tab">
          <div id="fusion-container" class="loading-container">
            <div class="text-center py-3">
              <div class="spinner-border text-warning" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
              <p>Cargando datos de fusiones...</p>
            </div>
          </div>
        </div>
        <div class="tab-pane fade" id="revenge" role="tabpanel" aria-labelledby="revenge-tab">
          <div id="revenge-container" class="loading-container">
            <div class="text-center py-3">
              <div class="spinner-border text-danger" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
              <p>Cargando datos de venganzas...</p>
            </div>
          </div>
        </div>
        <div class="tab-pane fade" id="trades" role="tabpanel" aria-labelledby="trades-tab">
          <div id="trades-container" class="loading-container">
            <div class="text-center py-3">
              <div class="spinner-border text-info" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
              <p>Cargando datos de intercambios...</p>
            </div>
          </div>
        </div>
        <div class="tab-pane fade" id="instancias" role="tabpanel" aria-labelledby="instancias-tab">
          <div id="instancias-container" class="loading-container">
            <div class="text-center py-3">
              <div class="spinner-border text-secondary" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
              <p>Cargando datos de instancias...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = contenidoHTML;

  // Inicializar la primera pestaña (Cartas)
  HellGame.Cartas.init(data);

  // Configurar eventos para cargar datos cuando se seleccione una pestaña
  const tabElList = document.querySelectorAll('button[data-bs-toggle="tab"]');
  tabElList.forEach((tabEl) => {
    tabEl.addEventListener("shown.bs.tab", (event) => {
      const targetId = event.target.getAttribute("aria-controls");
      cargarDatosPestaña(targetId, data);
    });
  });
}

// Función para cargar datos específicos cuando se selecciona una pestaña
function cargarDatosPestaña(tabId, data) {
  switch (tabId) {
    case "cartas":
      HellGame.Cartas.init(data);
      break;
    case "pvp":
      HellGame.PVP.init(data);
      break;
    case "fusion":
      HellGame.Fusion.init(data);
      break;
    case "revenge":
      HellGame.Revenge.init(data);
      break;
    case "trades":
      HellGame.Trades.init(data);
      break;
    case "instancias":
      HellGame.Instancias.init(data);
      break;
  }
}

// Función para cargar datos adicionales de otras APIs o archivos
function cargarDatosAdicionales() {
  // Cargar datos de instancias (si es necesario)
  HellGame.Instancias.cargarDatosInstancias();

  // Cargar datos de fusiones históricas
  HellGame.Fusion.cargarHistorialFusiones();

  // Cargar datos de revenge históricas
  HellGame.Revenge.cargarHistorialRevenge();
}
