const getConnection = require('../../functions/database/connectDatabase');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uptime')
        .setDescription('Retrieve Bot Uptime'),
    usage: '',
    async execute(interaction, client) {
      const userId = interaction.member.user.id;
      const guildId = interaction.guild?.id;

      const connection = await getConnection();
        const [cfgMiscRows] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [guildId]);
        const [userColorRow] = await connection.query("SELECT * FROM user_config WHERE user_id = ? AND guild_id = ?", [userId, guildId]);
      const defaultColor = cfgMiscRows[0].mastercolor;
      const userColor = userColorRow[0].usercolor;
      let embedColor;
      
      if (!userColor) {
        embedColor = defaultColor;
      } else if (userColor) {
        embedColor = userColor;
      }

      connection.release();
    try {
      const sysuptime = formatTime(process.uptime());
      const uptime = `\`${sysuptime}\``

      const embed = new EmbedBuilder()
        .setTitle('Uptime')
        .addFields({name: 'Uptime', value: `${uptime}`, inline: true})
        .setThumbnail(client.user.displayAvatarURL())
        .setTimestamp()
        .setColor(embedColor);

      interaction.reply({ embeds: [embed] });
    } catch(error) {
      console.error(error);
    }
  },
};

// Helper functions to format data
function formatTime(seconds) {
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secondsOnly = Math.floor(seconds % 60);
  if ((days, hours, minutes) < 1) {
    return `${secondsOnly} Seconds`;
  } else if ((days, hours) < 1) {
    return `${minutes} Minutes,\n${secondsOnly} Seconds`;
  } else if (days < 1) {
    return `${hours} Hours,\n${minutes} Minutes,\n${secondsOnly} Seconds`;
  } else {
    return `${days} Days,\n${hours} Hours,\n${minutes} Minutes,\n${secondsOnly} Seconds`;
  }
}
