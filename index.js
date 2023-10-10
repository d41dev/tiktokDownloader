const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const fs = require('fs');
const { fetchVideo } = require('@prevter/tiktok-scraper');
const dotenv = require('dotenv');
const TelegramBot = require('node-telegram-bot-api');

dotenv.config();

// Constants
const fileName = Date.now();
const filePathVideo = `video_${fileName}.mp4`;
const filePathAudio = `audio_${fileName}.mp3`;
const token = process.env.TOKEN;
const bot = new TelegramBot(token);
const app = express();

// Define your webhook endpoint
const webhookEndpoint = '/tiktok'; // Change this to your desired endpoint path

// Middleware to parse incoming JSON requests from Telegram
app.use(bodyParser.json());

// Webhook route to handle incoming updates
app.post(webhookEndpoint, async (req, res) => {
  const { message, callback_query } = req.body;

  if (!message || !message.text) {
    return res.status(200).end();
  }

  const chatId = message.chat.id;
  const text = message.text.toLowerCase();

  if (text.includes('tiktok.com')) {
    const videoUrl = text.trim();
    const caption = await downloadVideo(videoUrl);

    // Send the video and audio as a file to Telegram
    bot.sendVideo(chatId, filePathVideo);
    bot.sendAudio(chatId, filePathAudio);

    // Send video caption
    bot.sendMessage(chatId, `Caption: ${caption}`);
  } else if (text !== "/start" && !callback_query) {
    bot.sendMessage(chatId, "Invalid URL: The URL must be for a TikTok video");
  }

  res.status(200).end();
});

async function getDownloadUrl(videoUrl) {
  try {
    const video = await fetchVideo(videoUrl);
    return video;
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function downloadVideo(videoUrl) {
  try {
    const videoObj = await getDownloadUrl(videoUrl);
    const responseVideo = await axios.get(videoObj.videoNoWatermark.url, { responseType: "arraybuffer" });
    const responseAudio = await axios.get(videoObj.music.url, { responseType: "arraybuffer" });
    const audioBuffer = Buffer.from(responseAudio.data);
    const videoBuffer = Buffer.from(responseVideo.data);
    
    fs.writeFileSync(filePathVideo, videoBuffer);
    fs.writeFileSync(filePathAudio, audioBuffer);
    
    return videoObj.description;
  } catch (error) {
    console.error('Error downloading video:', error);
    throw error;
  }
}

// Start your Express server
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  
  // Register the webhook URL with Telegram
  bot.setWebHook(`${process.env.WEBHOOK_URL}${webhookEndpoint}`);
});
