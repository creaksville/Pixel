const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unwarn')
    .setDescription('Removes a Warning by ID')
    .addStringOption(option =>
      option
        .setName('id')
        .setDescription('The 12 Char ID to Remove')
        .setRequired(true)),
    usage: '<Warning ID>',
  async execute(interaction, client) {
    try {
      await interaction.deferReply();
      const options = interaction.options;
      const id = options.getString('id');
      const memberPerms = interaction.member;

      if (!memberPerms.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return await interaction.editReply('You Cannot Use This Command: Insufficient Permissions');
      }

      if (!id) {
        return interaction.editReply('Please provide the ID of the warning to delete');
      }

      // Create a connection to the MySQL database
      const connection = await getConnection();

      // Define the SQL query to delete the warning
      const deleteQuery = "DELETE FROM warnings WHERE guild_id = ? AND warningid = ?";

      // Execute the delete query with parameters
      const [result] = await connection.query(deleteQuery, [interaction.guild.id, id]);

      connection.release();

      if (result.affectedRows === 1) {
        return interaction.editReply(`Successfully deleted warning with ID: ${id}`);
      } else {
        return interaction.editReply(`Could not find warning with ID: ${id}`);
      }
    } catch (error) {
      console.error(error);
    }
  },
};
