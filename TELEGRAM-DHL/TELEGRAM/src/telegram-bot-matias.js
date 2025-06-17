const PORT = 3008;
const BOT_TOKEN = 'type_your_token';
const URL_BASE = 'http://localhost:21093';
const REST_API_URL_BASE = 'http://telegram:telegram@localhost:8888';
const LPR_URL_BASE = 'http://localhost:8899';

const securos = require('securos');

// importamos las librerías requeridas
const axios = require('axios');
const FormData = require('form-data');
const express = require('express');
const cors = require('cors');
const { Client } = require('pg');
const app = express();

//SecurOS DB Connection
const connectionSecurOS = {
  user: 'postgres',
  host: '127.0.0.1',
  database: 'protocol',
  password: 'postgres',
  port: 5432,
};

const securos_db = new Client(connectionSecurOS);

//SecurOS Auto Connection
const connectionAuto = {
  user: 'postgres',
  host: '127.0.0.1',
  database: 'auto',
  password: 'postgres',
  port: 5432,
};

const auto_query = 'SELECT lpr_name AS "Camera", plate_recognized AS "License", time_best as "DateTime" FROM tobackup.t_log order by tid desc offset 0 limit 5';

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
  console.log('Server Started at port: ' + app.get('port'));
});

securos.connect(async (core) => {
  const { Telegraf } = require('telegraf');
  const bot = new Telegraf(BOT_TOKEN);

  bot.start(async (ctx) => {
    ctx.reply('Welcome to SecurOS Bot, click on Menu to see all options: ');
    ctx.reply('/Menu');

  });

  ////// Main Menu
  bot.command('Menu', async (ctx) => {
    await ctx.replyWithChatAction('typing');
    await ctx.reply('LPR Options: ' + '/LPR');
    await ctx.reply('SecurOS Events Options: ' + '/SecurOS_Events');
    await ctx.reply('FaceX Options: ' + '/FaceX');
    await ctx.reply('Traking Kit Options: ' + '/TK');
  });

  /////// Face X Menu
  bot.command('FaceX', async (ctx) => {
    await ctx.reply('Find Face into Watchlist: ' + '/Find_Face');
    await ctx.reply('Get last face recognized: ' + '/Last_Face_Recognized');
    await ctx.reply('Go to Main Menu: ' + '/Menu');
  });

  bot.command('Find_Face', async (ctx) => {
    await ctx.reply('Please send a picture to find a MATCH with our FaceX Recognition Module: ');
  })

  bot.command('Last_Face_Recognized', async (ctx) => {
    await ctx.reply('No Results: 0');
    await ctx.reply('/Menu');
  })

  /////// LPR Menu
  bot.command('LPR', async (ctx) => {
    await ctx.replyWithChatAction('typing');
    await ctx.reply('Get last 5 LPR : ' + '/Last_5_LPR');
    await ctx.reply('Get last 5 Hits : ' + '/Last_5_Hits');
    await ctx.reply('/Menu');
  });

  bot.command('Last_5_Hits', async (ctx) => {
    const hit = new Client(connectionAuto);
    hit.connect();
    hit.query('SELECT t_log.lpr_name AS "Camera", t_log.plate_recognized AS "Plate", t_result.source_name AS "List", t_result.result_comment1 AS "Comment" FROM tobackup.t_log join tobackup.t_result on t_log.tid=t_result.tid order by t_result.tid desc offset 0 limit 5')
      .then(response => {
        const _data_ = response.rows;
        for (var i = 0; i < _data_.length; i++) {
          ctx.reply('📷Camera: ' + _data_[i].Camera + '\n🚗License Plate: ' + _data_[i].Plate + '\n🚩Comment: ' + _data_[i].Comment + '\n🔠Watchlist: ' + _data_[i].List);
        }
        hit.end();
      })
      .catch(err => {
        hit.end();
      })
    ctx.reply('/Menu');
  });

  bot.command('Last_5_LPR', async (ctx) => {
    const auto = new Client(connectionAuto);
    auto.connect()
    auto.query(auto_query)
      .then(response => {
        const _data_ = response.rows;
        if (_data_.length === 0) {
          ctx.reply('Results: 0');
        }
        else {
          for (var i = 0; i < _data_.length; i++) {
            ctx.reply('📷Camera: ' + _data_[i].Camera + '\n🚗License Plate: ' + _data_[i].License + '\n📅Date-Time: ' + _data_[i].DateTime);
          }
        }
        auto.end();

      })
      .catch(err => {
        auto.end();
      })
    ctx.reply('/Menu');
  });


  //////// TK Events: 
  bot.command('TK', async (ctx) => {
    ctx.reply('Get last 5 TK Events: ' + '/Last_5_TK_Events');
    ctx.reply('/Menu');
  });

  bot.command('Last_5_TK_Events', async (ctx) => {
    const tk_event = new Client(connectionSecurOS);
    tk_event.connect()
    tk_event.query('SELECT objtype, action,time_write FROM public.\"PROTOCOL\" where vca_detector IS NOT NULL order by id desc offset 0 limit 5')
      .then(response => {
        const _data_ = response.rows;
        if (_data_.length === 0) {
          ctx.reply('Results: 0');
        }
        else {
          for (var i = 0; i < _data_.length; i++) {
            ctx.reply('🔗Object: ' + _data_[i].objtype + '\n❗Event: ' + _data_[i].action + '\n📅Date-Time: ' + _data_[i].time_write);
          }
        }
        tk_event.end();
      })
      .catch(ex => {
        console.log(ex);
        tk_event.end();
      })
    await ctx.reply('/Menu');
  })


  /////////// SecurOS Events: 

  bot.command('SecurOS_Events', async (ctx) => {
    ctx.reply('Get last 5 Events from SecurOS: ' + '/Last_5_SC_Events');
    ctx.reply('Go to Main Menu: ' + '/Menu');
  });

  bot.command('Last_5_SC_Events', async (ctx) => {
    const sc_event = new Client(connectionSecurOS);
    sc_event.connect()
    sc_event.query('SELECT objtype, action,time_write FROM public.\"PROTOCOL\" order by id desc offset 0 limit 5')
      .then(response => {
        const _data_ = response.rows;
        for (var i = 0; i < _data_.length; i++) {
          ctx.reply('🔗Object: ' + _data_[i].objtype + '\n❗Event: ' + _data_[i].action + '\n📅Date-Time: ' + _data_[i].time_write);
        }
        sc_event.end();

      })
      .catch(err => {
        console.log(err);
        sc_event.end();
      })
    ctx.reply('Go to Main Menu: ' + '/Menu');
  })

  bot.on('sticker', (ctx) => ctx.reply('👍'));
  bot.on('animation', (ctx) => ctx.reply('👍'));
  bot.on('emoji', (ctx) => ctx.reply('👍'));
  bot.hears('hi', (ctx) => ctx.reply('Hey there'));
  bot.hears('Hi', (ctx) => ctx.reply('Hey there'));

  bot.on("message", async (ctx) => {
    console.log(ctx);
    // console.log(ctx.message.contact);
    const securOSUser = await validateUser(ctx.from.username);
    if (securOSUser.error) {
      console.error(securOSUser);
      await ctx.reply(securOSUser.error);
      return;
    }

    if (!ctx.message.photo) {
      console.error('Please upload just photo files.', ctx.message);
      await ctx.reply('Option not recognized');
      await ctx.reply('/Menu'); //reply 
      return;
    }

    try {
      await ctx.reply('Processing Image...');
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
        await ctx.reply('Internal error, please try again.');
        return;
      }
      const processImageResponse = await processImageOnSession(session.id);
      if (processImageResponse.status !== 202) {
        console.error(processImageResponse.body);
        await ctx.reply('Error processing image.');
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
            await ctx.reply('Processing done. no MATCH found!.');
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
              caption: "MATCH"
                + '\n👤 ' + personData
                + '\n' + listIcon + ' ' + listData
            });
            await ctx.reply('Processing end.');
            await ctx.reply('/Menu');
            return;
          }
        }
      }

      core.sendEvent("HTML5_FORM", "*", "TELEGRAM_FACEX_RESULT_CARD", {
        importSessionId: session.id,
        listType: 'unknown',
        type: 'empty-result'
      });
      await ctx.reply('No Match found.');
    } catch (err) {
      console.error(err);
      await ctx.reply('Error, please notify to admin.');
    }
  });

  bot.launch();

});

async function validateUser(username) {
  const securOSUser = await findTelegramUser(username);

  if (securOSUser.length === 0) {
    // 
    return {
      error: 'The account is not registered on SecurOS to use this Bot.'
    };
  }

  let queryData = url.parse(`?${securOSUser[0].comment.replace(/\n/gi, '&')}`, true).query;
  // console.log(queryData);

  if (!securOSUser[0].comment
    || !queryData['TELEGRAM_BOT_MESSAGES']
    || queryData['TELEGRAM_BOT_MESSAGES'].trim().toLowerCase() === 'false') {
    return {
      error: 'This account is not allowed to use this Bot.'
    };
  }

  return securOSUser[0];
}

async function getPhotoUrl(telegramPhoto) {


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