const getConnection = require("../../functions/database/connectDatabase");
const { EmbedBuilder } = require('discord.js');

module.exports = async (message, client) => {
    try {
      if (message.author.bot) return;

      const connection = await getConnection();
        const [miscRows] = await connection.query("SELECT mastercolor FROM cfg_misc WHERE guild_id = ?", [message.guild.id]);
      connection.release();

      const embedColor = miscRows[0].mastercolor;

      if (message.content.match(/discord\.com\/channels\/([0-9]+)\/([0-9]+)\/([0-9]+)/)) {
        const [, guildId, channelId, messageId] = message.content.match(/discord\.com\/channels\/([0-9]+)\/([0-9]+)\/([0-9]+)/);
        const channel = await client.channels.fetch(channelId);
        const fetchedMessage = await channel.messages.fetch(messageId);
        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle('Referenced Message')
            .setURL(`${fetchedMessage.url}`)
            .setAuthor({name: fetchedMessage.author.username, iconURL: fetchedMessage.author.displayAvatarURL()})
            .setDescription(`${fetchedMessage.content}`)
            .setTimestamp();
          message.channel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error(error);
    }
  };