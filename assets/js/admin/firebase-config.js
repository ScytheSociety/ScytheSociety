// Configuración de Firebase para la autenticación
const firebaseConfig = {
  apiKey: "AIzaSyCCjMaOnleBTXVwNuCZ4ktW54JL0GXbxRE", // Protegida por restricción de dominio
  authDomain: "scythe-society-admin.firebaseapp.com",
  databaseURL: "https://scythe-society-admin-default-rtdb.firebaseio.com",
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

// Configurar persistencia (mantener la sesión incluso al cerrar el navegador)
auth
  .setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .then(() => {
    console.log("Persistencia configurada correctamente");
  })
  .catch((error) => {
    console.error("Error al configurar la persistencia:", error);
  });
