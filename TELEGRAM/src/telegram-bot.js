const BOT_TOKEN = '5223428242:AAF4fS0ZM1GRtmNTIfkyf6yeCMUPBNCck-Q';
const URL_BASE = 'http://localhost:21093';
const REST_API_URL_BASE = 'http://telegram:telegram@localhost:8898';

const { TLSSocket } = require('tls');

// Set the maximum listeners limit for TLSSocket to 20
TLSSocket.defaultMaxListeners = 20;

const request = require('request');
// const fs = require('fs');
const http = require('http');
const https = require('https');
const url = require('url');

const { Telegraf } = require('telegraf');
const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply('Bienvenido al Bot de reconocimiento facial de SecurOS FaceX. Envíe la foto de un rostro.');
});

bot.on("message", async (ctx) => {
  try {
    // console.log(ctx);
    // console.log(ctx.message.contact);
    console.log('findTelegramUser');
    const securOSUser = await findTelegramUser(ctx.from.username);

    if (securOSUser.length === 0) {
      console.log('reply 26');
      await ctx.reply('Esta cuenta de Telegram no está registrada para usar el bot de reconocimiento facial.');
      return;
    }

    let queryData = url.parse(`?${securOSUser[0].comment.replace('\n', '&')}`, true).query;
    // console.log(queryData);

    if (!securOSUser[0].comment || !queryData['TELEGRAM_BOT_MESSAGES'] || queryData['TELEGRAM_BOT_MESSAGES'].trim().toLowerCase() === 'false') {
      console.log('reply 35');
      await ctx.reply('Esta cuenta de Telegram no tiene permisos para enviar y recibir mensajes del bot de reconocimiento facial.');
      return;
    }

    if (ctx.message.photo) {
      console.log('reply 41');
      await ctx.reply('Procesando imagen...');
      console.log('reply 43');
      await ctx.replyWithChatAction('typing');
      const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
      const urlFiles = `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`;
      // console.log(urlFiles);
      request(urlFiles, function (error, response, body) {
        const files = JSON.parse(body);
        console.log(files);
        const filePath = files.result.file_path;
        const urlFile = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
        console.log(urlFile);

        createImportSession()
          .then(async (session) => {
            console.log('createFormData');
            const formData = await createFormData(ctx, urlFile);

            console.log('addImageToSession');
            const addImageResponse = await addImageToSession(session.id, formData);
            if (addImageResponse.statusCode !== 201) {
              console.log(addImageResponse ? addImageResponse.body : 'Sin datos del error addImageResponse()');
              console.log('reply 64');
              await ctx.reply('Error interno.');
              return;
            }
            console.log('reply 68');
            const processImageResponse = await processImageOnSession(session.id);
            if (processImageResponse.statusCode !== 202) {
              console.log(processImageResponse ? processImageResponse.body : 'Sin datos del error processImageOnSession()');
              console.log('reply 72');
              await ctx.reply('Error procesando la imagen.');
              return;
            }

            let state = "queued";
            let responseProcess;
            while (state === "queued" || state === "processing") {
              console.log('resultProcess');
              responseProcess = await resultProcess(session.id);
              //console.log(responseProcess, responseProcess.state);
              state = responseProcess.state;
              console.log('sleep');
              await sleep(1000);
            }

            if (state === "completed") {
              const items = responseProcess.items;
              // console.log(items)
              if (items && items.length > 0) {
                for (let idx in items) {
                  const item = items[idx];
                  const faces = item.faces;
                  if (faces && faces.length > 0) {
                    for (let jdx in faces) {
                      const face = faces[jdx];
                      const faceMatches = face['face_matches'];
                      if (faceMatches && faceMatches.length > 0) {
                        for (let kdx in faceMatches) {
                          const faceMatch = faceMatches[kdx];
                          const personMatch = faceMatch['person']['_links']['_self'];
                          const faceImage = faceMatch['matched_person_face_image']['_links']['source'];
                          console.log('httpGet 104');
                          const personFound = await httpGet(`${URL_BASE}${personMatch}`);

                          let personData = `👤 ${personFound.first_name || ''} ${personFound.middle_name || ''} ${personFound.last_name || ''}`;
                          let listData = `${personFound.lists.reduce((previousValue, currentValue) => {
                            let priority = currentValue.priority === 0 ? `🟥` : currentValue.priority === 1 ? `🟦` : `✅`;
                            return previousValue + `${priority} - ${currentValue.name}` + '\n';
                          }, '\n')}`;

                          // ctx.replyWithPhoto({ url: `${URL_BASE}${faceImage}` }, { caption: "Coincidencia encontrada" + '\n' + JSON.stringify(personFound) });
                          console.log('replyWithPhoto 114');
                          await ctx.replyWithPhoto({
                            source: await getStreamFromUrlHttp(`${URL_BASE}${faceImage}`)
                          }, {
                            caption: "Coincidencia encontrada" + '\n' + personData + listData
                          });
                        }
                        console.log('replyWithPhoto 121');
                        await ctx.reply('Procesamiento finalizado.');
                        return;
                      }
                    }
                  }
                }
              }
              console.log('replyWithPhoto 129');
              await ctx.reply('Procesamiento finalizado. No se encontraron coincidencias.');
            }
          }).catch(async (err) => {
            console.error(err);
            console.error('reply 134');
            await ctx.reply('Hubo un error, favor de notificar al administrador del sistema.');
          });
      });
    } else {
      console.log('reply 139');
      await ctx.reply('Favor de subir unicamente fotografías.');
    }
  } catch (e) {
    console.error(e);
  }
});  // obtiene foto

