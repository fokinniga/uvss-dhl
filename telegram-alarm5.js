const sos = require("securos");
const { Telegraf } = require("telegraf");
const fs = require("fs"); // Import the file system module
const path = require("path"); // Import the path module

const BOT_TOKEN = "7612145444:AAF6HVJjCdzDJsXw4NW3-rkfP7enSxLpRWQ"; // ¡Cambia esto!
const CHAT_ID = "-4664148513"; // ¡Cambia esto al ID de tu grupo!

const bot = new Telegraf(BOT_TOKEN);

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


function formatDateTimeString(dateTimeString) {
  const [datePart, timePart] = dateTimeString.split(" ");

  // Dividir la parte de la fecha en día, mes y año
  const [day, month, year] = datePart.split("-");

  // Reorganizar y unir las partes para obtener el formato deseado
  return `${year}-${month}-${day} ${timePart}`;
}

sos.connect(async function (core) {
  console.clear;
  console.log("Securos conectado");
  
  core.registerEventHandler("IMAGE_EXPORT", "1", "*", async (e) => {
    console.log(e)
  });
  core.registerEventHandler("LPR_CAM","*","*", async (e) => {
      console.log(e.action);
      if (e.action == "CAR_LP_RECOGNIZED") {
        //console.log(e)
        console.log(`Time/date: ${e.params.best_view_date_time}`);
        const formatDate = formatDateTimeString(e.params.best_view_date_time);
        console.log(`Format Date:  ${formatDate}`);

        const importdate = `cam$5;time$live`;
        console.log(importdate);
        //let rect = `color:red;${coord}`;
        const fileName = `lpr-${formatdate}.jpg`;
        const exportString = "filename$lpr" + formatDate + ";dir$C:\\export\\"
        let params = {
          "import":"cam$5;time$live",
          "export_engine":"file",
          "export":exportString,
        };

        console.log(params);

        setTimeout(() => {
          console.log("Han pasado 3 segundos");
          console.log("----Start");
          core.doReact("IMAGE_EXPORT", "1", "EXPORT", params);
          console.log("----End");
        }, 3000); // 3000 milisegundos = 3 segundos

        console.log("Este mensaje se muestra antes del delay");
        //Se obtine el archivo con nombre fileName

        const imagePath = `c:/export/${fileName}`;

        const htmlCaption = `
                                <b>Acceso Vehiculo con placas.</b>\n\n
                                Fecha y hora: ${e.params.best_view_date_time}.\n
                                `;

        try {
          // Create a readable stream from the local file
          const imageStream = fs.createReadStream(imagePath);

          // Use sendPhoto with the file stream and the caption
          await bot.telegram.sendPhoto(
            CHAT_ID,
            { source: imageStream },
            {
              caption: htmlCaption,
              parse_mode: "HTML", // ¡Importante para que el caption se formate!
            }
          );
          console.log(
            `Imagen con pie de foto HTML enviada con éxito.---> ${fechaString}`
          );
        } catch (error) {
          console.error(
            "Error al enviar la imagen con pie de foto HTML:",
            error
          );
        }
      } else {
        //console.log(e)
        const nowDate = getCurrentDateTimeString()
        console.log(`Time/date: ${nowDate}`);

        const importdate = `cam$5;time$live`;
        console.log(importdate);
        //let rect = `color:red;${coord}`;
        const exportString = "filename$lpr" + nowDate + ";dir$C:\\export\\"
        const fileName = `nolpr-${nowDate}.jpg`;
        let params = {
          "import":"cam$5;time$live",
          "export_engine":"file",
          "export":exportString,
        };

        console.log(params);

        setTimeout(() => {
          console.log("Han pasado 3 segundos");
          console.log("----Start");
          core.doReact("IMAGE_EXPORT", "1", "EXPORT", params);
          console.log("----End");
        }, 3000); // 3000 milisegundos = 3 segundos

        console.log("Este mensaje se muestra antes del delay");
        //Se obtine el archivo con nombre fileName

        const imagePath = `c:/export/${fileName}`;

        const htmlCaption = `
                                <b>Acceso Vehiculo sin placas.</b>\n\n
                                Fecha y hora: ${nowDate}.\n
                                `;

        try {
          // Create a readable stream from the local file
          const imageStream = fs.createReadStream(imagePath);

          // Use sendPhoto with the file stream and the caption
          await bot.telegram.sendPhoto(
            CHAT_ID,
            { source: imageStream },
            {
              caption: htmlCaption,
              parse_mode: "HTML", // ¡Importante para que el caption se formate!
            }
          );
          console.log(
            `Imagen con pie de foto HTML enviada con éxito.---> ${nowDate}`
          );
        } catch (error) {
          console.error(
            "Error al enviar la imagen con pie de foto HTML:",
            error
          );
        }
      }
    }
  );
});
