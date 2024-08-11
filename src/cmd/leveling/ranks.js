const getConnection = require('../../functions/database/connectDatabase');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ranks')
    .setDescription('Retrieve List of Available Ranks'),
  usage: '',
  async execute(interaction, client) {
    try {
      await interaction.deferReply();
      const userId = interaction.member.user.id;
      const guildId = interaction.guild?.id;

      const connection = await getConnection();
      const [cfgMiscRows] = await connection.query('SELECT mastercolor FROM cfg_misc WHERE guild_id = ?', [interaction.guild?.id]);
      const [userColorRow] = await connection.query("SELECT * FROM user_config WHERE user_id = ? AND guild_id = ?", [userId, guildId]);
      const [lvlRolesRows] = await connection.query("SELECT levels, role_id FROM lvlroles WHERE guild_id = ? AND levels > 0 ORDER BY levels DESC", [interaction.guild?.id]);
      
      const defaultColor = cfgMiscRows[0].mastercolor;
      const userColor = userColorRow[0].usercolor;
      let embedColor;

      if (!userColor) {
          embedColor = defaultColor;
      } else if (userColor) {
          embedColor = userColor;
      }

      connection.release();

      const embed = new EmbedBuilder()
        .setTitle(`Roles rewards [${lvlRolesRows.length}]`)
        .setThumbnail(client.user?.displayAvatarURL())
        .setColor(embedColor);

      let desc = '';
      for (const rank of lvlRolesRows) {
        if (rank.role_id) { // Check if role_id is not null
          const role = interaction.guild?.roles.cache.get(rank.role_id);
          if (role) {
            desc += `${role} - Level ${rank.levels}\n`;
          } else {
            desc += `Invalid Role - Level ${rank.levels}\n`;
          }
        } else {
          // Handle the case where role_id is null
          desc += `Role not found - Level ${rank.levels}\n`;
        }
      }

      if (lvlRolesRows.length === 0) {
        desc = 'Level Roles List is empty';
      }

      embed.setDescription(desc);
      interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      interaction.editReply('An error occurred while fetching level roles.');
    }
  },
};
