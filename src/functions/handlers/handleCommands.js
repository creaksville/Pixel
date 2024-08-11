const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const clientID = require('../../config/config');
const fs = require('fs');

module.exports = (client) => {
    client.handleCommands = async() => {
        const commandDirs = fs.readdirSync('./src/cmd');
        for (const folder of commandDirs) {
            const commandFiles = fs
                .readdirSync(`./src/cmd/${folder}`)
                .filter((file) => file.endsWith(".js"));

            const { commands, commandArray } = client;
            for (const file of commandFiles) {
                const command = require(`../../cmd/${folder}/${file}`);
                commands.set(command.data.name, command);
                commandArray.push(command.data);
            }
        }

        const clientId = clientID.bot.clientId;
        const rest = new REST({ version: '9' }).setToken(clientID.bot.token);
        try {
            console.log(`Started Refreshing Application (/) Commands at ${new Date().toLocaleString()}`);

            await rest.put(Routes.applicationCommands(clientId), {
                body: client.commandArray,
            });

            console.log(`Successfully reloaded Application (/) commands at ${new Date().toLocaleString()}`);
            console.log('---------------------------------------------------------');
        } catch(error) {
            console.error(error);
        }
    }
};