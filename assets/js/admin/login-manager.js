/**
 * login-manager.js - Gestor exclusivo para el proceso de login
 * Este archivo maneja solo la autenticación y evita conflictos con los demás archivos
 */

// Esperar a que el DOM esté completamente cargado
document.addEventListener("DOMContentLoaded", function () {
  console.log("Login Manager: DOM cargado");

  // Solo ejecutar si estamos en la página de login
  if (!window.location.pathname.includes("/login.html")) {
    console.log(
      "Login Manager: No estamos en la página de login, no haciendo nada"
    );
    return;
  }

  // Desactivar cualquier listener previo de auth
  const auth = firebase.auth();

  // Variables para evitar redirecciones múltiples
  let loginInProgress = false;
  let redirecting = false;

  // Elementos del formulario
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const loadingSpinner = document.getElementById("loading-spinner");

  // Ocultar error inicialmente
  if (loginError) {
    loginError.style.display = "none";
  }

  // Verificar si ya hay una sesión y usuario es administrador
  let initialCheck = true;
  auth.onAuthStateChanged(function (user) {
    // Solo ejecutar la verificación inicial una vez
    if (!initialCheck) return;
    initialCheck = false;

    if (user) {
      console.log(
        "Login Manager: Usuario ya autenticado, verificando permisos"
      );

      // Verificar si es administrador
      firebase
        .database()
        .ref("/users/" + user.uid)
        .once("value")
        .then(function (snapshot) {
          const userData = snapshot.val();

          if (userData && userData.role === "administrador") {
            console.log(
              "Login Manager: Usuario es administrador, redirigiendo al dashboard"
            );
            safeRedirect("../admin/dashboard.html");
          } else {
            console.log(
              "Login Manager: Usuario no es administrador, cerrando sesión"
            );
            auth.signOut();
          }
        })
        .catch(function (error) {
          console.error("Login Manager: Error al verificar permisos:", error);
          auth.signOut();
        });
    } else {
      console.log(
        "Login Manager: No hay usuario autenticado, mostrando formulario"
      );
    }
  });

  // Configurar formulario de login
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Evitar múltiples intentos
      if (loginInProgress) {
        console.log("Login Manager: Login ya en progreso, ignorando");
        return;
      }

      loginInProgress = true;

      // Mostrar spinner
      if (loadingSpinner) {
        loadingSpinner.style.display = "inline-block";
      }

      // Ocultar error
      if (loginError) {
        loginError.style.display = "none";
      }

      // Obtener credenciales
      const userId = document.getElementById("user-id").value;
      const password = document.getElementById("password").value;

      console.log("Login Manager: Intentando login con:", userId);

      // Intentar login
      auth
        .signInWithEmailAndPassword(userId, password)
        .then(function (userCredential) {
          const user = userCredential.user;
          console.log("Login Manager: Login exitoso, verificando permisos");

          // Verificar permisos
          return firebase
            .database()
            .ref("/users/" + user.uid)
            .once("value");
        })
        .then(function (snapshot) {
          const userData = snapshot.val();

          if (userData && userData.role === "administrador") {
            console.log(
              "Login Manager: Usuario es administrador, redirigiendo"
            );

            // Registrar actividad
            const activityData = {
              type: "login", // CAMBIADO - ahora es solo "login" (string)
              userId: auth.currentUser.uid,
              user: auth.currentUser.email,
              timestamp: firebase.database.ServerValue.TIMESTAMP,
            };

            firebase
              .database()
              .ref("/activity")
              .push(activityData)
              .then(() => {
                console.log("Actividad de login registrada correctamente");
                // Redirigir
                safeRedirect("../admin/dashboard.html");
              })
              .catch((error) => {
                console.error("Error al registrar actividad:", error);
                // Redirigir de todos modos
                safeRedirect("../admin/dashboard.html");
              });
          } else {
            console.log("Login Manager: Usuario no es administrador");
            throw new Error("No tienes permisos de administrador");
          }
        })
        .catch(function (error) {
          console.error("Login Manager: Error en proceso de login:", error);

          // Ocultar spinner
          if (loadingSpinner) {
            loadingSpinner.style.display = "none";
          }

          // Mostrar error
          if (loginError) {
            loginError.textContent = getLoginErrorMessage(error);
            loginError.style.display = "block";
          }

          // Reset estado
          loginInProgress = false;

          // Cerrar sesión en caso de error
          auth.signOut();
        });
    });
  }

  // Función para prevenir redirecciones múltiples
  function safeRedirect(url) {
    if (!redirecting) {
      redirecting = true;
      console.log("Login Manager: Redirigiendo a", url);
      window.location.href = url;
    }
  }

  // Función para mensajes de error amigables
  function getLoginErrorMessage(error) {
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
});
