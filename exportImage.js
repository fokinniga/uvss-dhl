const sos = require('securos'); 

sos.connect(async function(core)
{
    console.clear
    console.log("Securos conectado")
    
        
            
            let params = {
                        "import": "cam$5;time$live",
                        "export_engine":"file",
                        "export":"filename$oscartest;dir$C:\\export\\",
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