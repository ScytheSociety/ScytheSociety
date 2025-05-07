/**
 * Autenticación para el panel de administración
 * admin-auth.js
 */

// Variables globales
let currentUser = null;

// Verificar si hay un usuario autenticado al cargar
document.addEventListener("DOMContentLoaded", function () {
  // Comprobar si estamos en la página de login
  const isLoginPage = window.location.pathname.includes("/admin/login.html");
  console.log(
    "DOM cargado, inicializando autenticación. Página de login:",
    isLoginPage
  );

  // Configurar el formulario de login si estamos en esa página
  if (isLoginPage) {
    setupLoginForm();

    // Comprobar si hay un usuario ya autenticado
    auth.onAuthStateChanged((user) => {
      if (user) {
        console.log("Usuario ya autenticado, verificando permisos");
        checkAdminPermissions(user.uid).then((hasPermission) => {
          if (hasPermission) {
            // Redirigir al dashboard si el usuario ya está autenticado
            console.log(
              "Usuario autenticado con permisos, redirigiendo al dashboard"
            );
            window.location.href = "../admin/dashboard.html";
          } else {
            console.log("Usuario sin permisos de administrador");
            // Permitir que intente iniciar sesión de nuevo
            auth.signOut();
          }
        });
      } else {
        console.log(
          "No hay usuario autenticado, mostrando formulario de login"
        );
      }
    });
  } else {
    // En cualquier otra página del admin, verificar autenticación
    checkAuthentication();
  }

  // Configurar el botón de logout si existe
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }
});

/**
 * Configura el formulario de login
 */
function setupLoginForm() {
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const loadingSpinner = document.getElementById("loading-spinner");

  if (loginForm) {
    // Ocultar error inicialmente
    if (loginError) loginError.style.display = "none";

    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      console.log("Formulario de login enviado");

      // Mostrar spinner de carga
      if (loadingSpinner) loadingSpinner.style.display = "inline-block";

      // Ocultar mensaje de error previo
      if (loginError) loginError.style.display = "none";

      const userId = document.getElementById("user-id").value;
      const password = document.getElementById("password").value;

      // Intentar login con Firebase
      auth
        .signInWithEmailAndPassword(userId, password)
        .then((userCredential) => {
          // Login exitoso
          currentUser = userCredential.user;
          console.log("Login exitoso, obteniendo datos del usuario");

          // Verificar si el usuario tiene permisos de administrador
          return checkAdminPermissions(currentUser.uid);
        })
        .then((hasPermission) => {
          if (hasPermission) {
            console.log("Usuario verificado como administrador");

            // Registrar actividad de login
            logActivity(currentUser.uid, "login");

            // Redirigir al dashboard
            window.location.href = "../admin/dashboard.html";
          } else {
            console.log("Usuario sin permisos de administrador");
            throw new Error(
              "No tienes permisos para acceder al panel de administración."
            );
          }
        })
        .catch((error) => {
          console.error("Error de login:", error);

          // Ocultar spinner
          if (loadingSpinner) loadingSpinner.style.display = "none";

          // Mostrar mensaje de error
          if (loginError) {
            loginError.textContent = getErrorMessage(error);
            loginError.style.display = "block";
          }

          // Cerrar sesión en caso de error
          auth.signOut();
        });
    });
  }
}

/**
 * Verifica si el usuario tiene permisos de administrador
 * @param {string} uid - ID del usuario
 * @returns {Promise<boolean>} - Promesa que resuelve a true si tiene permisos
 */
function checkAdminPermissions(uid) {
  console.log("Verificando permisos de administrador para:", uid);

  return database
    .ref(`/users/${uid}`)
    .once("value")
    .then((snapshot) => {
      const userData = snapshot.val();
      console.log("Datos del usuario:", userData);

      // Verificar si el usuario existe y tiene el rol adecuado
      if (!userData) {
        console.error("No se encontraron datos para el usuario con UID:", uid);
        return false;
      }

      // Verificar rol directamente
      const hasAdminRole = userData.role === "administrador";
      console.log("¿Usuario es administrador?", hasAdminRole);
      return hasAdminRole;
    })
    .catch((error) => {
      console.error("Error al verificar permisos:", error);
      return false;
    });
}

/**
 * Verifica la autenticación del usuario en páginas admin
 */
