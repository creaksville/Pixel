const getConnection = require('../../functions/database/connectDatabase');
console.log(`Bump Reminder Loaded at ${new Date().toLocaleString()}`);
const { EmbedBuilder } = require('discord.js');

module.exports = async (message, client) => {
    try {
      const connection = await getConnection(); 
            const [colorRows] = await connection.query("SELECT mastercolor FROM cfg_misc WHERE guild_id = ?", [message.guild.id]);
            const [miscRows] = await connection.query("SELECT bumprole FROM cfg_misc WHERE guild_id = ?", [message.guild.id]);
            const [enableRows] = await connection.query("SELECT bump FROM cfg_enable WHERE guild_id = ?", [message.guild.id]);
            const [channelRows] = await connection.query("SELECT bump FROM cfg_channels WHERE guild_id = ?", [message.guild.id]);
      connection.release();

      const guildEnable = enableRows[0].bump;
      const guildChannel = channelRows[0].bump;
      const guildRole = miscRows[0].bumprole;

      if (!guildEnable || !guildChannel || !guildRole) return;

      if (guildEnable !== 1) return;
      const color = colorRows[0].mastercolor;
      const role = message.guild.roles.cache.get(guildRole);
      const channel = message.guild.channels.cache.get(guildChannel);

      if (!role) {
        console.log(`Error: Could not find role with ID ${guildRole} in server unknown.`);
        return;
      }

      if (message.interaction && message.interaction.commandName === "bump" && message.author.id === "302050872383242240") {
        const disboardReminderEmbed = new EmbedBuilder()
          .setTitle('Thank You For Bumping to DISBOARD!!')
          .setDescription(`Please Check Back in 2 Hours!!`)
          .setColor(color)
          .setTimestamp();

        channel.send({ embeds: [disboardReminderEmbed] });

        setTimeout(() => {
          channel.send(`<@&${guildRole}> Don't forget to bump using DISBOARD the server to get more members!`);
        }, 2 * 60 * 60 *1000);
      } else if (message.interaction && message.interaction.commandName === "bump" && message.author.id === "115385224119975941") {
        const dserversReminderEmbed = new EmbedBuilder()
          .setTitle('Thank You For Bumping to DiscordServers!!')
          .setDescription(`Please Check Back in 2 Hours!!`)
          .setColor(color)
          .setTimestamp();

        channel.send({ embeds: [dserversReminderEmbed] });

        setTimeout(() => {
          channel.send(`<@&${guildRole}> Don't forget to bump using DiscordServers the server to get more members!`);
        }, 2 * 60 * 60 *1000);
      }
    } catch (error) {
      console.error(error);
    }
};