/**
 * hellgame-utils.js
 * Funciones de utilidad compartidas entre los diferentes módulos de HellGame
 */

// Namespace para HellGame
var HellGame = HellGame || {};

// Módulo de Utilidades
HellGame.Utils = (function () {
  // Obtener ID de carta desde la ruta
  function obtenerIdDeCarta(rutaCarta) {
    if (!rutaCarta) return "0";

    // Extraer ID de la ruta (ej: "imagenes/cartas/mvp/27329.png" -> "27329")
    const match = rutaCarta.match(/\/(\d+)\.png$/);
    return match ? match[1] : "0";
  }

  // Obtener ID de monstruo desde la ruta de carta
  function obtenerIdDeMonstruo(rutaCarta) {
    if (!rutaCarta) return "0";

    const cartaId = obtenerIdDeCarta(rutaCarta);
    const esCartaMVP = rutaCarta.includes("/mvp/");

    // Para una implementación completa, deberías buscar el ID real en el YAML
    // Esta es una simplificación basada en la convención de nombrado
    if (esCartaMVP) {
      // Para cartas MVP, asumimos que el ID del monstruo es 20 + últimos 3 dígitos del ID de carta
      return cartaId.length > 3
        ? `20${cartaId.substring(cartaId.length - 3)}`
        : cartaId;
    } else {
      // Para cartas normales, el ID puede variar más
      // Tendrías que implementar una búsqueda en el YAML para encontrar la relación exacta
      return cartaId;
    }
  }

  // Obtener nombre del monstruo desde la ruta de carta
  function obtenerNombreMonstruo(rutaCarta) {
    if (!rutaCarta) return "Desconocido";

    // En una implementación real, buscarías en el YAML
    // Para esta demo, usaremos un mapeo de nombres conocidos
    const cartaId = obtenerIdDeCarta(rutaCarta);
    const esCartaMVP = rutaCarta.includes("/mvp/");

    // Mapeo de algunos IDs conocidos (basados en los ejemplos)
    const nombresConocidos = {
      // MVPs
      27329: "Curse-swallowed King",
      27381: "Phantom Himmelmez",
      27383: "Phantom Amdarais",
      27362: "Corrupted Spider Queen",
      4168: "Dark Lord",

      // Normales
      4190: "Wraith",
      4171: "Dark Priest",
      4277: "Zealotus",
      4140: "Abysmal Knight",
      4268: "Injustice",
      4320: "Bloody Knight",
      4238: "Owl Baron",
      4606: "2nd Commander of Destruction",
      27359: "Ice Ghost",
      4608: "White Knight",
      27361: "Corrupted Wanderer",
      27385: "Mutating Khalitzburg",
      27386: "Cursed Raydric",
      27387: "Cursed Raydric Archer",
    };

    return (
      nombresConocidos[cartaId] ||
      (esCartaMVP ? `MVP ${cartaId}` : `Monstruo ${cartaId}`)
    );
  }

  // Obtener tipo de monstruo (MVP, normal)
  function obtenerTipoMonstruo(rutaCarta) {
    return rutaCarta.includes("/mvp/") ? "mvp" : "normal";
  }

  // Formatear fecha
  function formatearFecha(fechaStr) {
    if (!fechaStr) return "";

    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString() + " " + fecha.toLocaleTimeString();
    } catch (e) {
      console.error("Error al formatear fecha:", e);
      return fechaStr;
    }
  }

  // Calcular tiempo restante en formato legible
  function formatearTiempoRestante(milisegundos) {
    if (milisegundos <= 0) return "0m";

    const segundos = Math.floor(milisegundos / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    const dias = Math.floor(horas / 24);

    if (dias > 0) {
      return `${dias}d ${horas % 24}h`;
    } else if (horas > 0) {
      return `${horas}h ${minutos % 60}m`;
    } else {
      return `${minutos}m`;
    }
  }

  // Generar un color aleatorio pero determinista basado en un string
  function generarColorDesdeString(str) {
    // Generamos un hash simple desde el string
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Convertimos el hash a un color hexadecimal
    let color = "#";
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff;
      color += ("00" + value.toString(16)).substr(-2);
    }

    return color;
  }

  // Generar versión semitransparente de un color para gráficos
  function colorSemitransparente(color, alpha = 0.8) {
    // Si el color es hexadecimal, lo convertimos a rgba
    if (color.startsWith("#")) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Si ya es rgba, simplemente reemplazamos el valor de alpha
    if (color.startsWith("rgba")) {
      return color.replace(/[\d\.]+\)$/, `${alpha})`);
    }

    // Si es rgb, lo convertimos a rgba
    if (color.startsWith("rgb(")) {
      return color.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
    }

    // Si no reconocemos el formato, devolvemos un color predeterminado
    return `rgba(128, 128, 128, ${alpha})`;
  }

  // Obtener nombre de usuario a partir de su ID
  function obtenerNombreUsuario(userId) {
    // En una implementación real, buscarías en una base de datos o API
    // Aquí usamos un mapeo simple basado en los datos que hemos visto
    const nombresUsuarios = {
      "302285499710701571": "masteralberto",
      "232690174696488974": "florcitha",
      "318586835876184064": "be299",
      "396728024038506526": "nuthir",
      "650531689214246912": "hellart87",
      "390774048650559488": "munky666",
      "189529253145083904": "malu.rar",
      "129347097563496449": "ing.ragnord",
      "1148790624653414431": "cruzificado_57805",
      "1210207576298622976": "xredragonx",
      "169641371592818688": "helenis1",
      "129323050041606144": "nyxkaito",
    };

    return nombresUsuarios[userId] || `Usuario ${userId.substring(0, 8)}...`;
  }

  // Verificar si un elemento es MVP basándose en su ruta o nombre
  function esMVP(rutaONombre) {
    if (typeof rutaONombre !== "string") return false;

    // Verificar si es una ruta de imagen que contiene "/mvp/"
    if (rutaONombre.includes("/mvp/")) return true;

    // Lista de palabras clave que suelen aparecer en nombres de MVPs
    const palabrasClavesMVP = [
      "Lord",
      "Queen",
      "King",
      "Phantom",
      "Dark Lord",
      "Corrupted",
      "Ancient",
      "Cursed",
      "Swallowed",
      "Amdarais",
      "Himmelmez",
    ];

    // Verificar si el nombre contiene alguna de las palabras clave
    return palabrasClavesMVP.some((palabra) => rutaONombre.includes(palabra));
  }

  // Manejar errores de fetch de manera consistente
  function manejarErrorFetch(error, contenedor, mensaje = null) {
    console.error("Error de red completo:", error);

    // Mensaje de error más descriptivo
    let errorMessage = mensaje || "No se pudieron cargar los datos. ";

    if (error instanceof TypeError) {
      errorMessage += "Problema de conexión o CORS. ";
    } else if (error.name === "AbortError") {
      errorMessage += "La solicitud fue cancelada. ";
    }

    if (contenedor) {
      contenedor.innerHTML = `
        <div class="alert alert-danger" role="alert">
          <i class="fas fa-exclamation-triangle me-2"></i>
          ${errorMessage}
          <details>
            <summary>Detalles técnicos</summary>
            <pre>${error.toString()}</pre>
            <p>Código de error: ${error.name}</p>
          </details>
        </div>
      `;
    }
  }

  // Retorno público del módulo
  return {
    obtenerIdDeCarta: obtenerIdDeCarta,
    obtenerIdDeMonstruo: obtenerIdDeMonstruo,
    obtenerNombreMonstruo: obtenerNombreMonstruo,
    obtenerTipoMonstruo: obtenerTipoMonstruo,
    formatearFecha: formatearFecha,
    formatearTiempoRestante: formatearTiempoRestante,
    generarColorDesdeString: generarColorDesdeString,
    colorSemitransparente: colorSemitransparente,
    obtenerNombreUsuario: obtenerNombreUsuario,
    esMVP: esMVP,
    manejarErrorFetch: manejarErrorFetch,
  };
})();
