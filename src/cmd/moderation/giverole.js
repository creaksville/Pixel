const getConnection = require('../../functions/database/connectDatabase');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giverole')
    .setDescription('Gives a Specific member a Role')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('User to Assign Role To')
        .setRequired(true))
    .addRoleOption(option =>
      option
        .setName('role')
        .setDescription('Role To Assign User To')
        .setRequired(true)),
    usage: '<user> <role>',
  async execute(interaction, client) {
    try {
      await interaction.deferReply();
      const member = interaction.member;

      if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return await interaction.reply('You Cannot Use This Command: Insufficient Permissions')
    }

      const memberID = interaction.options.getUser('user');
      const options = interaction.options;
      const roleID = options.getRole('role');

      try {
        const memberToAssign = await interaction.guild.members.fetch(memberID);
        const role = roleID.id;

        if (!memberToAssign) {
          return interaction.editReply('Member not found.');
        }

        if (!role) {
          return interaction.editReply('Role not found.');
        }

        // Create a connection to the MySQL database
        const connection = await getConnection();

        // Define the SQL query to add the role to the user
        const assignRoleQuery = "INSERT INTO member_roles (guild_id, guild_name, username, user_id, role_id) VALUES (?, ?, ?, ?, ?)";

        // Execute the query with the necessary parameters
        await connection.query(assignRoleQuery, [interaction.guild.id, interaction.guild.name, memberToAssign.user.username, memberToAssign.user.id, role]);

        memberToAssign.roles.add(role)
          .then(async () => {
            interaction.editReply(`Role <@&${role}> has been assigned to <@${memberToAssign.user.id}>.`);

            await connection.query(
              "INSERT INTO mod_tracker (guild_id, guild_name, username, modname, modevent, timestamp, reason, duration, number_of_messages) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
              [interaction.guild.id, interaction.guild.name, memberID.username, interaction.user.username, 'Give Role', new Date().toLocaleString(), 'N/A', 'N/A', 'N/A']
            );
          })
          .catch(error => {
            console.error(error);
            interaction.editReply('An error occurred while assigning the role.');
          });

        connection.release();
      } catch (error) {
        console.error(error);
        interaction.editReply('An error occurred while fetching the member.');
      }
    } catch (error) {
      console.error(error);
      interaction.editReply('An error occurred while processing your command.');
    }
  },
};
