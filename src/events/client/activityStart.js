const { Guild } = require('discord.js');
const bot = require('../../config/config');
const { ActivityType } = require('discord.js');

module.exports = async (client) => {
    try {
        await client.guilds.fetch(); // Fetch guilds to populate the cache
        const number_of_servers = client.guilds.cache.size;
        console.log(number_of_servers);
        client.user?.setPresence({
            status: bot.bot.status.status, // Explicitly specify the type here
            activities: [
                {
                    name: `${number_of_servers} Servers`,
                    type: bot.bot.status.type,
                },
            ],
        });
    } catch (error) {
        console.error(error);
    }
};
