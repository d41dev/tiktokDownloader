const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const { fetchVideo } = require('@prevter/tiktok-scraper');
const dotenv = require('dotenv');
dotenv.config();

//Constants
const fileName = Date.now();
const filePathVideo = `video_${fileName}.mp4`;
const filePathAudio = `audio_${fileName}.mp3`;
const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

console.log("Bot listening...")

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text.toLowerCase();

    if (text.includes('tiktok.com')) {
        // Extract TikTok video URL from the message
        const videoUrl = text.trim();

        // Download the video, caption, and audio link
        const caption = await downloadVideo(videoUrl);
        

        // Send the video and audio as a file to Telegram
        bot.sendVideo(chatId, filePathVideo);
        bot.sendAudio(chatId, filePathAudio);

        // send video caption
        bot.sendMessage(chatId, `Caption: ${caption}`);
    }else if(text !== "/start"){
      bot.sendMessage(chatId, "Invalid url: the url must for a tiktok video")
    }
});


async function getDownloadUrl(videoUrl) {
try {
  const video = await fetchVideo(videoUrl);
  return video;
	
} catch (error) {
	console.error(error);
	return null;
}
};



async function downloadVideo(videoUrl) {

  
    try {
      const videoObj = await getDownloadUrl(videoUrl)
        // Use axios to download the video as a binary stream
        const responseVideo = await axios.get(videoObj.videoNoWatermark.url, {responseType:"arraybuffer"});
        
        const responseAudio = await axios.get(videoObj.music.url, {responseType:"arraybuffer"})
        
        // Create a buffer from the binary stream data for audio and video
        
        const audioBuffer = Buffer.from(responseAudio.data);

        const videoBuffer = Buffer.from(responseVideo.data);

        // Save the video buffer to the file with the determined extension
         fs.writeFileSync(filePathVideo, videoBuffer);
         fs.writeFileSync(filePathAudio, audioBuffer);
         
         return videoObj.description;
    } catch (error) {
        console.error('Error downloading video:', error);
        throw error;
    }
}