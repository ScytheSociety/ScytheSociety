document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("login-form");

  if (loginForm) {
    loginForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      // Función simple para generar un hash (no es criptográficamente seguro,
      // pero es mejor que texto plano)
      function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = (hash << 5) - hash + char;
          hash = hash & hash; // Convertir a entero de 32 bits
        }
        return hash.toString(16); // Convertir a hexadecimal
      }

      // Hash de las credenciales predefinidas
      // Esto reemplaza tu archivo YAML
      const validCredentials = [
        { username: "red", passwordHash: simpleHash("dragon666") },
        { username: "hell", passwordHash: simpleHash("cuervo666") },
        { username: "usuario3", passwordHash: simpleHash("contraseña3") },
        { username: "usuario4", passwordHash: simpleHash("contraseña4") },
        { username: "usuario5", passwordHash: simpleHash("contraseña5") },
      ];

      // Verificar credenciales
      const passwordHash = simpleHash(password);
      const userFound = validCredentials.find(
        (user) =>
          user.username === username && user.passwordHash === passwordHash
      );

      if (userFound) {
        // Aumentar la seguridad con un token de sesión
        const sessionToken = simpleHash(username + Date.now());
        localStorage.setItem("sessionToken", sessionToken);
        localStorage.setItem("username", username);
        localStorage.setItem("loginTime", Date.now());

        window.location.href = "oficiales.html"; // Redirige a la página protegida
      } else {
        document.getElementById("error-message").innerText =
          "Usuario o contraseña incorrectos";
      }
    });
  }
});

// Función para comprobar si el usuario está autenticado
function checkAuth() {
  const sessionToken = localStorage.getItem("sessionToken");
  const username = localStorage.getItem("username");
  const loginTime = localStorage.getItem("loginTime");

  // Verificar si la sesión existe y no ha expirado (ejemplo: 24 horas)
  if (sessionToken && username && loginTime) {
    const currentTime = Date.now();
    const sessionAge = currentTime - parseInt(loginTime);
    const sessionLimit = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

    if (sessionAge < sessionLimit) {
      return true; // Usuario autenticado
    }
  }

  // No autenticado o sesión expirada
  return false;
}

// Agregar esto a oficiales.html para proteger la página
if (document.location.pathname.includes("oficiales.html")) {
  if (!checkAuth()) {
    window.location.href = "login.html"; // Redirigir a login si no está autenticado
  }
}
