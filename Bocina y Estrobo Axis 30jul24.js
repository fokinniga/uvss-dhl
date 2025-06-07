let camID, firstName, lastName, timeStamp, camName, similarity, description, toEmail, ccEmail, fromEmail;
let fnInicial = "";
let lnInicial = "";
let descInicial = "";

const moment = require('moment-timezone');
const fs = require('fs');
const securos = require('securos');
const request = require('request');

securos.connect(async (core) => {
    core.registerEventHandler("FACE_X_SERVER", "*", "MATCH", AlertDB);
    core.registerEventHandler("MACRO", "1.1", "RUN", AlertCAM);
    core.registerEventHandler("CAM", "5", "MD_START", AlertCAM);
    core.registerEventHandler("IMAGE_EXPORT", "1", "EXPORT_DONE", Exportado);
    core.registerEventHandler("IMAGE_EXPORT", "1", "EXPORT_FAILED", NoExportado);
    core.registerEventHandler("MAIL_MESSAGE", "*", "SENT", Enviado);
    core.registerEventHandler("MAIL_MESSAGE", "*", "SEND_ERROR", NoEnviado);

    async function AlertDB(e) {
        //console.log(e);

        //let data = JSON.parse(e.params.comment);
        //console.log("Datos del evento:",data);

        /*if(data.list.name=="Lista Negra")
        {
            let coord = data.visualization;
            console.log("Coordenadas:",coord);

            let faceID = data.id;
            console.log("FaceID:",faceID);

            let faceImage = "http://127.0.0.1:21093" + data.detection._links.detection_image;
            console.log("LinkFace:",faceImage);
            GetFXImage(faceImage,"Face_Recognized");

            faceImage = "http://127.0.0.1:21093" + data.matched_person_face_image._links.source;
            console.log("LinkFace:",faceImage);
            GetFXImage(faceImage,"Matched_Face");

            camID = data.cam_id;
            console.log(camID);

            firstName = data.person.first_name;
            console.log(firstName);

            lastName = data.person.last_name;
            console.log(lastName);

            timeStamp = data.timestamp;
            console.log(timeStamp);
            let timeLocal = moment(timeStamp);
            const zonaHoraria = 'America/Mexico_City'
            timeStamp = timeLocal.tz(zonaHoraria);
            console.log(timeStamp.format('YYYY-MM-DD HH:mm:ss.SSS'));

            camName = (await core.getObject("CAM",camID)).name;
            console.log(camName);

            similarity = Math.trunc((data.similarity)*100);
            console.log(similarity);

            description = data.person.notes;
            console.log(description);

            dataEmail = await core.getObject("MAIL_MESSAGE","1");
            toEmail = dataEmail.params.to;
            console.log(toEmail);
            ccEmail = dataEmail.params.cc;
            console.log(ccEmail);
            fromEmail = dataEmail.params.from;
            console.log(fromEmail);

            let camTime = `cam\$${camID};time\$${timeStamp.format('YYYY-MM-DD HH:mm:ss.SSS')}`;
            console.log(camTime);

            let rect = `color:red;${coord}`;

            let dataExport =
            {
                "import":camTime,
                "export_engine":"file",
                "export":"filename$FullImage.jpg;dir$C:/FaceX",
                "process":rect
            }
            console.log(dataExport);
            core.doReact("IMAGE_EXPORT","1","EXPORT",dataExport);*/

        const auth =
        {
            username: 'iss',
            password: 'Issivs.1234'
        };

        //urlSpeaker = "http://172.16.20.148/axis-cgi/playclip.cgi?clip=0&audiooutput=1";
        //Reproducir('GET', urlSpeaker, 'digest', auth);
        reproducirAudio("root", "Itd0m24$");

        const dataStrobo =
        {
            "apiVersion": "1.0",
            "method": "start",
            "params":
            {
                "profile": "alarma"
            }
        }
        urlStrobo = "http://172.16.20.146/axis-cgi/siren_and_light.cgi";
        //Reproducir('POST', urlStrobo, 'digest', auth, dataStrobo);
        //}
        reproducirAlarmaEstrobo("root", "Itd0m24$");
    }

    function reproducirAlarmaEstrobo(username, password) {
        // const request = require('request');

        var options = {
            uri: 'http://172.16.20.146/axis-cgi/siren_and_light.cgi',
            auth: {
                user: username,
                pass: password,
                sendImmediately: false
            },
            method: 'POST',
            json: {
                "apiVersion": "1.0",
                "method": "start",
                "params": {
                    "profile": "alarma"
                }
            }

        };
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log('body : ' + body)
            }
            else {
                console.log('Code : ' + response.statusCode)
                console.log('error : ' + error)
                console.log('body : ' + body)
            }
        });
    }

    
    async function AlertCAM(e) {
        

        const auth =
        {
            username: 'iss',
            password: 'Issivs.1234'
        };

        
        reproducirAudioCAM("root", "Itd0m24$");

        const dataStrobo =
        {
            "apiVersion": "1.0",
            "method": "start",
            "params":
            {
                "profile": "alarma"
            }
        }
        urlStrobo = "http://172.16.20.146/axis-cgi/siren_and_light.cgi";
        //Reproducir('POST', urlStrobo, 'digest', auth, dataStrobo);
        //}
        reproducirAlarmaEstrobo("root", "Itd0m24$");
    }

    function reproducirAlarmaEstrobo(username, password) {
        // const request = require('request');

        var options = {
            uri: 'http://172.16.20.146/axis-cgi/siren_and_light.cgi',
            auth: {
                user: username,
                pass: password,
                sendImmediately: false
            },
            method: 'POST',
            json: {
                "apiVersion": "1.0",
                "method": "start",
                "params": {
                    "profile": "alarma"
                }
            }

        };
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log('body : ' + body)
            }
            else {
                console.log('Code : ' + response.statusCode)
                console.log('error : ' + error)
                console.log('body : ' + body)
            }
        });
    }

    function reproducirAudioCAM(username, password) {
        // const request = require('request');

        var options = {
            uri: 'http://172.16.20.148/axis-cgi/playclip.cgi?clip=0&audiooutput=1',
            auth: {
                user: username,
                pass: password,
                sendImmediately: false
            }
        };
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log('body : ' + body)
            }
            else {
                console.log('Code : ' + response.statusCode)
                console.log('error : ' + error)
                console.log('body : ' + body)
            }
        });
    }

    function reproducirAudio(username, password) {
        // const request = require('request');

        var options = {
            uri: 'http://172.16.20.148/axis-cgi/playclip.cgi?clip=1&audiooutput=1',
            auth: {
                user: username,
                pass: password,
                sendImmediately: false
            }
        };
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                console.log('body : ' + body)
            }
            else {
                console.log('Code : ' + response.statusCode)
                console.log('error : ' + error)
                console.log('body : ' + body)
            }
        });
    }


    async function Reproducir(method, url, authType, auth, data = null) {

        const options =
        {
            url: url,
            method: method,
            json: true,
            headers:
            {
                'Content-Type': 'application/json'
            }
        };
        console.log(options);

        if (method === 'POST' && data) {
            options.body = data;
        }

        if (authType === 'digest') {
            console.log("Digest authentication");
            const requestDigest = new RequestDigest(auth.username, auth.password);
            console.log(requestDigest);

            requestDigest.request(options, function (error, response, body) {
                if (error) {
                    console.error('Error:', error);
                }
                else {
                    console.log('Status Code:', response.statusCode);
                    console.log('Response Body:', body);
                }
            });
        }
        else if (authType === 'basic') {
            console.log("Basic authentication");
            options.auth =
            {
                user: auth.username,
                pass: auth.password
            };
            console.log(auth);

            request(options, function (error, response, body) {
                if (error) {
                    console.error('Error:', error);
                }
                else {
                    console.log('Status Code:', response.statusCode);
                    console.log('Response Body:', body);
                }
            });
        }
        else {
            console.error('Tipo de autenticación no soportado');
        }


        /*request.get({
            url: url,
            auth:
            {
                user: "root",
                pass: "Itd0m24$",
                sendImmediately: true // Enviar las credenciales inmediatamente
            },
            encoding: null
        }, (err, httpResponse, body) => {
            if(!err && httpResponse.statusCode === 200)
            {
                fs.writeFileSync(`C:/FaceX/${filename}.jpg`,body);
                console.log("Se creó la imagen correctamente");
            }
            else
            {
                console.error('Error al descargar la imagen:', err || `Código de estado: ${httpResponse.statusCode}`);
            }
        });*/
    }

    async function GetFXImage(url, filename) {
        request.get({
            url: url,

            encoding: null
        }, (err, httpResponse, body) => {
            if (!err && httpResponse.statusCode === 200) {
                fs.writeFileSync(`C:/FaceX/${filename}.jpg`, body);
                console.log("Se creó la imagen correctamente");
            }
            else {
                console.error('Error al descargar la imagen:', err || `Código de estado: ${httpResponse.statusCode}`);
            }
        });
    }

    async function Exportado(e) {
        console.log("Imagen exportada correctamente:");
        if (firstName != fnInicial && lastName != lnInicial && description != descInicial) {
            let body = `Rostro Reconocido en Lista Negra!\nCámara: ${camName}\nNombre: ${firstName} ${lastName}\nFecha y Hora: ${timeStamp.format('YYYY-MM-DD HH:mm:ss.SSS')}\nSimilitud: ${similarity} %\nComentario: ${description}`;
            let paramsEmail =
            {
                'to': toEmail,
                'cc': ccEmail,
                'from': fromEmail,
                'subject': "Rostro en Lista Negra!",
                'body': body,
                'attachments': "C:/FaceX/Face_Recognized.jpg,C:/FaceX/Matched_Face.jpg,C:/FaceX/FullImage.jpg"
            }
            console.log(paramsEmail);

            core.doReact("MAIL_MESSAGE", "1", "SETUP", paramsEmail);
            core.doReact("MAIL_MESSAGE", "1", "SEND");
        }
        fnInicial = firstName;
        lnInicial = lastName;
        descInicial = description;
    }

    async function NoExportado(e) {
        console.log("No se pudo exportar la imagen:");
    }

    async function Enviado(e) {
        console.log("Correo enviado correctamente");
    }

    async function NoEnviado(e) {
        console.log("No se pudo enviar el correo");
    }
});