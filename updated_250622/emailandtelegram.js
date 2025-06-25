const sos = require("securos");
const { Telegraf } = require("telegraf");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer"); // Importa nodemailer

let eventNum = 0;

const BOT_TOKEN = "7612145224:AAF6HVJjCdzDJsXw4NW3-rkfP7enSxLpRWQ";
const CHAT_ID = "-4664148513";

const bot = new Telegraf(BOT_TOKEN);

// --- Configuración de Nodemailer ---
const transporter = nodemailer.createTransport({
  service: "gmail", // Puedes usar otros servicios como Outlook, SendGrid, etc.
  auth: {
    user: "alanisoscar422@gmail.com", // ¡Tu dirección de correo electrónico!
    pass: "jnspseylmjriwkbo", // ¡Tu contraseña o contraseña de aplicación!
  },
});

const RECIPIENT_EMAILS = ["oscar.alanis@pbs.com.mx", "foknniga@gmail.com"];

// --- Funciones existentes (sin cambios) ---
function formatNumberWithTemplate(number, templateName) {
  console.log(`Input: number="${number}", templateName="${templateName}"`);

  const formatoPuro = templateName.split("_")[1]; // Tomará "2L-2D-3D"

  if (!formatoPuro) {
    console.warn(
      "Template name no contiene un formato válido después del '_'. Retornando el número original."
    );
    return number;
  }

  const partesFormato = formatoPuro.split("-").map((parte) => {
    const longitud = parseInt(parte.slice(0, -1), 10);
    const tipo = parte.slice(-1);
    return { tipo, longitud };
  });

  let formattedNumber = "";
  let currentNumberIndex = 0;

  for (let i = 0; i < partesFormato.length; i++) {
    const parte = partesFormato[i];
    const longitudDeseada = parte.longitud;

    const subcadena = number.substring(
      currentNumberIndex,
      currentNumberIndex + longitudDeseada
    );

    formattedNumber += subcadena;

    if (i < partesFormato.length - 1) {
      formattedNumber += "-";
    }
    currentNumberIndex += longitudDeseada;
  }

  console.log(`Output: ${formattedNumber}`);
  return formattedNumber;
}

function nolprdate(fechaOriginal) {
  const indiceZonaHoraria = fechaOriginal.lastIndexOf("+") > -1
    ? fechaOriginal.lastIndexOf("+")
    : fechaOriginal.lastIndexOf("-");

  let fechaFormateada;
  if (indiceZonaHoraria > -1) {
    fechaFormateada = fechaOriginal.substring(0, indiceZonaHoraria);
  } else {
    fechaFormateada = fechaOriginal;
  }
  fechaFormateada = fechaFormateada.replace("T", " ");
  return fechaFormateada;
}

function getCurrentDateTimeString() {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  const hora = String(ahora.getHours() - 1).padStart(2, "0");
  const minutos = String(ahora.getMinutes()).padStart(2, "0");
  const segundos = String(ahora.getSeconds()).padStart(2, "0");
  return `${anio}${mes}${dia}${hora}${minutos}${segundos}`;
}

function formatDateTimeString(dateTimeString) {
  const [datePart, timePart] = dateTimeString.split(" ");
  const [day, month, year] = datePart.split("-");
  return `${year}${month}${day}${timePart.replace(/:/g, "")}`;
}

function formatDateTime2export(dateTimeString) {
  const [datePart, timePart] = dateTimeString.split(" ");
  const [day, month, year] = datePart.split("-");
  return `${year}-${month}-${day} ${timePart}`;
}

const pendingExports = new Map();

