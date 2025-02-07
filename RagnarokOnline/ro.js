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

//INICIO *navi copiable*/
function copyToClipboard(text) {
  // Crea un elemento de texto oculto para copiar el texto
  const tempInput = document.createElement("input");
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand("copy"); // Copia el texto seleccionado
  document.body.removeChild(tempInput); // Elimina el elemento temporal

  // Muestra un mensaje temporal
  const originalText = document.querySelector(".copiable").innerText;
  document.querySelector(".copiable").innerText = "Copiado";
  setTimeout(() => {
    document.querySelector(".copiable").innerText = originalText;
  }, 2000); // Vuelve al texto original después de 2 segundos
}
/*FIN de navi copiable*/

// INICIO Ruta al archivo JSON que genera las imagenes de las misiones
const jsonFile = "./romisiones/romisiones.json";

// Contenedor donde se agregarán las misiones
const container = document.getElementById("misiones-container");

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
