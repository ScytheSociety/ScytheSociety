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

  // Configurar el formulario de login si estamos en esa página
  if (isLoginPage) {
    setupLoginForm();
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
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Mostrar spinner de carga
      if (loadingSpinner) loadingSpinner.style.display = "inline-block";

      // Ocultar mensaje de error previo
      if (loginError) loginError.style.display = "none";

      const userId = document.getElementById("user-id").value;
      const password = document.getElementById("password").value;

      // Intentar login con Firebase
      firebase
        .auth()
        .signInWithEmailAndPassword(userId, password)
        .then((userCredential) => {
          // Login exitoso
          currentUser = userCredential.user;

          // Guardar estado de login en localStorage (NO guardar la contraseña)
          localStorage.setItem(
            "user",
            JSON.stringify({
              uid: currentUser.uid,
              email: currentUser.email,
              lastLogin: new Date().toISOString(),
            })
          );

          // Verificar si el usuario tiene permisos de administrador
          return checkAdminPermissions(currentUser.uid);
        })
        .then((hasPermission) => {
          if (hasPermission) {
            // Redirigir al dashboard
            window.location.href = "../admin/dashboard.html";
          } else {
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
  return new Promise((resolve, reject) => {
    // Consultar la base de datos para verificar permisos
    firebase
      .database()
      .ref(`/users/${uid}`)
      .once("value")
      .then((snapshot) => {
        const userData = snapshot.val();
        if (userData && userData.role) {
          // Verificar si el rol tiene permisos de administrador
          return firebase
            .database()
            .ref(`/roles/${userData.role}`)
            .once("value");
        } else {
          resolve(false);
        }
      })
      .then((snapshot) => {
        if (snapshot) {
          const roleData = snapshot.val();
          resolve(roleData && (roleData.isAdmin || roleData.canAccessAdmin));
        } else {
          resolve(false);
        }
      })
      .catch((error) => {
        console.error("Error al verificar permisos:", error);
        reject(error);
      });
  });
}

/**
 * Verifica la autenticación del usuario en páginas admin
 */
function checkAuthentication() {
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      // Usuario autenticado
      currentUser = user;

      // Verificar permisos
      checkAdminPermissions(user.uid)
        .then((hasPermission) => {
          if (!hasPermission) {
            // No tiene permisos, redirigir a login
            handleLogout();
          } else {
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
      // No hay usuario autenticado, redirigir a login
      window.location.href = "../admin/login.html";
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
  firebase
    .database()
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
  firebase
    .auth()
    .signOut()
    .then(() => {
      // Borrar datos de sesión
      localStorage.removeItem("user");

      // Redirigir a login
      window.location.href = "../admin/login.html";
    })
    .catch((error) => {
      console.error("Error al cerrar sesión:", error);
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

/**
 * Verifica si el usuario actual tiene un permiso específico
 * @param {string} permission - Nombre del permiso a verificar
 * @returns {Promise<boolean>} - Promesa que resuelve a true si tiene el permiso
 */
function hasPermission(permission) {
  return new Promise((resolve, reject) => {
    if (!currentUser) {
      resolve(false);
      return;
    }

    firebase
      .database()
      .ref(`/users/${currentUser.uid}`)
      .once("value")
      .then((snapshot) => {
        const userData = snapshot.val();
        if (userData && userData.role) {
          return firebase
            .database()
            .ref(`/roles/${userData.role}`)
            .once("value");
        } else {
          resolve(false);
        }
      })
      .then((snapshot) => {
        if (snapshot) {
          const roleData = snapshot.val();
          // Verificar si el rol tiene el permiso específico o es administrador
          resolve(
            roleData &&
              (roleData.isAdmin ||
                (roleData.permissions && roleData.permissions[permission]))
          );
        } else {
          resolve(false);
        }
      })
      .catch((error) => {
        console.error("Error al verificar permiso:", error);
        reject(error);
      });
  });
}
