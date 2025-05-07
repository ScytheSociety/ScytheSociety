// Configuración de Firebase para la autenticación
const firebaseConfig = {
  apiKey: "AIzaSyCCjMaOnleBTXVwNuCZ4ktW54JL0GXbxRE",
  authDomain: "scythe-society-admin.firebaseapp.com",
  databaseURL: "https://scythe-society-admin-default-rtdb.firebaseio.com",
  projectId: "scythe-society-admin",
  storageBucket: "scythe-society-admin.firebasestorage.app", // Mantener el valor de la consola
  messagingSenderId: "153277490974",
  appId: "1:153277490974:web:e1a44957b86dcf0b8c4b0f",
  measurementId: "G-DZ96P1S32D",
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Configurar persistencia (mantener la sesión incluso al cerrar el navegador)
auth
  .setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .then(() => {
    console.log("Persistencia configurada correctamente");
  })
  .catch((error) => {
    console.error("Error al configurar la persistencia:", error);
  });

// Verificar estado de autenticación y rol de administrador
function checkAuth() {
  return new Promise((resolve, reject) => {
    auth.onAuthStateChanged((user) => {
      if (user) {
        console.log("Usuario autenticado:", user.uid);

        // Verificar si el usuario es administrador
        database
          .ref("/users/" + user.uid)
          .once("value")
          .then((snapshot) => {
            const userData = snapshot.val();
            console.log("Datos del usuario:", userData);

            if (userData && userData.role === "administrador") {
              console.log("Usuario verificado como administrador");
              resolve(user);
            } else {
              console.log(
                "El usuario no es administrador o no tiene un rol asignado"
              );
              // Cerrar sesión y redirigir al login
              auth.signOut().then(() => {
                window.location.href = "../admin/login.html";
                reject("No tiene permisos de administrador");
              });
            }
          })
          .catch((error) => {
            console.error("Error al verificar rol:", error);
            reject(error);
          });
      } else {
        console.log("No hay usuario autenticado");
        window.location.href = "../admin/login.html";
        reject("No autenticado");
      }
    });
  });
}

// Función para verificar si un usuario es administrador
function isAdmin(uid) {
  return database
    .ref("/users/" + uid)
    .once("value")
    .then((snapshot) => {
      const userData = snapshot.val();
      return userData && userData.role === "administrador";
    });
}

// Cerrar sesión
function logout() {
  auth
    .signOut()
    .then(() => {
      console.log("Sesión cerrada");
      window.location.href = "../admin/login.html";
    })
    .catch((error) => {
      console.error("Error al cerrar sesión:", error);
    });
}

// Función para iniciar sesión
function login(email, password) {
  return auth
    .signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Verificar si el usuario es administrador
      return isAdmin(userCredential.user.uid).then((isAdmin) => {
        if (isAdmin) {
          console.log("Login exitoso como administrador");
          return userCredential.user;
        } else {
          console.log("El usuario no es administrador");
          return auth.signOut().then(() => {
            throw new Error("No tienes permisos de administrador");
          });
        }
      });
    });
}

// Registrar actividad del usuario
function logActivity(userId, type, details = {}) {
  const activityData = {
    userId: userId,
    type: type,
    timestamp: firebase.database.ServerValue.TIMESTAMP, // Usar timestamp del servidor
    ...details,
  };

  return database.ref("activity").push(activityData);
}
