const { v4 } = require('uuid');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warns a Member')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Selects a User To Warn')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for the Warning')
        .setRequired(true)),
    usage: '<user> <Reason>',
  async execute(interaction, client) {
    try {
      await interaction.deferReply();
      // Get the user and reason from the command options
      const user = interaction.options.getUser('user');
      const memberPerms = interaction.member;

      if (!memberPerms.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        return await interaction.editReply('You Cannot Use This Command: Insufficient Permissions');
      }

      const options = interaction.options;
      const reason = options.getString('reason');

      // Generate the ID using uuidv4
      const id = v4().replace(/-/g, '').substring(0, 12);

      // Create a new warning entry in the MySQL database
      const connection = await getConnection();

      await connection.query(
        "INSERT INTO warnings (guild_id, guild_name, warningid, username, modname, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [interaction.guild.id, interaction.guild.name, id, user.username, interaction.user.username, reason, new Date().toLocaleString()]
      );

      await connection.query(
        "INSERT INTO mod_tracker (guild_id, guild_name, username, modname, modevent, reason, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [interaction.guild.id, interaction.guild.name, user.username, interaction.user.username, 'Warn', reason, new Date().toLocaleString()]
      );

      connection.release();

      interaction.editReply(`Successfully warned ${user.tag} for ${reason}`);
    } catch (error) {
      console.error(error);
    }
  },
};
