const fs = require('fs');
const config = require('../../config/config');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const getConnection = require("../../functions/database/connectDatabase");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Get Your Questions Answered by 8Ball')
        .addStringOption(option =>
          option
            .setName('question')
            .setDescription('Your Question to Master 8Ball')),
    usage: `<question>`,
    async execute(interaction, client) {
      const question = interaction.options.getString('question');
      const userId = interaction.member.user.id;
      const guildId = interaction.guild?.id;
      
      if (!question) {
        return interaction.reply('Please ask a question.');
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

      

      const responses = JSON.parse(fs.readFileSync(config.plugins.eightball.source, 'utf8'));
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      const embed = new EmbedBuilder()
        .setColor(embedColor)
        .addFields({ name: 'Question', value: `${question}`})
        .addFields({ name: '8 Ball Response', value: `${randomResponse || 'Could Not Connect to 8Ball Service'}`});

      // Send the embed as a message
      await interaction.reply({ embeds: [embed] });
  },
};