sos.connect(async function (core) {
  console.clear();
  console.log("Securos conectado");

  core.registerEventHandler("IMAGE_EXPORT", "1", "EXPORT_DONE", async (e) => {
    if (e.action == "EXPORT_DONE") {
      console.log("Archivo exportado con éxito.");
    }
  });

  core.registerEventHandler("LPR_CAM", "*", "*", async (e) => {
    eventNum++;
    console.log(`evento: ${eventNum}`);
    console.log(`\n--- Evento LPR_CAM: ${e.action} ---`);
    console.log(e);
    let fileName;
    let htmlCaption;
    let emailSubject; // Nuevo: Asunto del correo
    let emailText;    // Nuevo: Cuerpo de texto plano para el correo
    const exportDirectory = "C:\\export";
    let tiempoParaSecuros;

    if (e.action === "CAR_LP_RECOGNIZED") {
      console.log("LPR_EVENT");
      const plate = formatNumberWithTemplate(
        e.params.number,
        e.params.template_name
      );
      const formattedDate = formatDateTimeString(e.params.best_view_date_time);
      tiempoParaSecuros = formatDateTime2export(e.params.best_view_date_time);

      fileName = `lpr${formattedDate}.jpg`;
      htmlCaption = `
        <b>Acceso Vehículo con placas.</b>\n\n
        Fecha y hora: ${e.params.best_view_date_time}\n
        Placa: <b>${e.params.number || "N/A"}</b>
        Placa formato: <b>${plate}</b>
      `;
      emailSubject = `Acceso de Vehículo con Placas: ${plate}`;
      emailText = `Acceso de Vehículo con placas.\n\nFecha y hora: ${e.params.best_view_date_time}\nPlaca: ${e.params.number || "N/A"}\nPlaca formato: ${plate}`;
    }

    if (typeof tiempoParaSecuros === "undefined" || tiempoParaSecuros === null) {
      console.error(
        "ERROR: tiempoParaSecuros es undefined/null. Esto no debería pasar."
      );
      return;
    }

    const importString = `cam$5;time$${tiempoParaSecuros}`;
    const exportString = `filename$${fileName};dir$${exportDirectory}\\`;

    const imagePath = path.join(exportDirectory, fileName);

    let params = {
      import: importString,
      export_engine: "file",
      export: exportString,
    };

    console.log("Parámetros de exportación:", params);

    try {
      core.doReact("IMAGE_EXPORT", "1", "EXPORT", params);
      console.log(`Solicitud de exportación para ${fileName} enviada.`);

      console.log(
        `Esperando 10 segundos antes de intentar enviar la imagen...`
      );
      await new Promise((resolve) => setTimeout(resolve, 10000));

      console.log(`Procediendo a enviar por Telegram y Correo.`);

      if (!fs.existsSync(imagePath)) {
        throw new Error(
          `El archivo ${imagePath} no se encontró. Puede que la exportación no se haya completado a tiempo.`
        );
      }

      // --- Envío a Telegram ---
      const telegramPromise = (async () => {
        try {
          const imageStream = fs.createReadStream(imagePath);
          await bot.telegram.sendPhoto(
            CHAT_ID,
            { source: imageStream },
            {
              caption: htmlCaption,
              parse_mode: "HTML",
            }
          );
          console.log(`Imagen ${fileName} enviada con éxito a Telegram.`);
        } catch (error) {
          console.error(
            `Error al enviar a Telegram para ${fileName}:`,
            error.message
          );
          bot.telegram
            .sendMessage(CHAT_ID, `⚠️ Error al enviar a Telegram: ${error.message}`)
            .catch((err) =>
              console.error("Error al enviar mensaje de error a Telegram:", err)
            );
        }
      })();

      // --- Envío de Correo Electrónico ---
      const emailPromise = (async () => {
        try {
          // Leer la imagen como un attachment
          const imageAttachment = fs.readFileSync(imagePath);

          await transporter.sendMail({
            from: "alanisoscar422@gmail.com", // ¡Tu dirección de correo!
            to: RECIPIENT_EMAILS.join(", "), // Une las direcciones con coma
            subject: emailSubject,
            html: htmlCaption, // Puedes usar el mismo HTML para el cuerpo del correo
            text: emailText, // Versión de texto plano del cuerpo del correo
            attachments: [
              {
                filename: fileName,
                content: imageAttachment,
                contentType: "image/jpeg", // Ajusta si el formato es diferente
              },
            ],
          });
          console.log(`Correo para ${fileName} enviado con éxito.`);
        } catch (error) {
          console.error(
            `Error al enviar correo para ${fileName}:`,
            error.message
          );
        }
      })();

      // Esperar a que ambas promesas se resuelvan (o fallen)
      await Promise.allSettled([telegramPromise, emailPromise]);

    } catch (error) {
      console.error(
        `Error en el proceso general para ${fileName}:`,
        error.message
      );
      bot.telegram
        .sendMessage(CHAT_ID, `⚠️ Error general de procesamiento: ${error.message}`)
        .catch((err) =>
          console.error("Error al enviar mensaje de error a Telegram:", err)
        );
    }
  });
});

bot.launch().then(() => {
  console.log("Bot de Telegram iniciado");
}).catch((err) => {
  console.error("Error al iniciar el bot de Telegram:", err);
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));