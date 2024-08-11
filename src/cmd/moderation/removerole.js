const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removerole')
    .setDescription('Removes a Specific Member a Role')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to Remove Role From')
        .setRequired(true))
    .addRoleOption(option =>
      option
        .setName('role')
        .setDescription('Role To Remove From User')
        .setRequired(true)),
    usage: '<user> <role>',
  async execute(interaction, client) {
    try {
      await interaction.deferReply();
      const memberPerms = interaction.member;

      if (!memberPerms.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return await interaction.editReply('You Cannot Use This Command: Insufficient Permissions');
      }

      const userID = interaction.options.getUser('user');
      const options = interaction.options;
      const roleID = options.getRole('role');

      const member = await interaction.guild.members.fetch(userID);

      if (!member) {
        return interaction.editReply('Member not found.');
      }

      if (!roleID) {
        return interaction.editReply('Role not found.');
      }

      // Create a connection to the MySQL database
      const connection = await getConnection();

      // Define the SQL query to remove the role from the user
      const removeRoleQuery = "DELETE FROM member_roles WHERE guild_id = ? AND user_id = ? AND role_id = ?";

      // Execute the query with the necessary parameters
      await connection.query(removeRoleQuery, [interaction.guild.id, member.user.id, roleID.id]);

      member.roles.remove(roleID.id)
        .then(async () => {
          interaction.editReply(`Role <@&${roleID.id}> has been Removed From <@${member.user.id}>.`);

          await connection.query(
            "INSERT INTO mod_tracker (guild_id, guild_name, username, modname, modevent, timestamp) VALUES (?, ?, ?, ?, ?, ?)",
            [interaction.guild.id, interaction.guild.name, userID.username, interaction.user.username, 'Remove Role', new Date().toLocaleString()]
          );
        })
        .catch(error => {
          console.error(error);
          interaction.editReply('An error occurred while removing the role.');
        });

      connection.release();
    } catch (error) {
      console.error(error);
      interaction.editReply('An error occurred while fetching the member.');
    }
  },
};
