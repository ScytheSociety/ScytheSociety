// Funcionalidad específica para gestionar los streams en la página principal
// Ubicación: assets/js/index/stream.js

// Función que cambia el contenido del div 'display' según el botón presionado
function showContent(channel) {
  let displayDiv = document.getElementById("display");
  let chatDiv = document.getElementById("chat");

  if (!displayDiv || !chatDiv) return;

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
    const iframes = displayDiv.querySelectorAll("iframe");
    if (iframes.length > 0) {
      iframes[0].classList.add("show");
    }

    const chatIframes = chatDiv.querySelectorAll("iframe");
    if (chatIframes.length > 0) {
      chatIframes[0].classList.add("show");
    }
  }, 50);
}

// Inicializa los streams en cuanto cargue el documento
document.addEventListener("DOMContentLoaded", function () {
  // Verificar si estamos en la página principal y si existen los elementos necesarios
  const displayElement = document.getElementById("display");
  const streamButtons = document.querySelectorAll(".stream-button");

  if (displayElement && streamButtons.length > 0) {
    // Mostrar el primer stream por defecto
    showContent("twitch1");

    // Añadir eventos a los botones de streams
    streamButtons.forEach((button) => {
      button.addEventListener("click", function () {
        // Quitar la clase active de todos los botones
        streamButtons.forEach((btn) => {
          btn.classList.remove("active");
        });

        // Añadir la clase active al botón seleccionado
        this.classList.add("active");

        // Mostrar el stream correspondiente
        const channel = this.getAttribute("data-channel");
        showContent(channel);
      });
    });
  }
});
