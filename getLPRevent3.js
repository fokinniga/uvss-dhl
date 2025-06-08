const sos = require('securos'); 

function habilitarCam(grabberId){
        console.log("el botón es: " + grabberId)
        let grayID = core.getObject('GRAY', 1);
        console.log(grayID)
    }

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
            console.log(e)
            console.log(`Time/date: ${e.params.best_view_date_time}`)
            const formatDate = formatDateTimeString(e.params.best_view_date_time)
            console.log(`Format Date:  ${formatDate}`)

            const importdate = `cam\$1;time\$${formatDate}`
            console.log(importdate)
            //let rect = `color:red;${coord}`;
            let params = {
                        "import":importdate,
                        "export_engine":"file",
                        "export":"filename$oscartest.jpg;dir$C:\\export\\",
                        };
            //let params = '"import","' + importdate + '","export_engine","file","export","filename$oscartest";dir$C:\\export"'   
            console.log(params)
            //console.log(typeof(params))
            console.log("----")
            core.doReact("IMAGE_EXPORT", "1", "EXPORT", params);
        }
        
    });
    async function NoExportado(e) {
        console.log("No se pudo exportar la imagen:");
    }
});