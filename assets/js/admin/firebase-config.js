// Configuración de Firebase para la autenticación
const firebaseConfig = {
  apiKey: "AIzaSyCCjMaOnleBTXVwNuCZ4ktW54JL0GXbxRE",
  authDomain: "scythe-society-admin.firebaseapp.com",
  databaseURL: "https://tu-proyecto.firebaseio.com",
  projectId: "scythe-society-admin",
  storageBucket: "scythe-society-admin.firebasestorage.app",
  messagingSenderId: "153277490974",
  appId: "1:153277490974:web:e1a44957b86dcf0b8c4b0f",
  measurementId: "G-DZ96P1S32D",
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Verificar estado de autenticación
function checkAuth() {
  return new Promise((resolve, reject) => {
    auth.onAuthStateChanged((user) => {
      if (user) {
        // Usuario autenticado
        resolve(user);
      } else {
        // Usuario no autenticado, redirigir a login
        window.location.href = "../admin/login.html";
        reject("No autenticado");
      }
    });
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
