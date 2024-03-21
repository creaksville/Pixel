const fetch = require('node-fetch');
const getConnection = require('../../functions/database/connectDatabase');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ip')
        .setDescription('Return IP Info')
        .addStringOption(option =>
          option
            .setName('ip')
            .setDescription('The IP To Input')
            .setRequired(true)),
    usage: `<IP Address>`,
    async execute(interaction, client) {
    try {
      const userId = interaction.member.user.id;
      const guildId = interaction.guild?.id;
      
      const ip = interaction.options.getString('ip');
      if (!ip) {
        console.log('Please provide an IP address');
        return;
      }

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
        const url = `https://ipinfo.io/${ip}/geo`;
        const jj = await fetch(url);
        const info = await jj.json();

        const ipEmbed = new EmbedBuilder()
          .setColor(embedColor)
          .setTitle(`Information for ${info.ip}`)
          .setDescription('**LOCATION:**')
          .addFields(
              { name: '**City:**', value: `**${info.city}**`, inline: true },
              { name: '**Region:**', value: `**${info.region}**`, inline: true },
              { name: '**Country:**', value: `**${info.country}**`, inline: true },
              { name: '**Location:**', value: `**${info.loc}**`, inline: true },
              { name: '**Timezone:**', value: `**${info.timezone}**`, inline: true },
              { name: '**Postal:**', value: `**${info.postal}**`, inline: true },
              { name: '**ISP:**', value: `**${info.org.replace(/^AS\d+\s*/, '') || 'Unknown'}**`, inline: true },
              { name: '**Domain:**', value: `**${info.hostname || 'Unknown'}**`, inline: true }
            )
          .setThumbnail(interaction.client.user.displayAvatarURL())
          .setTimestamp();
        
        await interaction.reply({ embeds: [ipEmbed] });
      } catch (err) {
        console.error(err);
        await interaction.reply('There was an error while processing your request. Please try again later.');
      }
    } catch (error) {
      console.error(error);
    }
  },
};