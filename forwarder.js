const TelegramBot = require('node-telegram-bot-api');
const token = '6404198207:AAGOLBvXjlFizjNxHasyggVj1IwT4k1bctk'; // Replace with your bot's API token

// Initialize the bot
const bot = new TelegramBot(token, { polling: true });

// Define the target group/channel ID where you want to forward messages
const targetChatId = '@testgroup1002'; // Replace with your target group/channel ID

console.log("Bot running...");

// Listen for messages in the group/channel
bot.on('message', (msg) => {
  // Forward the message to the target group/channel
  bot.forwardMessage(targetChatId, msg.chat.id, msg.message_id);

  // Optional: Send a confirmation message back to the group/channel
  bot.sendMessage(msg.chat.id, 'Message forwarded to target group/channel.');
});

// Listen for media files (images and videos)
bot.on('photo', (msg) => forwardMedia(msg, 'photo'));
bot.on('video', (msg) => forwardMedia(msg, 'video'));

function forwardMedia(msg, mediaType) {
  // Forward the media to the target group/channel
  bot.sendMediaGroup(targetChatId, [{ type: mediaType, media: msg[mediaType][0].file_id }]);
}
