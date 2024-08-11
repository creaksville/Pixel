const getConnection = require('../../functions/database/connectDatabase');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kicks a Member')
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('Selects a Member To Kick')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Gives a Reason For Kicking')
        .setRequired(true)),
    usage: '<user> <reason>',
  async execute(interaction, client) {
    try {
      await interaction.deferReply();
      const user = interaction.options.getUser('target');
      const reason = interaction.options.getString('reason');
      const member = interaction.member;

      if (!member.permissions.has(PermissionFlagsBits.KickMembers)) {
        return await interaction.editReply('You Cannot Use This Command: Insufficient Permissions');
      }

      if (user) {
        const memberToKick = interaction.guild.members.cache.get(user.id);

        if (!memberToKick) {
          return interaction.editReply('Member not found.');
        }

        const connection = await getConnection();

        await connection.query(
          "INSERT INTO mod_tracker (guild_id, guild_name, username, modname, modevent, reason, timestamp, duration, number_of_messages) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [interaction.guild.id, interaction.guild.name, user.username, interaction.user.username, 'Kick', reason, new Date().toLocaleString(), 'N/A', 'N/A']
        );

        connection.release();

        memberToKick.kick(reason)
          .then(() => {
            interaction.editReply(`User ${user.tag} has been kicked for ${reason}`);
          })
          .catch((error) => {
            console.error(error);
            interaction.editReply('An error occurred while trying to kick the user.');
          });
      } else {
        return interaction.editReply("You couldn't kick that member");
      }
    } catch (error) {
      console.error(error);
      interaction.editReply('An error occurred while processing your command.');
    }
  },
};
