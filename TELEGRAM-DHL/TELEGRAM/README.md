# MX_PRJ_FaceX_Telegram_Bot

FaceX Telegram Bot module works with a public Telegram Bot previously created to perform facial recognition through Telegram app, with FaceX SecurOS API using a photo file.

## Installation

### Pre requisites

This module requires:

* SecurOS REST API
* SecurOS FaceX REST API
* SecurOS Node.js
* Telegram Bot TOKEN ([follow this official reference](https://core.telegram.org/bots#6-botfather))

### Steps
To setup, follow the instructions:

1. Install following npm dependencies:
   * `axios`
   * `form-data`
   * `telegraf@4.11.2`
   * `express`
   * `cors`
2. Copy the file `telegram-facex-bot.js` content to a new SecurOS Node.js Script.
3. Configure the script variables with the appropiate info: 
   * `BOT_TOKEN`: Telegram Bot Token
   * `REST_API_URL_BASE`: Rest API URL
   * `URL_BASE`: FaceX Rest API URL
   * `PORT`: Web Interface Server Port
4. Paste `main.html` file to `C:\Program Files (x86)\ISS\SecurOS\bin64\node.js\public` folder (*if public folder doesn't exist create it*).
5. Create a `HTML5 FrontEnd` SecurOS Object with URL set to `http://SERVER_IP:PORT/main.html` (**OPTIONAL**)

## Security

Once the module is installed, it has a security layer based on SecurOS Users, in order to be able to use the bot it's required to create a SecurOS user based on the end users' Telegram account.

In SecurOS the created user has to be assigned on Additional Info the value `TELEGRAM_BOT_MESSAGES=true` to allow this user to have access to the bot face recognition funtionality.

It's also possible to explicitly deny a user to have access to the bot by specifying in user Additional Info the value `TELEGRAM_BOT_MESSAGES=false`.

## Usage

If the module is fully configured, the bot will be prepared for receiving face photos and retreive the FaceX REST API results in a human readable way.

The web interface will display the results as an ordered list.