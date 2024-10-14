const TelegramApi = require('node-telegram-bot-api');
const { text } = require('stream/consumers');

const token = '7386438248:AAHhipxJ4FPxsZYC1V2zxiJy5Dh08VnHJqg';

const bot = new TelegramApi(token, { polling: true });

const gameOptions = {
    reply_markup: JSON.stringify({
        inline_keyboard : [
            [{text: 'Да', callback_data: 'Нажал да'},{text: 'Нет', callback_data: 'Нажал нет'}]
        ]
    })
}

const start = () => {
    bot.setMyCommands([
        {command: '/start', description: 'Приветствие'},
        {command: '/info', description: 'Что я умею'},
        {command: '/start', description: 'Приветствие'},
    ]);
    
    bot.on('message', (msg) => {
        const text = msg.text;
        const chatId = msg.chat.id;
        
        if (text === '/start') {
            bot.sendMessage(chatId, `Добро пожаловать в PIGGI bank, бот финансового учёта!`);
        }
    
        if (text === '/info') {
            bot.sendMessage(chatId, `${msg.from.first_name}, я могу запомнить твои расходы и доходы, а ещё разделить их по категориям :) Хочешь попробовать?`,gameOptions);
        }

        return bot.sendMessage(chatId, `${msg.from.first_name}, я тебя не понимаю :(`);
    });
}

start();
