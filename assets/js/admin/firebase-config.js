// Configuración de Firebase para la autenticación
// Las claves API están en firebase-secrets.js (no subido a Github)
const firebaseConfig = firebaseSecrets || {
  // Configuración de desarrollo/demo (NO USAR EN PRODUCCIÓN)
  apiKey: "demo-api-key",
  authDomain: "demo-auth-domain.firebaseapp.com",
  databaseURL: "https://demo-db-url.firebaseio.com",
  projectId: "demo-project-id",
  storageBucket: "demo-storage-bucket.app",
  messagingSenderId: "000000000000",
  appId: "demo-app-id",
  measurementId: "demo-measurement-id",
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
