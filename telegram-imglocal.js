const sos = require('securos');
const { Telegraf } = require("telegraf");
const fs = require('fs'); // Import the file system module
const path = require('path'); // Import the path module

const BOT_TOKEN = "7612145444:AAF6HVJjCdzDJsXw4NW3-rkfP7enSxLpRWQ"; // ¡Cambia esto!
const CHAT_ID = "-4664148513"; // ¡Cambia esto al ID de tu grupo!

const bot = new Telegraf(BOT_TOKEN);

// Function to get the current date and time in the desired format
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

const cartype = "Autobus";

// This function doesn't seem to be used in your current code,
// but I'll keep it for completeness if you intend to use it later.
function formatDateTimeString(dateTimeString) {
    const [datePart, timePart] = dateTimeString.split(' ');
    const [day, month, year] = datePart.split('-');
    return `${year}-${month}-${day} ${timePart}`;
}

sos.connect(async function(core) {
    console.clear(); // Use console.clear() as a function call
    console.log("Securos conectado");
    core.registerEventHandler("IMAGE_EXPORT", "1", "EXPORT_FAILED", NoExportado); // NoExportado is not defined in your code
    core.registerEventHandler("LPR_CAM", "*", "*", async (e) => { //Se debe usar el id del macro que va a servir de trigger.

        console.log(e.action);

        const fechaString = getCurrentDateTimeString(); // Get current date/time for each event

        const imagePath = 'c:/export/oscartest.jpg'; // Path to your local image file

        const htmlCaption = `
            <b>Acceso Vehiculo sin placas.</b>\n\n
            Fecha y hora: ${fechaString}.\n
            Ingresa vehiculo tipo: ${cartype}\n
            Saludos,\n
            ISS Team
            `;

        try {
            // Create a readable stream from the local file
            const imageStream = fs.createReadStream(imagePath);

            // Use sendPhoto with the file stream and the caption
            await bot.telegram.sendPhoto(CHAT_ID, { source: imageStream }, {
                caption: htmlCaption,
                parse_mode: "HTML", // ¡Importante para que el caption se formate!
            });
            console.log(`Imagen con pie de foto HTML enviada con éxito.---> ${fechaString}`);
        } catch (error) {
            console.error("Error al enviar la imagen con pie de foto HTML:", error);
        }

    });

    // You should define the NoExportado function if you are registering it as an event handler
    function NoExportado(event) {
        console.log("Image export failed:", event);
        // You might want to send a Telegram message here too, or log more details
    }
});