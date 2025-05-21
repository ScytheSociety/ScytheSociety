/**
 * Sistema de Autenticación Unificado
 * auth-system.js - Reemplaza admin-auth.js y login-manager.js
 */

// Variables globales
let currentUser = null;
let isAuthReady = false;
let authCallbacks = {
  onLogin: [],
  onLogout: [],
  onAuthReady: [],
};

// Ejecutar cuando el DOM esté cargado
document.addEventListener("DOMContentLoaded", initAuth);

/**
 * Inicializa el sistema de autenticación
 */
function initAuth() {
  console.log("Inicializando sistema de autenticación...");

  // Si Firebase no está disponible, esperar
  if (typeof firebase === "undefined") {
    console.error(
      "Firebase no está disponible. Asegúrate de incluir Firebase antes de este script."
    );
    return;
  }

  // Determinar si estamos en la página de login
  const isLoginPage = window.location.pathname.includes("/login.html");
  console.log("¿Página de login?", isLoginPage);

  // Configurar Firebase Auth
  firebase.auth().onAuthStateChanged(handleAuthStateChanged);

  // Configurar formulario de login si estamos en esa página
  if (isLoginPage) {
    setupLoginForm();
  }

  // Configurar botones de logout en todas las páginas
  setupLogoutButtons();
}

/**
 * Maneja cambios en el estado de autenticación
 */
function handleAuthStateChanged(user) {
  console.log(
    "Estado de autenticación cambiado:",
    user ? "Usuario autenticado" : "No hay usuario"
  );

  // Guardar usuario actual
  currentUser = user;

  // Determinar si estamos en la página de login
  const isLoginPage = window.location.pathname.includes("/login.html");

  if (user) {
    // Usuario autenticado
    console.log("Usuario autenticado:", user.email);

    // Verificar si es administrador
    checkAdminPermissions(user.uid)
      .then((isAdmin) => {
        if (isAdmin) {
          console.log("Usuario es administrador");

          // Actualizar UI con información del usuario
          updateUserUI(user);

          // Si estamos en la página de login, redirigir al dashboard
          if (isLoginPage) {
            console.log("Redirigiendo al dashboard...");
            window.location.href = "../admin/dashboard.html";
          }

          // Ejecutar callbacks de login
          authCallbacks.onLogin.forEach((callback) => callback(user));
        } else {
          console.error("Usuario no es administrador:", user.email);

          // Cerrar sesión
          firebase
            .auth()
            .signOut()
            .then(() => {
              if (isLoginPage) {
                showLoginError("No tienes permisos de administrador.");
              } else {
                window.location.href = "../admin/login.html";
              }
            });
        }
      })
      .catch((error) => {
        console.error("Error al verificar permisos:", error);
        firebase.auth().signOut();
      });
  } else {
    // No hay usuario autenticado
    console.log("No hay usuario autenticado");

    // Si no estamos en la página de login, redirigir allí
    if (!isLoginPage) {
      console.log("Redirigiendo a login...");
      window.location.href = "../admin/login.html";
    }

    // Ejecutar callbacks de logout
    authCallbacks.onLogout.forEach((callback) => callback());
  }

  // Marcar que la autenticación está lista
  if (!isAuthReady) {
    isAuthReady = true;
    authCallbacks.onAuthReady.forEach((callback) => callback(user));
  }
}

/**
 * Configura el formulario de login
 */
function setupLoginForm() {
  const loginForm = document.getElementById("login-form");
  if (!loginForm) return;

  // Ocultar error inicialmente
  const loginError = document.getElementById("login-error");
  if (loginError) loginError.style.display = "none";

  // Evento de envío del formulario
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Mostrar spinner
    const loadingSpinner = document.getElementById("loading-spinner");
    if (loadingSpinner) loadingSpinner.style.display = "inline-block";

    // Ocultar mensaje de error
    if (loginError) loginError.style.display = "none";

    // Obtener credenciales
    const userId = document.getElementById("user-id").value;
    const password = document.getElementById("password").value;

    console.log("Intentando login con:", userId);

    // Intentar login
    firebase
      .auth()
      .signInWithEmailAndPassword(userId, password)
      .catch((error) => {
        console.error("Error de login:", error);

        // Ocultar spinner
        if (loadingSpinner) loadingSpinner.style.display = "none";

        // Mostrar error
        showLoginError(getErrorMessage(error));
      });
  });
}

