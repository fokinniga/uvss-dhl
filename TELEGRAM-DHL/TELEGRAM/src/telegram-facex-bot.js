const PORT = 3008;
const BOT_TOKEN = '7612145224:AAF6HVJjCdzDJsXw4NW3-rkfP7enSxLpRWQ';
const URL_BASE = 'http://localhost:21093';
const REST_API_URL_BASE = 'http://telegram:telegram@localhost:8888';

const securos = require('securos');

// importamos las librerías requeridas
const axios = require('axios');
const FormData = require('form-data');
const express = require('express');
const cors = require('cors');
const app = express();

// Bibliotecas de nodejs
const http = require('http');
const https = require('https');
const url = require('url');

const path = require("path");
const server = require('http').Server(app);

app.set("port", PORT);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "./public")));

server.listen(app.get('port'), () => {
  console.log('Servidor iniciado en el puerto: ' + app.get('port'));
});

securos.connect(async (core) => {
  const { Telegraf } = require('telegraf');
  const bot = new Telegraf(BOT_TOKEN);

  bot.start(async (ctx) => {
    ctx.reply('Bienvenido al Bot de reconocimiento facial de SecurOS FaceX.' +
      ' Envíe la foto de un rostro.');
  });

  bot.on("message", async (ctx) => {
    // console.log(ctx);
    // console.log(ctx.message.contact);
    const securOSUser = await validateUser(ctx.from.username);
    if (securOSUser.error) {
      console.error(securOSUser);
      await ctx.reply(securOSUser.error);
      return;
    }

    if (!ctx.message.photo) {
      console.error('Favor de subir únicamente fotografías.', ctx.message);
      await ctx.reply('Favor de subir únicamente fotografías.');
      return;
    }

    try {
      await ctx.reply('Procesando imagen...');
      await ctx.replyWithChatAction('typing');
      const urlFile = await getPhotoUrl(ctx.message.photo);

      let session = await createImportSession();
      core.sendEvent("HTML5_FORM", "*", "TELEGRAM_FACEX_INIT_CARD", {
        importSessionId: session.id,
        telegramUrlFile: urlFile,
        telegramUser: `@${securOSUser.name}`,
        telegramDate: ctx.message.date,
        type: 'init'
      });

      const formData = await createFormData(ctx, urlFile);

      const addImageResponse = await addImageToSession(session.id, formData);
      if (addImageResponse.status !== 201) {
        console.error(addImageResponse.body);
        await ctx.reply('Error interno.');
        return;
      }
      const processImageResponse = await processImageOnSession(session.id);
      if (processImageResponse.status !== 202) {
        console.error(processImageResponse.body);
        await ctx.reply('Error procesando la imagen.');
        return;
      }

      let state = "queued";
      let responseProcess;
      while (state === "queued" || state === "processing") {
        responseProcess = await resultProcess(session.id);
        state = responseProcess.state;
        await sleep(1000);
      }

      const items = responseProcess.items;

      for (let idx in items) {
        const item = items[idx];
        const faces = item.faces;

        for (let jdx in faces) {
          const face = faces[jdx];
          const faceMatches = face['face_matches'];

          if (faceMatches.length === 0) {
            core.sendEvent("HTML5_FORM", "*", "TELEGRAM_FACEX_RESULT_CARD", {
              importSessionId: session.id,
              listType: 'unknown',
              type: 'empty-result'
            });
            await ctx.reply('Procesamiento finalizado. No se encontraron coincidencias.');
            return;
          }

          for (let kdx in faceMatches) {
            const faceMatch = faceMatches[kdx];
            const personMatch = faceMatch['person']['_links']['_self'];
            const faceImage = faceMatch['matched_person_face_image']['_links']['source'];
            const personFound = await httpGet(`${URL_BASE}${personMatch}`);

            let personData =
              (personFound.first_name || '')
              + " " + (personFound.middle_name || '')
              + " " + (personFound.last_name || '');

            let listData = personFound.lists[0].name;
            let listIcon = personFound.lists[0].priority === 0
              ? '🟥'
              : personFound.lists[0].priority === 1
                ? '🟦'
                : '✅';
            let listType = personFound.lists[0].priority === 0
              ? 'deny'
              : personFound.lists[0].priority === 1
                ? 'info'
                : 'allow';

            core.sendEvent("HTML5_FORM", "*", "TELEGRAM_FACEX_RESULT_CARD", {
              importSessionId: session.id,
              personName: personData,
              listData: listData,
              securosFaceSrc: `${URL_BASE}${faceImage} `,
              listType: listType,
              type: 'result'
            });

            // ctx.replyWithPhoto({ url: `${ URL_BASE }${ faceImage } ` }, { caption: "Coincidencia encontrada" + '\n' + JSON.stringify(personFound) });
            await ctx.replyWithPhoto({
              source: await getStreamFromUrlHttp(`${URL_BASE}${faceImage} `)
            }, {
              caption: "Coincidencia encontrada"
                + '\n👤 ' + personData
                + '\n' + listIcon + ' ' + listData
            });
            await ctx.reply('Procesamiento finalizado.');
            return;
          }
        }
      }

      core.sendEvent("HTML5_FORM", "*", "TELEGRAM_FACEX_RESULT_CARD", {
        importSessionId: session.id,
        listType: 'unknown',
        type: 'empty-result'
      });
      await ctx.reply('Procesamiento finalizado. No se encontraron coincidencias.');
    } catch (err) {
      console.error(err);
      await ctx.reply('Hubo un error, favor de notificar al administrador del sistema.');
    }
  });

  bot.launch();

});

