const getConnection = require('../../functions/database/connectDatabase');
const { PermissionFlagsBits } = require('discord.js');

module.exports = async (message, client) => {
    try {
        const connection = await getConnection();
            const [enableRows] = await connection.query("SELECT selfping FROM cfg_enable WHERE guild_id = ?", [message.guild.id]);
        connection.release();

        const guildEnable = enableRows[0].selfping;

        if (guildEnable !== 1) return;
        if (message.author.bot || !message.mentions.has(client.user)) {
            return;
        }

        if (message.channel.permissionsFor(client.user).has(PermissionFlagsBits.SendMessages)) {
            message.channel.send(`I was pinged by <@${message.author.id}>! Use \`/help\` for help!`);
          } else {
            // Handle the situation where the bot doesn't have permissions to send messages
            console.error("The bot doesn't have permissions to send messages in this channel.");
            // You can choose to do nothing, send an error message, or take other actions here.
        }
        
    } catch(error) {
        console.error(error);
    }
}