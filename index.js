const TelegramApi = require('node-telegram-bot-api');
const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const token = '7386438248:AAHhipxJ4FPxsZYC1V2zxiJy5Dh08VnHJqg';
const bot = new TelegramApi(token, { polling: true });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

client.connect();

const gameOptions = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{ text: 'Добавить доход', callback_data: 'add_income' },
            { text: 'Добавить расход', callback_data: 'add_expense' }],
            [{ text: 'Статистика', callback_data: 'view_statistics' }]
        ]
    })
};

const userStates = {}; 

const start = () => {
    bot.setMyCommands([
        { command: '/start', description: 'Приветствие' },
        { command: '/info', description: 'Что я умею' },
    ]);

    bot.on('message', async (msg) => {
        const text = msg.text;
        const chatId = msg.chat.id;

        
        if (text === '/start') {
            bot.sendMessage(chatId, `Добро пожаловать в PIGGI bank, бот финансового учёта!`);
            return;
        }

        if (text === '/info') {
            bot.sendMessage(chatId, `${msg.from.first_name}, я могу запомнить твои расходы и доходы, а ещё разделить их по категориям :) Хочешь попробовать?`, gameOptions);
            return;
        }

        
        if (userStates[chatId]) {
            
            const input = text.split(' ');
            const amount = parseFloat(input[0]);
            const category = input.slice(1).join(' ');

            if (!isNaN(amount) && category) {
                const type = userStates[chatId] === 'income' ? 'income' : 'expense';
                await client.query('INSERT INTO transactions (user_id, amount, category, type) VALUES ($1, $2, $3, $4)', [chatId, amount, category, type]);
                bot.sendMessage(chatId, type === 'income' ? 'Доход успешно добавлен!' : 'Расход успешно добавлен!');
            } else {
                bot.sendMessage(chatId, 'Ошибка! Пожалуйста, введите корректные данные в формате: "сумма категория".');
            }
            
            delete userStates[chatId]; 
            return; 
        }
    });

    bot.on('callback_query', async (callbackQuery) => {
        const chatId = callbackQuery.message.chat.id;
        const data = callbackQuery.data;

        if (!userStates[chatId]) {
            if (data === 'add_income') {
                userStates[chatId] = 'income';
                bot.sendMessage(chatId, 'Введите сумму дохода и категорию в формате: "1000 зарплата"');
            }

            if (data === 'add_expense') {
                userStates[chatId] = 'expense';
                bot.sendMessage(chatId, 'Введите сумму расхода и категорию в формате: "500 еда"');
            }
        }

        if (data === 'view_statistics') {
            const result = await client.query('SELECT category, SUM(amount) AS total FROM transactions WHERE user_id = $1 GROUP BY category', [chatId]);
            let statsMessage = 'Статистика по категориям:\n';

            if (result.rows.length === 0) {
                statsMessage = 'Нет данных для отображения.';
            } else {
                result.rows.forEach(row => {
                    statsMessage += `${row.category}: ${row.total}\n`;
                });
            }

            bot.sendMessage(chatId, statsMessage);
        }
    });
};

start();
