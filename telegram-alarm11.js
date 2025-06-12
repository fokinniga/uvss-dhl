const sos = require("securos");
const { Telegraf } = require("telegraf");
const fs = require("fs");
const path = require("path");
const eventNum = 0

// --- Configuración (Considera usar variables de entorno para producción) ---
const BOT_TOKEN = "7612145224:AAF6HVJjCdzDJsXw4NW3-rkfP7enSxLpRWQ";
const CHAT_ID = "-4664148513";

const bot = new Telegraf(BOT_TOKEN);

function formatNumberWithTemplate(number, templateName) {
    console.log(`Input: number="${number}", templateName="${templateName}"`);

    // Extraer la parte del formato del template (ej. "2L-2D-3D")
    const formatoPuro = templateName.split('_')[1]; // Tomará "2L-2D-3D"

    if (!formatoPuro) {
        console.warn("Template name no contiene un formato válido después del '_'. Retornando el número original.");
        return number;
    }

    // Parsear el formato para obtener las longitudes y tipos
    // Esto resultará en algo como: [{tipo: 'L', longitud: 2}, {tipo: 'D', longitud: 2}, {tipo: 'D', longitud: 3}]
    const partesFormato = formatoPuro.split('-').map(parte => {
        const longitud = parseInt(parte.slice(0, -1), 10);
        const tipo = parte.slice(-1); // 'L' para letra, 'D' para dígito
        return { tipo, longitud };
    });

    let formattedNumber = '';
    let currentNumberIndex = 0;

    for (let i = 0; i < partesFormato.length; i++) {
        const parte = partesFormato[i];
        const longitudDeseada = parte.longitud;

        // Extraer la subcadena del número original
        const subcadena = number.substring(currentNumberIndex, currentNumberIndex + longitudDeseada);

        // Añadir la subcadena al resultado
        formattedNumber += subcadena;

        // Si no es la última parte, añadir un guion
        if (i < partesFormato.length - 1) {
            formattedNumber += '-';
        }

        // Mover el índice para la próxima parte
        currentNumberIndex += longitudDeseada;
    }

    console.log(`Output: ${formattedNumber}`);
    return formattedNumber;
}


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
    //console.log("Fecha original (nolprdate):", fechaOriginal);
    //console.log("Fecha formateada (nolprdate):", fechaFormateada);
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

         console.log("Archivo exportado con éxito.");
    });

    core.registerEventHandler("LPR_CAM", "*", "*", async (e) => {
        eventNum ++
        console.log(`evento: ${eventNum}`)
        console.log(`\n--- Evento LPR_CAM: ${e.action} ---`);

        console.log(e)
        let fileName;
        let htmlCaption;
        const exportDirectory = "C:\\export";
        let tiempoParaSecuros; !

        if (e.action === "CAR_LP_RECOGNIZED") {
            console.log("LPR_EVENT")
            const plate = formatNumberWithTemplate(e.params.number, e.params.template_name)
            const formattedDate = formatDateTimeString(e.params.best_view_date_time);
            tiempoParaSecuros = formatDateTime2export(e.params.best_view_date_time) 
            fileName = `lpr${formattedDate}.jpg`;
            htmlCaption = `
                <b>Acceso Vehículo con placas.</b>\n\n
                Fecha y hora: ${e.params.best_view_date_time}\n
                Placa: <b>${e.params.number || 'N/A'}</b>
                Placa formato: <b>${plate}</b>
            `;
        } else {
            console.log("Else (No CAR_LP_RECOGNIZED):");
            tiempoParaSecuros = nolprdate(e.params.time_iso);
            const fechaCompacta = tiempoParaSecuros.replace(/[- :.]/g, '');
            fileName = `nolpr${fechaCompacta}.jpg`;
            console.log(`File Name (No-LPR): ${fileName}`);
            htmlCaption = `
                <b>Acceso Vehículo sin placas.</b>\n\n
                Fecha y hora: ${tiempoParaSecuros}\n
            `;
        }

        if (typeof tiempoParaSecuros === 'undefined' || tiempoParaSecuros === null) {
             console.error("ERROR: tiempoParaSecuros es undefined/null. Esto no debería pasar.");
             // Puedes lanzar un error o retornar aquí si esto es crítico
             return;
        }

        const importString = `cam$5;time$${tiempoParaSecuros}`; 
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