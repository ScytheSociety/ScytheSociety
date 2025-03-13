// Función que cambia el contenido del div 'display' según el botón presionado
function showContent(channel) {
  let displayDiv = document.getElementById("display");
  let chatDiv = document.getElementById("chat");

  // Limpia el contenido actual
  displayDiv.innerHTML = "";
  chatDiv.innerHTML = "";

  // Define el dominio para uso en los parámetros parent de Twitch
  const domain = window.location.hostname; // Obtiene dinámicamente el dominio actual

  switch (channel) {
    case "twitch1":
      // Twitch Stream y Chat
      displayDiv.innerHTML = `<iframe src="https://player.twitch.tv/?channel=scythesocietygg&parent=${domain}" frameborder="0" allowfullscreen="true" scrolling="no" height="400" width="100%"></iframe>`;
      chatDiv.innerHTML = `<iframe src="https://www.twitch.tv/embed/scythesocietygg/chat?parent=${domain}" frameborder="0" allowfullscreen="true" height="400" width="100%"></iframe>`;
      break;
    case "twitch2":
      // YouTube Stream y Chat
      displayDiv.innerHTML =
        '<iframe src="https://www.youtube.com/embed/live_stream?channel=UC_pGhPbYuKrxDcFdEJHj3yg&autoplay=1" frameborder="0" allowfullscreen="true" height="400" width="100%"></iframe>';
      chatDiv.innerHTML =
        '<iframe src="https://www.youtube.com/live_chat?v=live_stream&embed_domain=scythesociety.github.io&channel=UC_pGhPbYuKrxDcFdEJHj3yg" frameborder="0" allowfullscreen="true" height="400" width="100%"></iframe>';
      break;
    case "twitch3":
      // Kick Stream
      displayDiv.innerHTML =
        '<iframe src="https://player.kick.com/scythesocietygg" frameborder="0" allowfullscreen="true" scrolling="no" height="400" width="100%"></iframe>';
      chatDiv.innerHTML =
        '<iframe src="https://kick.com/scythesocietygg/chatroom" frameborder="0" allowfullscreen="true" height="400" width="100%"></iframe>';
      break;
    case "twitch4":
      // TikTok (No tienen iframe oficial para embed, usamos un div informativo)
      displayDiv.innerHTML = `<div class="tiktok-embed-container">
          <div class="tiktok-info">
            <i class="fab fa-tiktok fa-4x mb-3"></i>
            <h3>TikTok Live</h3>
            <p>TikTok no permite insertar videos en vivo mediante iframe.</p>
            <a href="https://www.tiktok.com/@scythesocietygg" target="_blank" class="btn btn-gaming mt-3">Ver en TikTok</a>
          </div>
        </div>`;
      chatDiv.innerHTML = `<div class="tiktok-embed-container">
          <div class="tiktok-info">
            <h3>Chat de TikTok</h3>
            <p>El chat solo está disponible en la aplicación oficial.</p>
          </div>
        </div>`;
      break;
    case "twitch5":
      // Facebook Live
      displayDiv.innerHTML = `<iframe src="https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fscythesocietygg%2Flive%2F&show_text=0" width="100%" height="400" style="border:none;overflow:hidden" scrolling="no" frameborder="0" allowfullscreen="true"></iframe>`;
      chatDiv.innerHTML = `<iframe src="https://www.facebook.com/plugins/comments.php?href=https%3A%2F%2Fwww.facebook.com%2Fscythesocietygg%2Flive%2F" width="100%" height="400" style="border:none;overflow:hidden" scrolling="no" frameborder="0"></iframe>`;
      break;
    default:
      displayDiv.innerHTML =
        "<p class='text-center p-4'>Selecciona un canal para ver su contenido.</p>";
      chatDiv.innerHTML =
        "<p class='text-center p-4'>Selecciona un canal para ver su chat.</p>";
  }

  // Agregar la clase 'show' para hacer la animación
  setTimeout(() => {
    const displayIframe = displayDiv.querySelector("iframe");
    const chatIframe = chatDiv.querySelector("iframe");

    // Verificar si existen los iframes antes de añadir la clase
    if (displayIframe) displayIframe.classList.add("show");
    if (chatIframe) chatIframe.classList.add("show");
  }, 50);
}

// Inicializar la página con el primer stream
window.onload = function () {
  showContent("twitch1");
};

// JavaScript para mostrar/ocultar submenús al hacer clic
document
  .querySelectorAll(".dropdown-submenu > .dropdown-toggle")
  .forEach((item) => {
    item.addEventListener("click", function (e) {
      e.preventDefault(); // Prevenir la acción predeterminada del enlace
      const submenu = this.nextElementSibling; // Obtener el submenú siguiente
      submenu.classList.toggle("show"); // Alternar la clase 'show' para mostrar/ocultar
    });
  });

// Cierra los submenús si se hace clic fuera de ellos
document.addEventListener("click", function (e) {
  if (!e.target.closest(".dropdown-submenu")) {
    document.querySelectorAll(".dropdown-menu.show").forEach((menu) => {
      menu.classList.remove("show");
    });
  }
});

$(".dropdown-submenu .dropdown-toggle").on("click", function (e) {
  $(this).next(".dropdown-menu").toggle();
  e.stopPropagation();
  e.preventDefault();
});

// INICIO Ruta al archivo JSON que genera las imagenes de las misiones
const jsonFile = "./index.json";

// Contenedor donde se agregarán las misiones
const container = document.getElementById("index-container");

fetch(jsonFile)
  .then((response) => response.json())
  .then((data) => {
    data.forEach((index) => {
      // Crear el elemento HTML para cada misión
      const indexElement = document.createElement("div");
      indexElement.className = "col-lg-2 col-md-3 col-sm-4 col-12 mb-4";

      indexElement.innerHTML = `
        <a href="${index.link}">
          <div class="image-container">
            <img src="${index.imagen}" class="img-fluid" alt="${index.descripcion}">
          </div>
        </a>
        <h5 class="text-center">
          <a href="${index.link}">${index.titulo}</a>
        </h5>
      `;

      // Agregar el elemento al contenedor
      container.appendChild(indexElement);
    });
  })
  .catch((error) => console.error("Error cargando el archivo JSON:", error));
//FIN