/**
 * Muestra un error en el formulario de login
 */
function showLoginError(message) {
  const loginError = document.getElementById("login-error");
  if (loginError) {
    loginError.textContent = message;
    loginError.style.display = "block";
  }
}

/**
 * Configura los botones de logout
 */
function setupLogoutButtons() {
  const logoutButtons = document.querySelectorAll(
    "#logout-btn, #logout-sidebar-btn"
  );

  logoutButtons.forEach((button) => {
    if (button) {
      button.addEventListener("click", function (e) {
        e.preventDefault();
        handleLogout();
      });
    }
  });
}

/**
 * Verifica si el usuario tiene permisos de administrador
 */
function checkAdminPermissions(uid) {
  return firebase
    .database()
    .ref(`/users/${uid}`)
    .once("value")
    .then((snapshot) => {
      const userData = snapshot.val();

      if (!userData) {
        console.error("No se encontraron datos de usuario para:", uid);
        return false;
      }

      // Verificar si es administrador
      return userData.role === "administrador";
    });
}

/**
 * Actualiza la UI con información del usuario
 */
function updateUserUI(user) {
  if (!user) return;

  // Actualizar nombre de usuario en elementos con clase .user-name
  document.querySelectorAll(".user-name").forEach((el) => {
    el.textContent = user.displayName || user.email.split("@")[0];
  });

  // Actualizar avatar
  document.querySelectorAll(".user-avatar").forEach((el) => {
    if (user.photoURL) {
      if (el.tagName === "IMG") {
        el.src = user.photoURL;
      } else {
        el.style.backgroundImage = `url(${user.photoURL})`;
      }
    } else {
      // Avatar con iniciales
      const initials = (user.displayName || user.email.charAt(0))
        .charAt(0)
        .toUpperCase();
      el.textContent = initials;
    }
  });
}

/**
 * Maneja el cierre de sesión
 */
function handleLogout() {
  // Registrar actividad
  logActivity("logout");

  // Cerrar sesión
  firebase
    .auth()
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
 */
function logActivity(type, details = {}) {
  // Solo registrar si hay usuario autenticado
  if (!firebase.auth().currentUser) return Promise.resolve();

  const activityData = {
    type: type,
    userId: firebase.auth().currentUser.uid,
    user: firebase.auth().currentUser.email,
    timestamp: firebase.database.ServerValue.TIMESTAMP,
    ...details,
  };

  return firebase.database().ref("/activity").push(activityData);
}

/**
 * Obtiene mensaje de error amigable
 */
function getErrorMessage(error) {
  switch (error.code) {
    case "auth/invalid-email":
      return "El formato del correo electrónico es incorrecto.";
    case "auth/user-disabled":
      return "Esta cuenta ha sido deshabilitada.";
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Usuario o contraseña incorrectos.";
    default:
      return error.message || "Ha ocurrido un error al iniciar sesión.";
  }
}

/**
 * Añade un callback para cuando el usuario inicie sesión
 */
function onLogin(callback) {
  if (typeof callback !== "function") return;
  authCallbacks.onLogin.push(callback);

  // Si ya hay un usuario logueado, ejecutar ahora
  if (isAuthReady && currentUser) {
    callback(currentUser);
  }
}

/**
 * Añade un callback para cuando el usuario cierre sesión
 */
function onLogout(callback) {
  if (typeof callback !== "function") return;
  authCallbacks.onLogout.push(callback);

  // Si no hay usuario logueado y la auth está lista, ejecutar ahora
  if (isAuthReady && !currentUser) {
    callback();
  }
}

/**
 * Añade un callback para cuando la autenticación esté lista
 */
function onAuthReady(callback) {
  if (typeof callback !== "function") return;

  if (isAuthReady) {
    // Si ya está listo, ejecutar inmediatamente
    callback(currentUser);
  } else {
    // Si no, añadir a la cola
    authCallbacks.onAuthReady.push(callback);
  }
}

// Exportar funciones para uso externo
window.authSystem = {
  onLogin,
  onLogout,
  onAuthReady,
  getCurrentUser: () => currentUser,
  isAdmin: () =>
    currentUser
      ? checkAdminPermissions(currentUser.uid)
      : Promise.resolve(false),
  logout: handleLogout,
  logActivity,
};
