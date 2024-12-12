// Función que cambia el contenido del div 'display' según el botón presionado
function showContent(channel) {
  let displayDiv = document.getElementById("display");
  let chatDiv = document.getElementById("chat");

  // Limpia el contenido actual
  displayDiv.innerHTML = "";
  chatDiv.innerHTML = "";

  switch (channel) {
    case "twitch1":
      displayDiv.innerHTML =
        '<iframe src="https://player.twitch.tv/?channel=scythesocietygg&parent=xredragonx.github.io" frameborder="0" allowfullscreen="true" scrolling="no" height="400" width="100%"></iframe>';
      chatDiv.innerHTML =
        '<iframe src="https://www.twitch.tv/scythesocietygg/chat" frameborder="0" allowfullscreen="true" height="400" width="100%"></iframe>';
      break;
    case "twitch2":
      displayDiv.innerHTML =
        '<iframe src="https://www.youtube.com/embed/live_stream?channel=UCc9x200As2pVAv6jos1wY7A&autoplay=1" frameborder="0" allowfullscreen="true" height="400" width="100%"></iframe>';
      chatDiv.innerHTML =
        '<iframe src="https://www.youtube.com/embed/live_chat?channel=UCc9x200As2pVAv6jos1wY7A&autoplay=1" frameborder="0" allowfullscreen="true" height="400" width="100%"></iframe>';
      break;
    case "twitch3":
      displayDiv.innerHTML =
        '<iframe src="https://player.twitch.tv/?channel=rubius&parent=xredragonx.github.io" frameborder="0" allowfullscreen="true" scrolling="no" height="400" width="100%"></iframe>';
      chatDiv.innerHTML =
        '<iframe src="https://www.twitch.tv/yumehimesan/chat" frameborder="0" allowfullscreen="true" height="400" width="100%"></iframe>';
      break;
    case "twitch4":
      displayDiv.innerHTML =
        '<iframe src="https://player.twitch.tv/?channel=auronplay&parent=xredragonx.github.io" frameborder="0" allowfullscreen="true" scrolling="no" height="400" width="100%"></iframe>';
      chatDiv.innerHTML =
        '<iframe src="https://www.twitch.tv/auronplay/chat" frameborder="0" allowfullscreen="true" height="400" width="100%"></iframe>';
      break;
    case "twitch5":
      displayDiv.innerHTML =
        '<iframe src="https://player.twitch.tv/?channel=ibai&parent=xredragonx.github.io" frameborder="0" allowfullscreen="true" scrolling="no" height="400" width="100%"></iframe>';
      chatDiv.innerHTML =
        '<iframe src="https://www.twitch.tv/ibai/chat" frameborder="0" allowfullscreen="true" height="400" width="100%"></iframe>';
      break;
    default:
      displayDiv.innerHTML =
        "<p>Selecciona un canal para ver su contenido.</p>";
      chatDiv.innerHTML = "<p>Selecciona un canal para ver su chat.</p>";
  }
  // Agregar la clase 'show' para hacer la animación
  setTimeout(() => {
    displayDiv.querySelector("iframe").classList.add("show");
    chatDiv.querySelector("iframe").classList.add("show");
  }, 50); // Pequeño retraso para que la clase se aplique después de que se haya añadido el iframe
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
const jsonFile = "index.json";

// Contenedor donde se agregarán las misiones
const container = document.getElementById("index-container");

fetch(jsonFile)
  .then((response) => response.json())
  .then((data) => {
    data.forEach((mision) => {
      // Crear el elemento HTML para cada misión
      const misionElement = document.createElement("div");
      misionElement.className = "col-lg-2 col-md-3 col-sm-4 col-12 mb-4";

      misionElement.innerHTML = `
        <a href="${mision.link}">
          <div class="image-container">
            <img src="${mision.imagen}" class="img-fluid" alt="${mision.descripcion}">
          </div>
        </a>
        <h5 class="text-center">
          <a href="${mision.link}">${mision.titulo}</a>
        </h5>
      `;

      // Agregar el elemento al contenedor
      container.appendChild(misionElement);
    });
  })
  .catch((error) => console.error("Error cargando el archivo JSON:", error));
//FIN
