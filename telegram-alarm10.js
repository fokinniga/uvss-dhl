const sos = require("securos");
const { Telegraf } = require("telegraf");
const fs = require("fs");
const path = require("path");

// --- Configuración (Considera usar variables de entorno para producción) ---
const BOT_TOKEN = "7612145224:AAF6HVJjCdzDJsXw4NW3-rkfP7enSxLpRWQ";
const CHAT_ID = "-4664148513";

const bot = new Telegraf(BOT_TOKEN);

function nolprdate(fechaOriginal) {
    const indiceZonaHoraria = fechaOriginal.lastIndexOf('+') > -1
        ? fechaOriginal.lastIndexOf('+')
        : fechaOriginal.lastIndexOf('-');

    let fechaFormateada;
    if (indiceZonaHoraria > -1) {
        fechaFormateada = fechaOriginal.substring(0, indiceZonaHoraria);
    } else {
        fechaFormateada = fechaOriginal;
    }
    fechaFormateada = fechaFormateada.replace('T', ' ');
    console.log("Fecha original (nolprdate):", fechaOriginal);
    console.log("Fecha formateada (nolprdate):", fechaFormateada);
    return fechaFormateada;
}

function getCurrentDateTimeString() {
    const ahora = new Date();
    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    // Cuidado: sigue restando 1 hora aquí. Si no se usa, puedes quitar esta función.
    const hora = String(ahora.getHours() - 1).padStart(2, '0');
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    const segundos = String(ahora.getSeconds()).padStart(2, '0');
    return `${anio}${mes}${dia}${hora}${minutos}${segundos}`;
}

function formatDateTimeString(dateTimeString) {
    const [datePart, timePart] = dateTimeString.split(" ");
    const [day, month, year] = datePart.split("-");
    return `${year}${month}${day}${timePart.replace(/:/g, '')}`;
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
        console.log("EXPORT_DONE:", e);
        if (e.action == "EXPORT_DONE") {
            console.log("Archivo exportado con éxito.");
            console.log(`Export done: ${JSON.stringify(e.params)}`); // Mejor logueo
        }
    });

    core.registerEventHandler("LPR_CAM", "*", "*", async (e) => {
        console.log(`\n--- Evento LPR_CAM: ${e.action} ---`);
        // Log completo para depuración
        console.log(`Parametros generales (e): ${JSON.stringify(e, null, 2)}`);

        let fileName;
        let htmlCaption;
        const exportDirectory = "C:\\export";
        let tiempoParaSecuros; // <--- ¡Variable renombrada aquí!

        if (e.action === "CAR_LP_RECOGNIZED") {
            const formattedDate = formatDateTimeString(e.params.best_view_date_time);
            tiempoParaSecuros = formatDateTime2export(e.params.best_view_date_time) // <--- ¡Uso de la variable renombrada!
            console.log(`formattedDate (LPR): ${formattedDate}`);
            console.log(`Time to export string (LPR): ${tiempoParaSecuros}`);
            fileName = `lpr${formattedDate}.jpg`;
            htmlCaption = `
                <b>Acceso Vehículo con placas.</b>\n\n
                Fecha y hora: ${e.params.best_view_date_time}\n
                Placa: <b>${e.params.plate_number || 'N/A'}</b>
            `;
        } else {
            console.log("Else (No CAR_LP_RECOGNIZED):");
            tiempoParaSecuros = nolprdate(e.params.time_iso); // <--- ¡Uso de la variable renombrada!
            const fechaCompacta = tiempoParaSecuros.replace(/[- :.]/g, '');
            console.log(`Time to export string (No-LPR): ${tiempoParaSecuros}`);
            fileName = `nolpr${fechaCompacta}.jpg`;
            console.log(`File Name (No-LPR): ${fileName}`);
            htmlCaption = `
                <b>Acceso Vehículo sin placas.</b>\n\n
                Fecha y hora: ${tiempoParaSecuros}\n
            `;
        }

        // Asegúrate de que tiempoParaSecuros siempre tenga un valor antes de usarlo
        if (typeof tiempoParaSecuros === 'undefined' || tiempoParaSecuros === null) {
             console.error("ERROR: tiempoParaSecuros es undefined/null. Esto no debería pasar.");
             // Puedes lanzar un error o retornar aquí si esto es crítico
             return;
        }

        const importString = `cam$5;time$${tiempoParaSecuros}`; // <--- ¡Uso de la variable renombrada!
        const exportString = `filename$${fileName};dir$${exportDirectory}\\`;

        const imagePath = path.join(exportDirectory, fileName);

        let params = {
            "import": importString,
            "export_engine": "file",
            "export": exportString,
        };

        console.log("Parámetros de exportación:", params);

        try {
            core.doReact("IMAGE_EXPORT", "1", "EXPORT", params);
            console.log(`Solicitud de exportación para ${fileName} enviada.`);

            // --- AGREGAR RETRASO DE 3 SEGUNDOS ---
            console.log(`Esperando 3 segundos antes de intentar enviar la imagen a Telegram...`);
            await new Promise(resolve => setTimeout(resolve, 5000));

            console.log(`Procediendo a enviar por Telegram.`);

            if (!fs.existsSync(imagePath)) {
                throw new Error(`El archivo ${imagePath} no se encontró. Puede que la exportación no se haya completado a tiempo.`);
            }

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
            console.error(`Error en el proceso de exportación o envío para ${fileName}:`, error.message);
            bot.telegram.sendMessage(CHAT_ID, `⚠️ Error al procesar imagen: ${error.message}`).catch(err => console.error("Error al enviar mensaje de error a Telegram:", err));
        }
    });
});

bot.launch().then(() => {
    console.log('Bot de Telegram iniciado');
}).catch(err => {
    console.error('Error al iniciar el bot de Telegram:', err);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));