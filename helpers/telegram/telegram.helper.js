require('dotenv').config();
process.env.NTBA_FIX_350;
const TelegramBot = require('node-telegram-bot-api');

// Replace 'YOUR_TELEGRAM_BOT_TOKEN' with your actual Telegram bot token
const botToken = process.env.telegramBotToken;

// Create a new instance of TelegramBot
const bot = new TelegramBot(botToken, { polling: true });

// Function to send a PDF buffer to a specific chat ID with a custom filename
async function sendPdfBuffer(chatId, pdfBuffer, fileName) {
  try {
    const fileOptions = {
      filename: fileName,
      contentType: 'application/pdf',
    };

    await bot.sendDocument(chatId, pdfBuffer, {}, fileOptions);
 
  } catch (error) {
    console.error('Error sending PDF to Telegram:', error.message);
  }
}

// Function to send a text message to a specific chat ID
async function sendTextMessage(chatId, text) {
  try {
    await bot.sendMessage(chatId, text);

  } catch (error) {
    console.error('Error sending text message to Telegram:', error.message);
  }
}

// Function to handle Telegram notifications for both text and PDF messages
async function handleTelegramNotification(chatId, content, fileName = null) {
  try {
    if (typeof content === 'string') {
      // If content is a string, treat it as a text message
      await sendTextMessage(chatId, content);
    } else if (Buffer.isBuffer(content) && fileName) {
      // If content is a buffer, treat it as a PDF
      await sendPdfBuffer(chatId, content, fileName);
    } else {
      console.error('Invalid content type. Provide a text string or PDF buffer with a filename.');
    }
  } catch (error) {
    console.error('Error handling Telegram notification:', error);
  }
}

// Export the function for use in other modules
module.exports = handleTelegramNotification;
