const sos = require("securos");
const { Telegraf } = require("telegraf");
const fs = require("fs"); // Importa el módulo de sistema de archivos
const path = require("path"); // Importa el módulo de rutas

// --- Configuración (Considera usar variables de entorno para producción) ---
const BOT_TOKEN = "7612145224:AAF6HVJjCdzDJsXw4NW3-rkfP7enSxLpRWQ"; // ¡Cambia esto!
const CHAT_ID = "-4664148513"; // ¡Cambia esto al ID de tu grupo!

const bot = new Telegraf(BOT_TOKEN);

// ---  Función para correción de hora en no lpr --
function nolprdate(fechaOriginal) {

    const indiceZonaHoraria = fechaOriginal.lastIndexOf('+') > -1
        ? fechaOriginal.lastIndexOf('+')
        : fechaOriginal.lastIndexOf('-');

    let fechaFormateada;

    if (indiceZonaHoraria > -1) {
        // Si hay una zona horaria, toma la subcadena hasta antes de ella
        fechaFormateada = fechaOriginal.substring(0, indiceZonaHoraria);
    } else {
        // Si no hay zona horaria (poco probable con el formato TZO), usa la cadena completa
        fechaFormateada = fechaOriginal;
    }

    // Reemplaza la 'T' con un espacio
    fechaFormateada = fechaFormateada.replace('T', ' ');

    console.log("Fecha original:", fechaOriginal);
    console.log("Fecha formateada (Opción 1):", fechaFormateada);
    return fechaFormateada

}



// --- Función auxiliar para obtener la fecha y hora actual en formato YYYYMMDDHHMMSS ---
function getCurrentDateTimeString() {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  const hora = String(ahora.getHours()-1).padStart(2, '0');
  const minutos = String(ahora.getMinutes()).padStart(2, '0');
  const segundos = String(ahora.getSeconds()).padStart(2, '0'); 
  return `${anio}${mes}${dia}${hora}${minutos}${segundos}`;
}

// --- Función para formatear la cadena de fecha/hora de entrada (ej: DD-MM-YYYY HH:MM:SS) ---
// Asume que e.params.best_view_date_time viene en formato "DD-MM-YYYY HH:MM:SS"
function formatDateTimeString(dateTimeString) {
  const [datePart, timePart] = dateTimeString.split(" ");
  const [day, month, year] = datePart.split("-");
  return `${year}${month}${day}${timePart.replace(/:/g, '')}`; // Formato YYYYMMDDHHMMSS sin guiones ni puntos
}

function formatDateTime2export(dateTimeString) {
  const [datePart, timePart] = dateTimeString.split(" ");
  const [day, month, year] = datePart.split("-");
  return `${year}-${month}-${day} ${timePart}`; // Formato YYYYMMDDHHMMSS sin guiones ni puntos
}

// --- Objeto para manejar promesas de exportación de imágenes ---
// Usaremos este objeto para almacenar las funciones 'resolve' y 'reject'
// de las promesas de exportación, asociadas al nombre del archivo esperado.
const pendingExports = new Map(); // Still here, but not actively used for promises in this version

sos.connect(async function (core) {
  console.clear();
  console.log("Securos conectado");

  core.registerEventHandler("IMAGE_EXPORT", "1", "EXPORT_DONE", async (e) => {
    console.log("EXPORT_DONE:", e);
    if (e.action == "EXPORT_DONE") {
      console.log("Archivo exportado con éxito.");
      console.log(`Export done: ${e.params}`); // Use JSON.stringify for better logging
    }
  });

  // --- Manejador de eventos LPR_CAM ---
  core.registerEventHandler("LPR_CAM", "*", "*", async (e) => {
    console.log(`Evento LPR_CAM: ${e.action}`);
    let fileName;
    let htmlCaption;
    const exportDirectory = "C:\\export"; 

    if (e.action === "CAR_LP_RECOGNIZED") {
      const formattedDate = formatDateTimeString(e.params.best_view_date_time);
      const expTime = formatDateTime2export(e.params.best_view_date_time)
      console.log(`formattedDate: ${formattedDate}`)
      console.log(`Time to export string: ${expTime}`)
      console.log(`Fecha formateada para placa reconocida: ${formattedDate}`);
      fileName = `lpr${formattedDate}.jpg`;
      htmlCaption = `
        <b>Acceso Vehículo con placas.</b>\n\n
        Fecha y hora: ${e.params.best_view_date_time}\n
        Placa: <b>${e.params.plate_number || 'N/A'}</b>
      `;
    } else {
      console.log("Else: ")
      console.log(e)
      //const currentDate = getCurrentDateTimeString();
      const expTime = nolprdate(e.params.date_time)
      const fechaCompacta = expTime.replace(/[- :.]/g, '');
      console.log(`Time to export string: ${expTime}`)
      fileName = `nolpr${fechaCompacta}.jpg`;
      console.log(`File Name: ${fileName}`)
      htmlCaption = `
        <b>Acceso Vehículo sin placas.</b>\n\n
        Fecha y hora: ${expTime}\n
      `;
    }
    
    const importString = `cam$5;time$${expTime}`
    const exportString = `filename$${fileName};dir$${exportDirectory}\\`;
    
    const imagePath = path.join(exportDirectory, fileName); // Uso de path.join para rutas seguras

    let params = {
      "import": importString,
      "export_engine": "file",
      "export": exportString,
    };

    console.log("Parámetros de exportación:", params);

    // --- Iniciar la exportación ---
    try {
      core.doReact("IMAGE_EXPORT", "1", "EXPORT", params);
      console.log(`Solicitud de exportación para ${fileName} enviada.`);

      // --- AGREGAR RETRASO DE 3 SEGUNDOS ---
      console.log(`Esperando 3 segundos antes de intentar enviar la imagen a Telegram...`);
      await new Promise(resolve => setTimeout(resolve, 3000)); // Espera 3 segundos

      console.log(`Procediendo a enviar por Telegram.`);

      // --- Enviar la imagen por Telegram ---
      // Verificamos que el archivo existe antes de intentar leerlo
      if (!fs.existsSync(imagePath)) {
        throw new Error(`El archivo ${imagePath} no se encontró. Puede que la exportación no se haya completado a tiempo.`);
      }

      const imageStream = fs.createReadStream(imagePath);
      await bot.telegram.sendPhoto(
        CHAT_ID,
        { source: imageStream },
        {
          caption: htmlCaption,
          parse_mode: "HTML", // ¡Importante para que el caption se formatee!
        }
      );
      console.log(`Imagen ${fileName} enviada con éxito a Telegram.`);
    } catch (error) {
      console.error(`Error en el proceso de exportación o envío para ${fileName}:`, error.message);
      // Opcional: Enviar un mensaje de error a Telegram si la imagen no se pudo enviar
      bot.telegram.sendMessage(CHAT_ID, `⚠️ Error al procesar imagen: ${error.message}`).catch(err => console.error("Error al enviar mensaje de error a Telegram:", err));
    }
  });
});

// --- Iniciar el bot de Telegram ---
bot.launch().then(() => {
  console.log('Bot de Telegram iniciado');
}).catch(err => {
  console.error('Error al iniciar el bot de Telegram:', err);
});

// Habilitar la detención elegante en eventos del sistema
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));