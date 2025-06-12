const sos = require('securos'); 

const fff = "2025-06-11T09:16:00.151-06:00";

function datedate(fechaOriginal) {

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


sos.connect(async function(core)
{
    console.clear
    console.log("Securos conectado")
            const fechaExp = datedate(fff)
            const fechaFIle = fechaExp.replace(/[- :.]/g, '');
            const fileImport = `cam$5;time$${fechaExp}`
            const fileExport = `filename$${fechaFIle};dir$C:\\export\\`
            let params = {
                        "import": fileImport,
                        "export_engine":"file",
                        "export":fileExport,
                        };
             
            console.log(params) 
             
            setTimeout(() => {
                console.log("Han pasado 3 segundos");
                console.log("----Start")
                core.doReact("IMAGE_EXPORT", "1", "EXPORT", params);
                console.log("----End")
            }, 3000); // 3000 milisegundos = 3 segundos

            console.log("Este mensaje se muestra antes del delay");
            //console.log(typeof(params))
             
        });