function checkAuthentication() {
  auth.onAuthStateChanged((user) => {
    if (user) {
      // Usuario autenticado
      currentUser = user;
      console.log("Usuario autenticado:", user.email);

      // Verificar permisos - AÑADE ESTE CONSOLE.LOG PARA DEPURAR
      console.log("Verificando permisos para UID:", user.uid);

      // Comprobación adicional para evitar bucles
      let redirectAttempts = parseInt(
        sessionStorage.getItem("redirectAttempts") || "0"
      );
      if (redirectAttempts > 3) {
        console.error(
          "Demasiados intentos de redirección detectados. Posible bucle."
        );
        sessionStorage.removeItem("redirectAttempts");
        // Mostrar mensaje de error en la página
        const errorDiv = document.createElement("div");
        errorDiv.className = "alert alert-danger";
        errorDiv.innerHTML = `
          <i class="fas fa-exclamation-circle me-2"></i>
          Se ha detectado un bucle de redirección. Por favor, comprueba la consola para más detalles.
          <button class="btn btn-danger ms-3" onclick="firebase.auth().signOut()">Cerrar sesión</button>
        `;
        document.body.prepend(errorDiv);
        return;
      }

      // Incrementar contador de redirecciones
      sessionStorage.setItem(
        "redirectAttempts",
        (redirectAttempts + 1).toString()
      );

      checkAdminPermissions(user.uid)
        .then((hasPermission) => {
          // Resetear contador si la verificación es exitosa
          sessionStorage.removeItem("redirectAttempts");

          if (!hasPermission) {
            console.error("Usuario sin permisos de administrador:", user.email);
            // No tiene permisos, redirigir a login
            showToast("No tienes permisos de administrador.", "error");
            handleLogout();
          } else {
            console.log("Usuario con permisos de administrador:", user.email);
            // Actualizar UI con información del usuario
            updateUserUI(user);
          }
        })
        .catch((error) => {
          console.error("Error al verificar permisos:", error);
          // Por seguridad, ante cualquier error, logout
          handleLogout();
        });
    } else {
      console.log("No hay usuario autenticado, redirigiendo a login");
      // Resetear contador al cerrar sesión
      sessionStorage.removeItem("redirectAttempts");
      // No hay usuario autenticado, redirigir a login
      if (!window.location.pathname.includes("/login.html")) {
        window.location.href = "../admin/login.html";
      }
    }
  });
}

/**
 * Actualiza la UI con información del usuario logueado
 * @param {Object} user - Usuario autenticado
 */
function updateUserUI(user) {
  const userNameElements = document.querySelectorAll(".user-name");
  const userEmailElements = document.querySelectorAll(".user-email");
  const userAvatarElements = document.querySelectorAll(".user-avatar");

  // Obtener datos adicionales del usuario
  database
    .ref(`/users/${user.uid}`)
    .once("value")
    .then((snapshot) => {
      const userData = snapshot.val() || {};

      // Actualizar nombre de usuario
      userNameElements.forEach((element) => {
        element.textContent = userData.displayName || user.email.split("@")[0];
      });

      // Actualizar email
      userEmailElements.forEach((element) => {
        element.textContent = user.email;
      });

      // Actualizar avatar
      userAvatarElements.forEach((element) => {
        if (userData.photoURL) {
          element.src = userData.photoURL;
        } else {
          // Avatar por defecto con iniciales
          const initials = (userData.displayName || user.email.charAt(0))
            .charAt(0)
            .toUpperCase();
          element.classList.add("default-avatar");
          element.textContent = initials;
        }
      });
    })
    .catch((error) => {
      console.error("Error al obtener datos del usuario:", error);
    });
}

/**
 * Maneja el cierre de sesión
 */
function handleLogout() {
  // Registrar actividad de logout si hay un usuario autenticado
  if (auth.currentUser) {
    logActivity(auth.currentUser.uid, "logout");
  }

  auth
    .signOut()
    .then(() => {
      console.log("Sesión cerrada correctamente");
      window.location.href = "../admin/login.html";
    })
    .catch((error) => {
      console.error("Error al cerrar sesión:", error);
    });
}

/**
 * Registra una actividad en el sistema
 * @param {string} userId - ID del usuario
 * @param {string} type - Tipo de actividad (login, logout, create, update, delete)
 * @param {Object} details - Detalles adicionales de la actividad
 */
function logActivity(userId, type, details = {}) {
  const activityData = {
    userId: userId,
    user: auth.currentUser ? auth.currentUser.email : null,
    type: type,
    timestamp: firebase.database.ServerValue.TIMESTAMP,
    ...details,
  };

  // Almacenar en Firebase
  database
    .ref("/activity")
    .push(activityData)
    .catch((error) => {
      console.error("Error al registrar actividad:", error);
    });
}

/**
 * Obtiene un mensaje de error amigable
 * @param {Object} error - Objeto de error
 * @returns {string} - Mensaje de error
 */
function getErrorMessage(error) {
  switch (error.code) {
    case "auth/invalid-email":
      return "El formato del correo electrónico es incorrecto.";
    case "auth/user-disabled":
      return "Esta cuenta ha sido deshabilitada.";
    case "auth/user-not-found":
      return "ID o contraseña incorrectos.";
    case "auth/wrong-password":
      return "ID o contraseña incorrectos.";
    default:
      return error.message || "Ha ocurrido un error al iniciar sesión.";
  }
}