async function validateUser(username) {
  const securOSUser = await findTelegramUser(username);

  if (securOSUser.length === 0) {
    // await ctx.reply('Esta cuenta de Telegram no está registrada para usar el bot de reconocimiento facial.');
    return {
      error: 'Esta cuenta de Telegram no está registrada para usar el bot de reconocimiento facial.'
    };
  }

  let queryData = url.parse(`?${securOSUser[0].comment.replace(/\n/gi, '&')}`, true).query;
  // console.log(queryData);

  if (!securOSUser[0].comment
    || !queryData['TELEGRAM_BOT_MESSAGES']
    || queryData['TELEGRAM_BOT_MESSAGES'].trim().toLowerCase() === 'false') {
    // await ctx.reply('Esta cuenta de Telegram no tiene permisos para enviar y recibir mensajes del bot de reconocimiento facial.');
    return {
      error: 'Esta cuenta de Telegram no tiene permisos para enviar y recibir mensajes del bot de reconocimiento facial.'
    };
  }

  return securOSUser[0];
}

async function getPhotoUrl(telegramPhoto) {
  // obtiene foto

  // para obtener la foto se debe se debe consultar los siguientes URL 
  // utilizar el file_id del resultado del json ctx.message.photo y meterlo en la url: 
  // https://api.telegram.org/bot5223428242:AAF4fS0ZM1GRtmNTIfkyf6yeCMUPBNCck-Q/getFile?file_id=AgACAgEAAxkBAAMGYl90JcltMLSJ0d3sRGqHnKgT8Q8AAheqMRvYAAH5RkX8VY3edXIiAQADAgADeAADJAQ
  // como respuesta el file_id indicara el nombre del archivo guardado en los servidores de telegram de forma temporal
  // Para descargar utilizar el siguiente URL
  // https://api.telegram.org/file/bot5223428242:AAF4fS0ZM1GRtmNTIfkyf6yeCMUPBNCck-Q/photos/file_0.jpg   donde filce_0 corresponde al nombre de la image que se utiliza para realizar el analitico.

  const fileId = telegramPhoto[telegramPhoto.length - 1].file_id;
  const urlFiles = `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`;
  const files = await httpGet(urlFiles);
  // console.log(response);
  // console.log(files);
  const filePath = files.result.file_path;
  const urlFile = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
  // console.log(urlFile);

  return urlFile;
}
async function findTelegramUser(telegramUser) {
  const persons = await httpGet(REST_API_URL_BASE + '/api/v1/persons')
  const res = persons.data.filter(p => {
    return p.name === telegramUser;
  });

  return res;
}

function createImportSession() {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.post(`${URL_BASE}/v1/spotter/import/session`);
      resolve(response.data);
    } catch (err) {
      console.error(err);
      reject(err);
    }
  });
}

async function createFormData(ctx, urlFile) {
  const form = new FormData();
  form.append('data',
    JSON.stringify({
      "source": ctx.from.username,
      "first_name": ctx.from.first_name,
      "last_name": "Telegram"
    }),
    {
      contentType: 'application/json'
    }
  );
  form.append('image',
    // fs.createReadStream('C:/Users/osval/Downloads/cristian.jpg'),
    await getStreamFromUrl(urlFile),
    {
      filename: 'image.jpg',
      contentType: 'image/jpeg'
    }
  );

  return form;
}

function addImageToSession(sessionId, form) {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios
        .post(`${URL_BASE}/v1/spotter/import/session/${sessionId}?action=add_image`, form, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      // console.log(response);
      // console.log(response.status);
      resolve(response);
    } catch (err) {
      console.error(err);
      reject(err);
    }
  });
}

function processImageOnSession(sessionId) {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios
        .post(`${URL_BASE}/v1/spotter/import/session/${sessionId}?action=process`);
      resolve(response);
    } catch (err) {
      console.error(err);
      reject(err);
    }

  });
}

function resultProcess(sessionId) {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await httpGet(`${URL_BASE}/v1/spotter/import/session/${sessionId}`);
      resolve(response);
    } catch (err) {
      console.error(err);
      reject(err);
    }
  });
}

function httpGet(url) {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.get(url);
      resolve(response.data);
    } catch (err) {
      console.error(err);
      reject(err);
    }
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