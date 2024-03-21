const { PermissionFlagsBits, EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const getConnection = require("../../functions/database/connectDatabase");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Retrieves a Members Warning List by ID')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Selects a User to Warn')
        .setRequired(true)
    ),
    usage: '<User>',
    async execute(interaction, client) {
    try {
      await interaction.deferReply();
      const userId = interaction.member.user.id;
      const guildId = interaction.guild?.id;
      // Get the user from the command arguments
      const user = interaction.options.getUser('user');
      const memberPerms = interaction.member;

      if (!memberPerms.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return await interaction.editReply('You Cannot Use This Command: Insufficient Permissions');
      }

      // Create a connection to the MySQL database
      const connection = await getConnection();

      // Fetch warnings for the user from the database
      const [rows] = await connection.query(
        "SELECT warningid, modname, reason, timestamp FROM warnings WHERE guild_id = ? AND username = ?",
        [interaction.guild.id, user.username]
      );

      const [customRows] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [guildId]);
      const [userColorRow] = await connection.query(`SELECT * FROM user_config WHERE user_id = ${user.id || interaction.member?.user.id} AND guild_id = ?`, [guildId]);

      connection.release();

      // Check if the user has any warnings
      if (rows.length === 0) {
        return interaction.editReply(`${user.tag} has no warnings`);
      }

      // Create an embed to display the warnings
      let embedColor;
      const defaultColor = customRows[0].mastercolor;
      const userColor = userColorRow[0].usercolor;
            
      if (!userColor) {
        embedColor = defaultColor;
      } else if (userColor) {
        embedColor = userColor;
      }

      const embed = new EmbedBuilder()
        .setTitle(`${user.tag}'s Warnings`)
        .setColor(embedColor)
        .setAuthor({
          name: user.username || 'Unknown User',
          iconURL: user.avatarURL() || 'https://cdn.systemdbot.com/images/logos/2023/systemdbotv2.png'
        })        
        .setDescription(rows.map((warning) => {
          const date = new Date(warning.timestamp).toLocaleString();
          return `**ID:** \`${warning.warningid}\` | **Moderator**: ${warning.modname}\n**Reason:** ${warning.reason} | **Date:** ${date}\n`;
        }).join('\n'));

      interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
    }
  },
};
