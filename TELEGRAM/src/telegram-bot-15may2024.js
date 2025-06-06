const BOT_TOKEN = '5312964433:AAGyIsIQZSgZUWYOfqX1Zy41nb6rYt01e-g';
const SECUROS_USER = 'admin';
const SECUROS_PASS = 'admin';
// const BOT_GROUP = -4249421586; // Grupo
const BOT_GROUP = -1002109791201; // Canal

const securos = require('securos');
const http = require('http');
const https = require('https');

securos.connect((core) => {
  core.registerEventHandler("CAM", "*", "MD_STOP", sendNotification);

  async function sendNotification(eventData) {
    try {
      const { sourceId, params: { start_time, stop_time, time_iso } } = eventData;
      // console.log('--------------------------------------------------');
      // console.log(eventData);
      // console.log(start_time);
      // console.log(stop_time);
      // console.log(time_iso);
      const sumDate = (new Date(stop_time) - new Date(start_time)) / 3;
      const interpolatedDatetime =
        new Date(sumDate + new Date(start_time + '+00:00').valueOf())
          .toISOString().slice(0, -1);
      // console.log(sumDate);
      // console.log('result:', interpolatedDatetime);

      const camera = await core.getObject('CAM', sourceId);
      // console.log(camera);

      // console.count('messages');
      // await sendMessage(BOT_GROUP, `${interpolatedDatetime} - Detección de movimiento en cámara: ${camera.name}`);

      await sendPhoto(
        BOT_GROUP,
        `http://127.0.0.1:8888/api/v2/cameras/${sourceId}/image/${interpolatedDatetime}`,
        `${interpolatedDatetime} - Detección de movimiento en cámara: ${camera.name}`);
    } catch (ex) {
      console.error(ex);
    }
  }
});

function sendMessage(chat_id, text) {
  return new Promise((resolve, reject) => {
    let data = {
      chat_id,
      text,
    };
    let dataEncoded = JSON.stringify(data);
    let req = https.request(
      {
        host: 'api.telegram.org',
        path: `/bot${BOT_TOKEN}/sendMessage`,
        method: 'POST',
        headers: {
          'Content-Length': Buffer.byteLength(dataEncoded),
          'Content-Type': 'application/json',
        },
      },
      res => {
        let buffers = [];
        res.on('error', reject);
        res.on('data', buffer => buffers.push(buffer));
        res.on(
          'end',
          () =>
            res.statusCode === 200
              ? resolve(Buffer.concat(buffers))
              : reject(Buffer.concat(buffers))
        );
      }
    );
    req.write(dataEncoded);
    req.end();
  });
}

function sendPhoto(chat_id, imageUrl, caption) {
  // console.log(imageUrl);
  return new Promise(async (resolve, reject) => {
    const imageBuffer = await downloadImageBuffer(imageUrl, SECUROS_USER, SECUROS_PASS);
    // Construct the multipart form data
    const boundary = '----WebKitFormBoundary1234567890';
    const data = `--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="image.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`;
    const endData = `\r\n--${boundary}--\r\n`;

    // Additional data for chat_id and caption
    const additionalData = `\r\n--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${chat_id}\r\n` +
      `--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n`;


    // Set up the HTTP request options
    const options = {
      host: 'api.telegram.org',
      path: `/bot${BOT_TOKEN}/sendPhoto`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(data) + imageBuffer.length + Buffer.byteLength(endData) + Buffer.byteLength(additionalData),
      },
    };

    // Send the request with the multipart form data
    const req = https.request(options, (res) => {
      // console.log(`statusCode: ${res.statusCode}`);
      // res.on('data', (data) => {
      //     process.stdout.write(data);
      // });
      let buffers = [];
      res.on('error', (err) => {
        console.log(err);
        reject(err);
      });
      res.on('data', buffer => buffers.push(buffer));
      res.on(
        'end',
        () => {
          // console.log(Buffer.concat(buffers).toString());
          res.statusCode === 200
            ? resolve(Buffer.concat(buffers))
            : reject(Buffer.concat(buffers))
        }
      );
    });

    req.write(data);
    req.write(imageBuffer);
    req.write(additionalData);
    req.write(endData);

    req.on('error', (error) => {
      console.error(error);
      reject(error);
    });

    req.end();

  });

}

function downloadImageBuffer(imageUrl, username, password) {
  return new Promise((resolve, reject) => {
    const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
    const options = {
      headers: {
        Authorization: authHeader,
      },
    };

    http.get(imageUrl, options, (response) => {
      if (response.statusCode !== 200) {
        reject(`Failed to download image, status code: ${response.statusCode}`);
        return;
      }

      const chunks = [];
      response.on('data', (chunk) => {
        chunks.push(chunk);
      });
      response.on('end', () => {
        const imageBuffer = Buffer.concat(chunks);
        resolve(imageBuffer);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}