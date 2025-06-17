const BOT_TOKEN = '5312964433:AAGyIsIQZSgZUWYOfqX1Zy41nb6rYt01e-g';
const BOT_GROUP = -876380733;
const URL_BASE = 'http://localhost:21093';

const securos = require('securos');
const http = require('http');

const { Telegraf } = require('telegraf');
const bot = new Telegraf(BOT_TOKEN);

// bot.telegram.sendMessage(BOT_GROUP, 'Bienvenido al Bot de reconocimiento facial de SecurOS FaceX.', {});

securos.connect(async (core) => {
  core.registerEventHandler("FACE_X_SERVER", "*", "MATCH", sendNotification);

  async function sendNotification(eventData) {
    const comment = JSON.parse(eventData["params"]["comment"]);
    const faceImage = comment["_links"]["detection_image"];
    const matchedFaceImage = comment['matched_person_face_image']['_links']['source'];
    const personFound = comment["person"];

    const blacklist = personFound.lists.find(l => l.priority === 0);

    if (!blacklist) { return; }

    let personData = `👤 ${personFound.first_name || ''} ${personFound.middle_name || ''} ${personFound.last_name || ''}`;
    let listData = `${personFound.lists.reduce((previousValue, currentValue) => {
      let priority = currentValue.priority === 0 ? `🟥` : currentValue.priority === 1 ? `🟦` : `✅`;
      return previousValue + `${priority} - ${currentValue.name}` + '\n';
    }, '\n')}`;

    bot.telegram.sendPhoto(BOT_GROUP,
      { source: await getStreamFromUrlHttp(`${URL_BASE}${faceImage}`) },
      { caption: "Persona capturada" }
    );
    await sleep(1000);

    bot.telegram.sendPhoto(BOT_GROUP,
      { source: await getStreamFromUrlHttp(`${URL_BASE}${matchedFaceImage}`) },
      { caption: "Persona encontrada" + '\n' + personData + listData }
    );
  }
});

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

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}