// para obtener la foto se debe se debe consultar los siguientes URL 
// utilizar el file_id del resultado del json ctx.message.photo y meterlo en la url: 
// https://api.telegram.org/bot5223428242:AAF4fS0ZM1GRtmNTIfkyf6yeCMUPBNCck-Q/getFile?file_id=AgACAgEAAxkBAAMGYl90JcltMLSJ0d3sRGqHnKgT8Q8AAheqMRvYAAH5RkX8VY3edXIiAQADAgADeAADJAQ
// como respuesta el file_id indicara el nombre del archivo guardado en los servidores de telegram de forma temporal
// Para descargar utilizar el siguiente URL
// https://api.telegram.org/file/bot5223428242:AAF4fS0ZM1GRtmNTIfkyf6yeCMUPBNCck-Q/photos/file_0.jpg   donde filce_0 corresponde al nombre de la image que se utiliza para realizar el analitico.

bot.launch().catch((error) => {
  console.error(error);
  console.error(error.code);  // => 'ETELEGRAM'
  console.error(error.response); // => { ok: false, error_code: 400, description: 'Bad Request: chat not found' }
})

function findTelegramUser(telegramUser) {
  return new Promise((resolve, reject) => {
    httpGet(REST_API_URL_BASE + '/api/v1/persons')
      .then(async (persons) => {
        const res = persons.data.filter(p => {
          return p.name === telegramUser;
        });

        resolve(res);
      })
      .catch(ex => {
        console.error(ex);
        reject(ex);
      });
  });
}

function createImportSession() {
  return new Promise((resolve, reject) => {
    request.post(`${URL_BASE}/v1/spotter/import/session`, (err, httpResponse, body) => {
      if (err) return reject(err);
      console.log(httpResponse.statusCode, body, JSON.parse(body).id);
      resolve(JSON.parse(body));
    });
  });
}

async function createFormData(ctx, urlFile) {
  const formData = {
    data: {
      value: JSON.stringify({
        "source": ctx.from.username,
        "first_name": ctx.from.first_name,
        "last_name": "Telegram"
      }),
      options: {
        contentType: 'application/json'
      }
    },
    image: {
      // value: fs.createReadStream('C:/Users/osval/Downloads/cristian.jpg'),
      value: await getStreamFromUrl(urlFile),
      options: {
        filename: 'image.jpg',
        contentType: 'image/jpeg'
      }
    }
  }
  return formData;
}

function addImageToSession(sessionId, formData) {
  return new Promise((resolve, reject) => {
    request.post({
      url: `${URL_BASE}/v1/spotter/import/session/${sessionId}?action=add_image`,
      headers: {
        "Content-Type": "multipart/form-data"
      },
      formData
    }, (err, httpResponse, body) => {
      if (err) reject(err);
      // console.log(httpResponse.statusCode, body, JSON.parse(body).id);
      resolve(httpResponse);
    });
  });
}

function processImageOnSession(sessionId) {
  return new Promise((resolve, reject) => {
    request.post(`${URL_BASE}/v1/spotter/import/session/${sessionId}?action=process`, (err, httpResponse, body) => {
      if (err) reject(err);
      // console.log(httpResponse.statusCode, body);
      resolve(httpResponse);
    });
  });
}

function resultProcess(sessionId) {
  return new Promise((resolve, reject) => {
    request(`${URL_BASE}/v1/spotter/import/session/${sessionId}`, (err, httpResponse, body) => {
      if (err) reject(err);
      // console.log(httpResponse.statusCode, body);
      resolve(JSON.parse(body));
    })
  });
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    request(url, (err, httpResponse, body) => {
      if (err) reject(err);
      // console.log(httpResponse.statusCode, body);
      resolve(JSON.parse(body));
    })
  });
}

function getStreamFromUrlHttp(url) {
  return new Promise((resolve, reject) => {
    try {
      http.get(url, (stream) => {
        resolve(stream);
      });
    } catch (ex) {
      console.error(ex);
      reject(ex);
    }
  });
}

function getStreamFromUrl(url) {
  return new Promise((resolve, reject) => {
    try {
      https.get(url, (stream) => {
        resolve(stream);
      });
    } catch (ex) {
      console.error(ex);
      reject(ex);
    }
  });
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}