const sos = require("securos");
const { Telegraf } = require("telegraf");
const fs = require("fs"); // Importa el módulo de sistema de archivos
const path = require("path"); // Importa el módulo de rutas

// --- Configuración (Considera usar variables de entorno para producción) ---
// Para producción, es una buena práctica almacenar estos valores en variables de entorno,
// por ejemplo: process.env.BOT_TOKEN, process.env.CHAT_ID
const BOT_TOKEN = "7612145224:AAF6HVJjCdzDJsXw4NW3-rkfP7enSxLpRWQ"; // ¡Cambia esto!

const CHAT_ID = "-4664148513"; // ¡Cambia esto al ID de tu grupo!

const bot = new Telegraf(BOT_TOKEN);

// --- Función auxiliar para obtener la fecha y hora actual en formato YYYYMMDDHHMMSS ---
function getCurrentDateTimeString() {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  const hora = String(ahora.getHours()).padStart(2, '0');
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

// --- Objeto para manejar promesas de exportación de imágenes ---
// Usaremos este objeto para almacenar las funciones 'resolve' y 'reject'
// de las promesas de exportación, asociadas al nombre del archivo esperado.
const pendingExports = new Map();

sos.connect(async function (core) {
  console.clear(); // Corregir: console.clear es una función
  console.log("Securos conectado");

  core.registerEventHandler("IMAGE_EXPORT", "1", "EXPORT_DONE", async (e) => {
    console.log("EXPORT_DONE:", e);
    // Resuelve la promesa si la exportación se completa con éxito
    if (e.action == "EXPORT_DONE") {
      console.log("Archivo exportado con éxito.")
      console.log(`Export done: 
        ${e}`)
    }
  });

  // --- Manejador de eventos LPR_CAM ---
  core.registerEventHandler("LPR_CAM", "*", "*", async (e) => {
    console.log(`Evento LPR_CAM: ${e.action}`);
    let fileName;f
    let htmlCaption;
    const exportDirectory = "C:\\export"; // Directorio de exportación

    // Determinamos el nombre del archivo y el caption según el tipo de evento
    if (e.action === "CAR_LP_RECOGNIZED") {
      const formattedDate = formatDateTimeString(e.params.best_view_date_time);
      console.log(`Fecha formateada para placa reconocida: ${formattedDate}`);
      fileName = `lpr${formattedDate}.jpg`;
      htmlCaption = `
        <b>Acceso Vehículo con placas.</b>\n\n
        Fecha y hora: ${e.params.best_view_date_time}\n
        Placa: <b>${e.params.plate_number || 'N/A'}</b>
      `;
    } else {
      const currentDate = getCurrentDateTimeString();
      console.log(`Fecha actual para vehículo sin placas: ${currentDate}`);
      fileName = `nolpr${currentDate}.jpg`;
      htmlCaption = `
        <b>Acceso Vehículo sin placas.</b>\n\n
        Fecha y hora: ${currentDate}\n
      `;
    }

    const exportString = `filename$${fileName};dir$${exportDirectory}\\`;
    const imagePath = path.join(exportDirectory, fileName); // Uso de path.join para rutas seguras

    let params = {
      "import": "cam$5;time$live",
      "export_engine": "file",
      "export": exportString,
    };

    console.log("Parámetros de exportación:", params);

    // --- Iniciar la exportación ---
    try {
      // La solicitud de exportación se envía, pero no se espera una promesa aquí.
      // Las operaciones de Telegram se ejecutarán inmediatamente después.
      core.doReact("IMAGE_EXPORT", "1", "EXPORT", params);
      console.log(`Solicitud de exportación para ${fileName} enviada.`);

      console.log(`Procediendo a enviar por Telegram (sin esperar confirmación de exportación).`);

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