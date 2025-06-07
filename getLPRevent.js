const sos = require('securos'); 

function habilitarCam(grabberId){
        console.log("el botón es: " + grabberId)
        let grayID = core.getObject('GRAY', 1);
        console.log(grayID)
    }

sos.connect(async function(core)
{
    console.clear
    console.log("Securos conectado")
    core.registerEventHandler("LPR_CAM", "*", "*", async (e) => //Se debe usar el id del macro que va a servir de trigger.
    {
        
        console.log(e)
        
    });
    
});