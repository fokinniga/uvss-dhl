const sos = require('securos'); 
const { Telegraf } = require("telegraf");

const BOT_TOKEN = "7612145224:AAF6HVJjCdzDJsXw4NW3-rkfP7enSxLpRWQ"; // ¡Cambia esto!
const CHAT_ID = "-4664148513"; // ¡Cambia esto al ID de tu grupo!

const bot = new Telegraf(BOT_TOKEN);

const ahora = new Date();

const anio = ahora.getFullYear();
const mes = String(ahora.getMonth() + 1).padStart(2, '0');
const dia = String(ahora.getDate()).padStart(2, '0');
const hora = String(ahora.getHours()).padStart(2, '0');
const minutos = String(ahora.getMinutes()).padStart(2, '0');
const segundos = String(ahora.getSeconds()).padStart(2, '0');
const fechaString = `${anio}${mes}${dia}${hora}${minutos}${segundos}`;
console.log(fechaString);

const cartype = "Autobus"




function formatDateTimeString(dateTimeString) {
  // Dividir el string en fecha y hora
  const [datePart, timePart] = dateTimeString.split(' ');

  // Dividir la parte de la fecha en día, mes y año
  const [day, month, year] = datePart.split('-');

  // Reorganizar y unir las partes para obtener el formato deseado
  return `${year}-${month}-${day} ${timePart}`;
}


sos.connect(async function(core)
{
    console.clear
    console.log("Securos conectado")
    core.registerEventHandler("IMAGE_EXPORT", "1", "EXPORT_FAILED", NoExportado);
    core.registerEventHandler("LPR_CAM", "*", "*", async (e) => //Se debe usar el id del macro que va a servir de trigger.
    {
        
        console.log(e.action)
        if(e.action == "CAR_LP_RECOGNIZED"){
            const imageUrl = "https://picsum.photos/600/400"; // URL de una imagen de ejemplo

            const htmlCaption = `
                                    <b>Acceso Vehiculo sin placas.</b>\n\n
                                    Fecha y hora: ${fechaString}.\n
                                    Ingresa vehiculo tipo: ${cartype}
                                    Saludos,\n
                                    ISS Team
                                    `;

            try {
                // Usamos sendPhoto, y el texto HTML va en el 'caption'
                await bot.telegram.sendPhoto(CHAT_ID, imageUrl, {
                caption: htmlCaption,
                parse_mode: "HTML", // ¡Importante para que el caption se formatee!
                });
                console.log(`Imagen con pie de foto HTML enviada con éxito.---> ${fechaString}`);
            } catch (error) {
                console.error("Error al enviar la imagen con pie de foto HTML:", error);
            }
        }
    });
    
});