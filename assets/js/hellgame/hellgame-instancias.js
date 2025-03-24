/**
 * hellgame-instancias.js
 * Módulo para gestionar la sección de instancias en las estadísticas de HellGame
 */

// Namespace para HellGame
var HellGame = HellGame || {};

// Módulo de Instancias
HellGame.Instancias = (function () {
  // Datos de instancias
  let instanciasData = {};

  // Datos históricos de instancias
  let historialInstancias = [];
  let historialMiniboss = [];
  let historialMVP = [];

  // Elemento contenedor
  let container = null;

  // Referencias a gráficos
  let victoriasPorMonstruoChart = null;
  let participacionUsersChart = null;

  // Inicialización del módulo
  function init(data) {
    console.log("Inicializando módulo de Instancias...");
    // Guardamos datos iniciales, pero necesitaremos cargar más desde la API
    instanciasData = data;
    container = document.getElementById("instancias-container");

    if (!container) {
      console.error("No se encontró el contenedor de instancias");
      return;
    }

    renderizarSeccionInstancias();
  }

  // Renderizar la sección de instancias
  function renderizarSeccionInstancias() {
    let instanciasHTML = `
      <div class="row">
        <div class="col-12 mb-4">
          <div class="card border-secondary shadow-sm">
            <div class="card-header bg-secondary text-white">
              <h4 class="mb-0"><i class="fas fa-dragon me-2"></i>Resumen de Instancias</h4>
            </div>
            <div class="card-body">
              <div class="row text-center" id="instancias-resumen">
                <div class="col-md-4">
                  <div class="card border-primary mb-3">
                    <div class="card-body">
                      <h3 class="mb-0" id="total-instancias">...</h3>
                      <p class="text-muted">Total Instancias</p>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="card border-success mb-3">
                    <div class="card-body">
                      <h3 class="mb-0" id="total-victorias">...</h3>
                      <p class="text-muted">Instancias Ganadas</p>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div class="card border-danger mb-3">
                    <div class="card-body">
                      <h3 class="mb-0" id="total-mvp">...</h3>
                      <p class="text-muted">MVPs Derrotados</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="text-center py-3" id="instancias-cargando">
                <div class="spinner-border text-secondary" role="status">
                  <span class="visually-hidden">Cargando...</span>
                </div>
                <p>Cargando datos de instancias...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row mb-4">
        <div class="col-md-6">
          <div class="card border-secondary shadow-sm h-100">
            <div class="card-header bg-secondary text-white">
              <h4 class="mb-0"><i class="fas fa-chart-pie me-2"></i>Victorias por Tipo de Monstruo</h4>
            </div>
            <div class="card-body">
              <canvas id="victoriasPorMonstruoChart" height="250"></canvas>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card border-secondary shadow-sm h-100">
            <div class="card-header bg-secondary text-white">
              <h4 class="mb-0"><i class="fas fa-users me-2"></i>Top Participantes</h4>
            </div>
            <div class="card-body">
              <canvas id="participacionUsersChart" height="250"></canvas>
            </div>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-12">
          <ul class="nav nav-tabs" id="instanciasTabs" role="tablist">
            <li class="nav-item" role="presentation">
              <button class="nav-link active" id="normales-tab" data-bs-toggle="tab" data-bs-target="#normales" type="button" role="tab" aria-controls="normales" aria-selected="true">
                <i class="fas fa-ghost me-2"></i>Instancias Normales
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="miniboss-tab" data-bs-toggle="tab" data-bs-target="#miniboss" type="button" role="tab" aria-controls="miniboss" aria-selected="false">
                <i class="fas fa-demon me-2"></i>Miniboss
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button class="nav-link" id="mvp-tab" data-bs-toggle="tab" data-bs-target="#mvp" type="button" role="tab" aria-controls="mvp" aria-selected="false">
                <i class="fas fa-crown me-2"></i>MVP
              </button>
            </li>
          </ul>
          <div class="tab-content" id="instanciasTabContent">
            <div class="tab-pane fade show active" id="normales" role="tabpanel" aria-labelledby="normales-tab">
              <div class="card border-primary shadow-sm">
                <div class="card-header bg-primary text-white">
                  <h4 class="mb-0"><i class="fas fa-ghost me-2"></i>Instancias Normales</h4>
                </div>
                <div class="card-body p-0">
                  <div class="table-responsive">
                    <table class="table table-hover mb-0">
                      <thead class="table-light">
                        <tr>
                          <th>Fecha</th>
                          <th>Monstruo</th>
                          <th>Resultado</th>
                          <th>Participantes</th>
                          <th>Recompensa</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody id="instancias-normales-table">
                        <tr>
                          <td colspan="6" class="text-center">
                            <div class="spinner-border spinner-border-sm text-primary" role="status">
                              <span class="visually-hidden">Cargando...</span>
                            </div>
                            Cargando instancias normales...
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div class="tab-pane fade" id="miniboss" role="tabpanel" aria-labelledby="miniboss-tab">
              <div class="card border-warning shadow-sm">
                <div class="card-header bg-warning text-dark">
                  <h4 class="mb-0"><i class="fas fa-demon me-2"></i>Miniboss</h4>
                </div>
                <div class="card-body p-0">
                  <div class="table-responsive">
                    <table class="table table-hover mb-0">
                      <thead class="table-light">
                        <tr>
                          <th>Fecha</th>
                          <th>Monstruo</th>
                          <th>Resultado</th>
                          <th>Participantes</th>
                          <th>Habilidad Especial</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody id="instancias-miniboss-table">
                        <tr>
                          <td colspan="6" class="text-center">
                            <div class="spinner-border spinner-border-sm text-warning" role="status">
                              <span class="visually-hidden">Cargando...</span>
                            </div>
                            Cargando miniboss...
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div class="tab-pane fade" id="mvp" role="tabpanel" aria-labelledby="mvp-tab">
              <div class="card border-danger shadow-sm">
                <div class="card-header bg-danger text-white">
                  <h4 class="mb-0"><i class="fas fa-crown me-2"></i>MVP</h4>
                </div>
                <div class="card-body p-0">
                  <div class="table-responsive">
                    <table class="table table-hover mb-0">
                      <thead class="table-light">
                        <tr>
                          <th>Fecha</th>
                          <th>Monstruo</th>
                          <th>Resultado</th>
                          <th>Participantes</th>
                          <th>Fases Alcanzadas</th>
                          <th>Recompensa</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody id="instancias-mvp-table">
                        <tr>
                          <td colspan="7" class="text-center">
                            <div class="spinner-border spinner-border-sm text-danger" role="status">
                              <span class="visually-hidden">Cargando...</span>
                            </div>
                            Cargando MVPs...
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Modal de detalles de instancia -->
      <div class="modal fade" id="instanciaDetailsModal" tabindex="-1" aria-labelledby="instanciaDetailsModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-xl">
          <div class="modal-content">
            <div class="modal-header bg-secondary text-white">
              <h5 class="modal-title" id="instanciaDetailsModalLabel">Detalles de la Instancia</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" id="instanciaDetailsContent">
              <div class="text-center py-3">
                <div class="spinner-border text-secondary" role="status">
                  <span class="visually-hidden">Cargando...</span>
                </div>
                <p>Cargando detalles de la instancia...</p>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = instanciasHTML;

    // Cargar datos adicionales
    cargarDatosInstancias();

    // Configurar eventos para las pestañas
    document
      .querySelectorAll('#instanciasTabs button[data-bs-toggle="tab"]')
      .forEach((tab) => {
        tab.addEventListener("shown.bs.tab", (event) => {
          const targetId = event.target.getAttribute("aria-controls");
          if (targetId === "normales" && historialInstancias.length > 0) {
            renderizarTablaInstanciasNormales();
          } else if (targetId === "miniboss" && historialMiniboss.length > 0) {
            renderizarTablaMiniboss();
          } else if (targetId === "mvp" && historialMVP.length > 0) {
            renderizarTablaMVP();
          }
        });
      });
  }
  // Cargar datos completos de instancias
  function cargarDatosInstancias() {
    // En una implementación real, harías una llamada fetch a tu API
    // Aquí simularemos la carga de datos

    // Simulación de carga (1.5 segundos)
    setTimeout(() => {
      // Cargar datos simulados de instancias
      cargarDatosSimulados();

      // Actualizar el resumen
      actualizarResumenInstancias();

      // Inicializar gráficos
      inicializarGraficos();

      // Renderizar tablas
      renderizarTablaInstanciasNormales();

      // Ocultar spinner de carga
      document.getElementById("instancias-cargando").style.display = "none";
    }, 1500);
  }

  // Cargar datos simulados (en una implementación real, esto vendría de la API)
  function cargarDatosSimulados() {
    // Cargar datos de instancias normales
    historialInstancias = [
      {
        id: "20250314010815",
        fecha: "2025-03-14 01:08:15",
        monstruo: {
          nombre: "Wanderer",
          tipo: "normal",
          hp: 30,
          elemento: "wind",
          debilidades: [],
        },
        resultado: {
          victoria: true,
          daño_total: 30.5,
          hp_restante: 0,
        },
        estadisticas: {
          ataques_efectivos: 0,
          ataques_no_efectivos: 15,
          ataques_adicionales: 38,
          total_participantes: 10,
        },
        participantes: {
          "396728024038506526": {
            nombre: "nuthir",
            daño_total: 5.5,
          },
          "390774048650559488": {
            nombre: "munky666",
            daño_total: 6.5,
          },
          "232690174696488974": {
            nombre: "florcitha",
            daño_total: 7.5,
          },
        },
        recompensas: [
          {
            monstruo: "Mutating Khalitzburg",
            tipo: "normal",
          },
        ],
      },
      {
        id: "20250314011543",
        fecha: "2025-03-14 01:15:43",
        monstruo: {
          nombre: "Prison Breaker",
          tipo: "normal",
          hp: 30,
          elemento: "undead",
          debilidades: ["fire", "holy"],
        },
        resultado: {
          victoria: true,
          daño_total: 33.0,
          hp_restante: 0,
        },
        estadisticas: {
          ataques_efectivos: 12,
          ataques_no_efectivos: 8,
          ataques_adicionales: 13,
          total_participantes: 10,
        },
        participantes: {
          "396728024038506526": {
            nombre: "nuthir",
            daño_total: 5,
          },
          "302285499710701571": {
            nombre: "masteralberto",
            daño_total: 5,
          },
        },
        recompensas: [
          {
            monstruo: "Cursed Raydric",
            tipo: "normal",
          },
        ],
      },
      {
        id: "20250314012148",
        fecha: "2025-03-14 01:21:48",
        monstruo: {
          nombre: "Hunter Fly",
          tipo: "normal",
          hp: 30,
          elemento: "wind",
          debilidades: ["earth", "poison"],
        },
        resultado: {
          victoria: true,
          daño_total: 35.0,
          hp_restante: 0,
        },
        estadisticas: {
          ataques_efectivos: 18,
          ataques_no_efectivos: 14,
          ataques_adicionales: 6,
          total_participantes: 10,
        },
        participantes: {
          "396728024038506526": {
            nombre: "nuthir",
            daño_total: 4,
          },
          "129347097563496449": {
            nombre: "ing.ragnord",
            daño_total: 8,
          },
        },
        recompensas: [
          {
            monstruo: "Wraith",
            tipo: "normal",
          },
        ],
      },
    ];

    // Cargar datos de miniboss
    historialMiniboss = [
      {
        id: "20250314002944",
        fecha: "2025-03-14 00:29:44",
        monstruo: {
          nombre: "Dark Illusion",
          tipo: "miniboss",
          hp: 50,
          elemento: "undead",
          debilidades: [],
        },
        resultado: {
          victoria: false,
          daño_total: 37,
          hp_restante: 13,
        },
        estadisticas: {
          ataques_efectivos: 0,
          ataques_no_efectivos: 26,
          ataques_adicionales: 63,
          total_participantes: 8,
        },
        habilidad_especial: {
          habilidad_activada: true,
          reacciones_eliminadas: [],
          daño_recuperado: 10.0,
        },
        participantes: {
          "396728024038506526": {
            nombre: "nuthir",
            daño_total: 8,
          },
          "390774048650559488": {
            nombre: "munky666",
            daño_total: 1,
          },
        },
        recompensas: [],
      },
      {
        id: "20250314232343",
        fecha: "2025-03-14 23:23:43",
        monstruo: {
          nombre: "Dark Illusion",
          tipo: "miniboss",
          hp: 50,
          elemento: "undead",
          debilidades: ["fire", "holy"],
        },
        resultado: {
          victoria: false,
          daño_total: 35,
          hp_restante: 15,
        },
        estadisticas: {
          ataques_efectivos: 8,
          ataques_no_efectivos: 0,
          ataques_adicionales: 19,
          total_participantes: 4,
        },
        habilidad_especial: {
          habilidad_activada: true,
          reacciones_eliminadas: [],
          daño_recuperado: 10.0,
        },
        participantes: {
          "396728024038506526": {
            nombre: "nuthir",
            daño_total: 9,
          },
          "302285499710701571": {
            nombre: "masteralberto",
            daño_total: 9,
          },
        },
        recompensas: [],
      },
    ];
    // Cargar datos de MVP
    historialMVP = [
      {
        id: "20250313235125",
        fecha: "2025-03-13 23:51:25",
        monstruo: {
          nombre: "Corrupted Soul H",
          tipo: "mvp",
          hp: 150,
          elemento: "dark",
          debilidades: ["holy"],
        },
        resultado: {
          victoria: true,
          daño_total: 42.5,
          hp_restante: 0,
        },
        estadisticas: {
          ataques_efectivos: 0,
          ataques_no_efectivos: 3,
          ataques_adicionales: 44,
          total_participantes: 7,
        },
        participantes: {
          "1148790624653414431": {
            nombre: "cruzificado_57805",
            daño_total: 9,
            rol: "dps",
          },
          "396728024038506526": {
            nombre: "nuthir",
            daño_total: 2,
            rol: "tanque",
          },
        },
        recompensas: [
          {
            monstruo: "Curse-swallowed King",
            tipo: "mvp",
            para_usuario_especifico: null,
          },
          {
            monstruo: "Corrupted Wanderer",
            tipo: "normal",
            para_usuario_especifico: 1148790624653414431,
          },
        ],
        datos_mvp: {
          fases_alcanzadas: 3,
          roles_asignados: {
            "396728024038506526": "tanque",
            "1148790624653414431": "dps",
            "1210207576298622976": "sanador",
          },
          ultimo_golpe: 1148790624653414431,
        },
      },
      {
        id: "20250313220040",
        fecha: "2025-03-13 22:00:40",
        monstruo: {
          nombre: "Corrupted Dark Lord",
          tipo: "mvp",
          hp: 150,
          elemento: "earth",
          debilidades: ["fire"],
        },
        resultado: {
          victoria: false,
          daño_total: 13.0,
          hp_restante: 137.0,
        },
        estadisticas: {
          ataques_efectivos: 8,
          ataques_no_efectivos: 14,
          ataques_adicionales: 4,
          total_participantes: 9,
        },
        participantes: {
          "396728024038506526": {
            nombre: "nuthir",
            daño_total: 0.5,
            rol: "normal",
          },
          "302285499710701571": {
            nombre: "masteralberto",
            daño_total: 2,
            rol: "normal",
          },
        },
        recompensas: [],
        datos_mvp: {
          fases_alcanzadas: 2,
          roles_asignados: {},
          ultimo_golpe: null,
        },
      },
    ];
  }

  // Actualizar el resumen de instancias
  function actualizarResumenInstancias() {
    // Calcular totales
    const totalInstancias =
      historialInstancias.length +
      historialMiniboss.length +
      historialMVP.length;

    const victoriasNormales = historialInstancias.filter(
      (inst) => inst.resultado.victoria
    ).length;
    const victoriasMiniboss = historialMiniboss.filter(
      (inst) => inst.resultado.victoria
    ).length;
    const victoriasMVP = historialMVP.filter(
      (inst) => inst.resultado.victoria
    ).length;

    const totalVictorias = victoriasNormales + victoriasMiniboss + victoriasMVP;

    // Actualizar los contadores
    document.getElementById("total-instancias").textContent = totalInstancias;
    document.getElementById("total-victorias").textContent = totalVictorias;
    document.getElementById("total-mvp").textContent = victoriasMVP;
  }

  // Inicializar los gráficos
  function inicializarGraficos() {
    inicializarGraficoVictoriasPorMonstruo();
    inicializarGraficoParticipacionUsers();
  }

  // Inicializar gráfico de victorias por tipo de monstruo
  function inicializarGraficoVictoriasPorMonstruo() {
    const ctx = document.getElementById("victoriasPorMonstruoChart");
    if (!ctx) return;

    // Contar victorias por tipo
    const victoriasNormales = historialInstancias.filter(
      (inst) => inst.resultado.victoria
    ).length;
    const victoriasMiniboss = historialMiniboss.filter(
      (inst) => inst.resultado.victoria
    ).length;
    const victoriasMVP = historialMVP.filter(
      (inst) => inst.resultado.victoria
    ).length;

    // Contar derrotas por tipo
    const derrotasNormales = historialInstancias.filter(
      (inst) => !inst.resultado.victoria
    ).length;
    const derrotasMiniboss = historialMiniboss.filter(
      (inst) => !inst.resultado.victoria
    ).length;
    const derrotasMVP = historialMVP.filter(
      (inst) => !inst.resultado.victoria
    ).length;

    // Si ya existe un gráfico, destruirlo
    if (victoriasPorMonstruoChart) {
      victoriasPorMonstruoChart.destroy();
    }

    // Crear nuevo gráfico
    victoriasPorMonstruoChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["Normal", "Miniboss", "MVP"],
        datasets: [
          {
            label: "Victorias",
            data: [victoriasNormales, victoriasMiniboss, victoriasMVP],
            backgroundColor: "rgba(40, 167, 69, 0.8)",
            borderColor: "rgb(40, 167, 69)",
            borderWidth: 1,
          },
          {
            label: "Derrotas",
            data: [derrotasNormales, derrotasMiniboss, derrotasMVP],
            backgroundColor: "rgba(220, 53, 69, 0.8)",
            borderColor: "rgb(220, 53, 69)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
          },
          tooltip: {
            mode: "index",
            intersect: false,
          },
        },
        scales: {
          x: {
            stacked: false,
          },
          y: {
            stacked: false,
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
      },
    });
  }
  // Inicializar gráfico de participación de usuarios
  function inicializarGraficoParticipacionUsers() {
    const ctx = document.getElementById("participacionUsersChart");
    if (!ctx) return;

    // Recopilar datos de participación
    const participaciones = {};

    // Procesar instancias normales
    historialInstancias.forEach((inst) => {
      Object.keys(inst.participantes).forEach((userId) => {
        const userName = inst.participantes[userId].nombre;
        if (!participaciones[userName]) {
          participaciones[userName] = {
            normal: 0,
            miniboss: 0,
            mvp: 0,
          };
        }
        participaciones[userName].normal++;
      });
    });

    // Procesar miniboss
    historialMiniboss.forEach((inst) => {
      Object.keys(inst.participantes).forEach((userId) => {
        const userName = inst.participantes[userId].nombre;
        if (!participaciones[userName]) {
          participaciones[userName] = {
            normal: 0,
            miniboss: 0,
            mvp: 0,
          };
        }
        participaciones[userName].miniboss++;
      });
    });

    // Procesar MVP
    historialMVP.forEach((inst) => {
      Object.keys(inst.participantes).forEach((userId) => {
        const userName = inst.participantes[userId].nombre;
        if (!participaciones[userName]) {
          participaciones[userName] = {
            normal: 0,
            miniboss: 0,
            mvp: 0,
          };
        }
        participaciones[userName].mvp++;
      });
    });

    // Encontrar los 5 usuarios con más participaciones totales
    const topUsuarios = Object.entries(participaciones)
      .map(([nombre, datos]) => ({
        nombre,
        total: datos.normal + datos.miniboss + datos.mvp,
        ...datos,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // Preparar datos para el gráfico
    const labels = topUsuarios.map((u) => u.nombre);
    const dataNormal = topUsuarios.map((u) => u.normal);
    const dataMiniboss = topUsuarios.map((u) => u.miniboss);
    const dataMVP = topUsuarios.map((u) => u.mvp);

    // Si ya existe un gráfico, destruirlo
    if (participacionUsersChart) {
      participacionUsersChart.destroy();
    }

    // Crear nuevo gráfico
    participacionUsersChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Normal",
            data: dataNormal,
            backgroundColor: "rgba(13, 110, 253, 0.8)",
            borderColor: "rgb(13, 110, 253)",
            borderWidth: 1,
          },
          {
            label: "Miniboss",
            data: dataMiniboss,
            backgroundColor: "rgba(255, 193, 7, 0.8)",
            borderColor: "rgb(255, 193, 7)",
            borderWidth: 1,
          },
          {
            label: "MVP",
            data: dataMVP,
            backgroundColor: "rgba(220, 53, 69, 0.8)",
            borderColor: "rgb(220, 53, 69)",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: "Participación por tipo de instancia",
          },
          tooltip: {
            mode: "index",
            intersect: false,
          },
        },
        scales: {
          x: {
            stacked: true,
          },
          y: {
            stacked: true,
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
      },
    });
  }

  // Renderizar tabla de instancias normales
  function renderizarTablaInstanciasNormales() {
    const tbody = document.getElementById("instancias-normales-table");
    if (!tbody) return;

    let htmlContent = "";

    if (historialInstancias.length === 0) {
      htmlContent = `
        <tr>
          <td colspan="6" class="text-center">
            No hay datos de instancias normales disponibles
          </td>
        </tr>
      `;
    } else {
      htmlContent = historialInstancias
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .map((instancia) => {
          const fecha = new Date(instancia.fecha);
          const fechaFormateada =
            fecha.toLocaleDateString() + " " + fecha.toLocaleTimeString();

          // Contar participantes únicos
          const numParticipantes = Object.keys(instancia.participantes).length;

          // Formatear resultado
          const resultadoClase = instancia.resultado.victoria
            ? "success"
            : "danger";
          const resultadoTexto = instancia.resultado.victoria
            ? "Victoria"
            : "Derrota";

          // Formatear recompensa
          let recompensaHTML = "Ninguna";
          if (instancia.recompensas && instancia.recompensas.length > 0) {
            recompensaHTML = instancia.recompensas
              .map((rec) => {
                const esMVP = rec.tipo === "mvp";
                const badgeClase = esMVP ? "danger" : "primary";
                return `<span class="badge bg-${badgeClase}">${rec.monstruo}</span>`;
              })
              .join(" ");
          }

          return `
            <tr>
              <td>${fechaFormateada}</td>
              <td>
                <div class="d-flex align-items-center">
                  <span class="badge bg-primary me-2">${instancia.monstruo.elemento}</span>
                  ${instancia.monstruo.nombre}
                </div>
              </td>
              <td><span class="badge bg-${resultadoClase}">${resultadoTexto}</span></td>
              <td>${numParticipantes} usuarios</td>
              <td>${recompensaHTML}</td>
              <td>
                <button class="btn btn-sm btn-outline-primary" onclick="HellGame.Instancias.mostrarDetallesInstancia('${instancia.id}', 'normal')">
                  <i class="fas fa-info-circle me-1"></i> Detalles
                </button>
              </td>
            </tr>
          `;
        })
        .join("");
    }

    tbody.innerHTML = htmlContent;
  }
  // Renderizar tabla de miniboss
  function renderizarTablaMiniboss() {
    const tbody = document.getElementById("instancias-miniboss-table");
    if (!tbody) return;

    let htmlContent = "";

    if (historialMiniboss.length === 0) {
      htmlContent = `
        <tr>
          <td colspan="6" class="text-center">
            No hay datos de miniboss disponibles
          </td>
        </tr>
      `;
    } else {
      htmlContent = historialMiniboss
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .map((instancia) => {
          const fecha = new Date(instancia.fecha);
          const fechaFormateada =
            fecha.toLocaleDateString() + " " + fecha.toLocaleTimeString();

          // Contar participantes únicos
          const numParticipantes = Object.keys(instancia.participantes).length;

          // Formatear resultado
          const resultadoClase = instancia.resultado.victoria
            ? "success"
            : "danger";
          const resultadoTexto = instancia.resultado.victoria
            ? "Victoria"
            : "Derrota";

          // Formatear habilidad especial
          const habilidadClase = instancia.habilidad_especial
            ?.habilidad_activada
            ? "danger"
            : "success";
          const habilidadTexto = instancia.habilidad_especial
            ?.habilidad_activada
            ? `Activada (+${instancia.habilidad_especial.daño_recuperado} HP)`
            : "No activada";

          return `
            <tr>
              <td>${fechaFormateada}</td>
              <td>
                <div class="d-flex align-items-center">
                  <span class="badge bg-warning me-2">${instancia.monstruo.elemento}</span>
                  ${instancia.monstruo.nombre}
                </div>
              </td>
              <td><span class="badge bg-${resultadoClase}">${resultadoTexto}</span></td>
              <td>${numParticipantes} usuarios</td>
              <td><span class="badge bg-${habilidadClase}">${habilidadTexto}</span></td>
              <td>
                <button class="btn btn-sm btn-outline-warning" onclick="HellGame.Instancias.mostrarDetallesInstancia('${instancia.id}', 'miniboss')">
                  <i class="fas fa-info-circle me-1"></i> Detalles
                </button>
              </td>
            </tr>
          `;
        })
        .join("");
    }

    tbody.innerHTML = htmlContent;
  }

  // Renderizar tabla de MVP
  function renderizarTablaMVP() {
    const tbody = document.getElementById("instancias-mvp-table");
    if (!tbody) return;

    let htmlContent = "";

    if (historialMVP.length === 0) {
      htmlContent = `
        <tr>
          <td colspan="7" class="text-center">
            No hay datos de MVP disponibles
          </td>
        </tr>
      `;
    } else {
      htmlContent = historialMVP
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
        .map((instancia) => {
          const fecha = new Date(instancia.fecha);
          const fechaFormateada =
            fecha.toLocaleDateString() + " " + fecha.toLocaleTimeString();

          // Contar participantes únicos
          const numParticipantes = Object.keys(instancia.participantes).length;

          // Formatear resultado
          const resultadoClase = instancia.resultado.victoria
            ? "success"
            : "danger";
          const resultadoTexto = instancia.resultado.victoria
            ? "Victoria"
            : "Derrota";

          // Formatear fases alcanzadas
          const fases = instancia.datos_mvp?.fases_alcanzadas || 0;

          // Formatear recompensa
          let recompensaHTML = "Ninguna";
          if (instancia.recompensas && instancia.recompensas.length > 0) {
            recompensaHTML = instancia.recompensas
              .map((rec) => {
                const esMVP = rec.tipo === "mvp";
                const badgeClase = esMVP ? "danger" : "primary";
                let texto = rec.monstruo;

                if (rec.para_usuario_especifico) {
                  const userName = obtenerNombreUsuario(
                    rec.para_usuario_especifico
                  );
                  texto += ` (${userName})`;
                }

                return `<span class="badge bg-${badgeClase}">${texto}</span>`;
              })
              .join(" ");
          }

          return `
            <tr>
              <td>${fechaFormateada}</td>
              <td>
                <div class="d-flex align-items-center">
                  <span class="badge bg-danger me-2">${instancia.monstruo.elemento}</span>
                  ${instancia.monstruo.nombre}
                </div>
              </td>
              <td><span class="badge bg-${resultadoClase}">${resultadoTexto}</span></td>
              <td>${numParticipantes} usuarios</td>
              <td>${fases}/3</td>
              <td>${recompensaHTML}</td>
              <td>
                <button class="btn btn-sm btn-outline-danger" onclick="HellGame.Instancias.mostrarDetallesInstancia('${instancia.id}', 'mvp')">
                  <i class="fas fa-info-circle me-1"></i> Detalles
                </button>
              </td>
            </tr>
          `;
        })
        .join("");
    }

    tbody.innerHTML = htmlContent;
  }

  // Mostrar detalles de una instancia específica
  function mostrarDetallesInstancia(id, tipo) {
    console.log(`Mostrando detalles de instancia ${id} (${tipo})`);

    // Buscar la instancia en el historial correspondiente
    let instancia;
    if (tipo === "normal") {
      instancia = historialInstancias.find((inst) => inst.id === id);
    } else if (tipo === "miniboss") {
      instancia = historialMiniboss.find((inst) => inst.id === id);
    } else if (tipo === "mvp") {
      instancia = historialMVP.find((inst) => inst.id === id);
    }

    if (!instancia) {
      console.error(`No se encontró la instancia ${id} de tipo ${tipo}`);
      return;
    }

    // Mostrar modal
    const modal = new bootstrap.Modal(
      document.getElementById("instanciaDetailsModal")
    );
    modal.show();

    // Preparar contenido del modal
    renderizarDetallesInstancia(instancia, tipo);
  }
  // Renderizar detalles de una instancia en el modal
  function renderizarDetallesInstancia(instancia, tipo) {
    const contenedor = document.getElementById("instanciaDetailsContent");
    if (!contenedor) return;

    // Formatear fecha
    const fecha = new Date(instancia.fecha);
    const fechaFormateada =
      fecha.toLocaleDateString() + " " + fecha.toLocaleTimeString();

    // Formatear resultado
    const resultadoClase = instancia.resultado.victoria ? "success" : "danger";
    const resultadoTexto = instancia.resultado.victoria
      ? "Victoria"
      : "Derrota";

    // Formatear monstruo
    const monstruoTipoClase =
      tipo === "normal"
        ? "primary"
        : tipo === "miniboss"
        ? "warning"
        : "danger";

    // Formatear debilidades
    const debilidades =
      instancia.monstruo.debilidades?.length > 0
        ? instancia.monstruo.debilidades
            .map((d) => `<span class="badge bg-info me-1">${d}</span>`)
            .join(" ")
        : '<span class="badge bg-secondary">Ninguna</span>';

    // Formatear recompensas
    let recompensasHTML = '<span class="text-muted">Ninguna</span>';
    if (instancia.recompensas?.length > 0) {
      recompensasHTML = instancia.recompensas
        .map((rec) => {
          const esMVP = rec.tipo === "mvp";
          const badgeClase = esMVP ? "danger" : "primary";
          let texto = rec.monstruo;

          if (rec.para_usuario_especifico) {
            const userName = obtenerNombreUsuario(rec.para_usuario_especifico);
            texto += ` (${userName})`;
          }

          return `<span class="badge bg-${badgeClase} me-1">${texto}</span>`;
        })
        .join(" ");
    }

    // Formatear participantes ordenados por daño
    const participantesArray = Object.entries(instancia.participantes)
      .map(([id, datos]) => ({
        id,
        ...datos,
      }))
      .sort((a, b) => b.daño_total - a.daño_total);

    let participantesHTML = "";
    participantesArray.forEach((p, index) => {
      const posicionClass = index === 0 ? "border-success" : "";
      const rolHTML = p.rol
        ? `<span class="badge bg-info ms-1">${p.rol}</span>`
        : "";

      participantesHTML += `
        <div class="col-md-6 col-lg-4 mb-3">
          <div class="card ${posicionClass}">
            <div class="card-header d-flex justify-content-between align-items-center">
              <span>${p.nombre}</span>
              ${rolHTML}
            </div>
            <div class="card-body">
              <h5 class="card-title text-center">${p.daño_total} daño</h5>
              <p class="card-text text-center">
                ${
                  index === 0
                    ? '<span class="badge bg-warning">Mejor participante</span>'
                    : ""
                }
              </p>
            </div>
          </div>
        </div>
      `;
    });

    // Contenido específico basado en el tipo
    let contenidoEspecificoHTML = "";

    if (tipo === "miniboss") {
      // Información específica de miniboss (habilidad especial)
      const habilidadActivada =
        instancia.habilidad_especial?.habilidad_activada || false;
      const dañoRecuperado = instancia.habilidad_especial?.daño_recuperado || 0;

      contenidoEspecificoHTML = `
        <div class="card mb-4 ${
          habilidadActivada ? "border-danger" : "border-success"
        }">
          <div class="card-header ${
            habilidadActivada ? "bg-danger text-white" : "bg-success text-white"
          }">
            <h5 class="mb-0">Habilidad Especial</h5>
          </div>
          <div class="card-body">
            <p class="mb-0">
              <strong>Estado:</strong> ${
                habilidadActivada ? "Activada" : "No activada"
              }
            </p>
            ${
              habilidadActivada
                ? `<p class="mb-0"><strong>Daño recuperado:</strong> ${dañoRecuperado}</p>`
                : ""
            }
          </div>
        </div>
      `;
    } else if (tipo === "mvp") {
      // Información específica de MVP (fases, roles, último golpe)
      const fases = instancia.datos_mvp?.fases_alcanzadas || 0;
      const ultimoGolpe = instancia.datos_mvp?.ultimo_golpe || null;

      contenidoEspecificoHTML = `
        <div class="card mb-4 border-danger">
          <div class="card-header bg-danger text-white">
            <h5 class="mb-0">Datos MVP</h5>
          </div>
          <div class="card-body">
            <p class="mb-0"><strong>Fases alcanzadas:</strong> ${fases}/3</p>
            ${
              ultimoGolpe
                ? `<p class="mb-0"><strong>Último golpe:</strong> ${obtenerNombreUsuario(
                    ultimoGolpe
                  )}</p>`
                : ""
            }
          </div>
        </div>
      `;
    }

    // Estadísticas generales
    const estadisticasHTML = `
      <div class="row mb-3">
        <div class="col-md-3">
          <div class="card text-center">
            <div class="card-body">
              <h5 class="mb-0">${instancia.estadisticas.ataques_efectivos}</h5>
              <p class="text-muted mb-0">Ataques efectivos</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card text-center">
            <div class="card-body">
              <h5 class="mb-0">${instancia.estadisticas.ataques_no_efectivos}</h5>
              <p class="text-muted mb-0">Ataques no efectivos</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card text-center">
            <div class="card-body">
              <h5 class="mb-0">${instancia.estadisticas.ataques_adicionales}</h5>
              <p class="text-muted mb-0">Ataques adicionales</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card text-center">
            <div class="card-body">
              <h5 class="mb-0">${instancia.estadisticas.total_participantes}</h5>
              <p class="text-muted mb-0">Total participantes</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Generar contenido completo
    const contenidoHTML = `
      <div class="instancia-details">
        <div class="row mb-4">
          <div class="col-md-6">
            <div class="card border-secondary">
              <div class="card-header bg-secondary text-white">
                <h5 class="mb-0">Información general</h5>
              </div>
              <div class="card-body">
                <p class="mb-1"><strong>ID:</strong> ${instancia.id}</p>
                <p class="mb-1"><strong>Fecha:</strong> ${fechaFormateada}</p>
                <p class="mb-1">
                  <strong>Resultado:</strong> 
                  <span class="badge bg-${resultadoClase}">${resultadoTexto}</span>
                </p>
                <p class="mb-1"><strong>Daño total:</strong> ${
                  instancia.resultado.daño_total
                }</p>
                <p class="mb-0"><strong>HP restante:</strong> ${
                  instancia.resultado.hp_restante
                }</p>
              </div>
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="card border-${monstruoTipoClase}">
              <div class="card-header bg-${monstruoTipoClase} ${
      tipo !== "miniboss" ? "text-white" : "text-dark"
    }">
                <h5 class="mb-0">Monstruo</h5>
              </div>
              <div class="card-body">
                <h4 class="mb-2">${instancia.monstruo.nombre}</h4>
                <p class="mb-1">
                  <strong>Tipo:</strong> 
                  <span class="badge bg-${monstruoTipoClase} ${
      tipo !== "miniboss" ? "text-white" : "text-dark"
    }">${tipo}</span>
                </p>
                <p class="mb-1">
                  <strong>Elemento:</strong> 
                  <span class="badge bg-info">${
                    instancia.monstruo.elemento
                  }</span>
                </p>
                <p class="mb-1"><strong>HP:</strong> ${
                  instancia.monstruo.hp
                }</p>
                <p class="mb-0">
                  <strong>Debilidades:</strong> 
                  ${debilidades}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        ${contenidoEspecificoHTML}
        
        <div class="card mb-4 border-primary">
          <div class="card-header bg-primary text-white">
            <h5 class="mb-0">Estadísticas</h5>
          </div>
          <div class="card-body">
            ${estadisticasHTML}
          </div>
        </div>
        
        <div class="card mb-4 border-success">
          <div class="card-header bg-success text-white">
            <h5 class="mb-0">Recompensas</h5>
          </div>
          <div class="card-body">
            ${recompensasHTML}
          </div>
        </div>
        
        <div class="card border-info">
          <div class="card-header bg-info text-white">
            <h5 class="mb-0">Participantes</h5>
          </div>
          <div class="card-body">
            <div class="row">
              ${participantesHTML}
            </div>
          </div>
        </div>
      </div>
    `;

    contenedor.innerHTML = contenidoHTML;
  }

  // Obtener nombre de usuario por ID
  function obtenerNombreUsuario(userId) {
    // En una implementación real, buscarías en una base de datos o API
    // Aquí usamos un mapeo simple basado en los datos que hemos visto
    const nombresUsuarios = {
      "302285499710701571": "masteralberto",
      "232690174696488974": "florcitha",
      "318586835876184064": "be299",
      "396728024038506526": "nuthir",
      "650531689214246912": "hellart87",
      "390774048650559488": "munky666",
      "189529253145083904": "malu.rar",
      "129347097563496449": "ing.ragnord",
      "1148790624653414431": "cruzificado_57805",
      "1210207576298622976": "xredragonx",
    };

    return nombresUsuarios[userId] || `Usuario ${userId.substring(0, 8)}...`;
  }

  // Retorno público del módulo
  return {
    init: init,
    cargarDatosInstancias: cargarDatosInstancias,
    mostrarDetallesInstancia: mostrarDetallesInstancia,
  };
})();
