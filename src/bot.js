const token = require('./config/config');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildEmojisAndStickers
    ]
});

client.commands = new Collection();
client.commandArray = [];

client.login(token.bot.token);

const functionDirs = fs.readdirSync('./src/functions');
for (const dir of functionDirs) {
    const functionFiles = fs
        .readdirSync(`./src/functions/${dir}`)
        .filter((file) => file.endsWith(".js"));
    for (const file of functionFiles)
        require(`./functions/${dir}/${file}`)(client);
        console.log(functionFiles);
}

client.handleCommands();
client.events();
