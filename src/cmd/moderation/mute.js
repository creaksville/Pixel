const ms = require('ms');
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mutes a Member')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Selects a Member To Mute')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('The Reason for Muting')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('duration')
        .setDescription('Sets the Duration for Muting')
        .setRequired(true)),
  usage: '<user> <duration> <reason>',
  async execute(interaction, client) {
    try {
      await interaction.deferReply();
      const memberPerms = interaction.member;
      
      if (!memberPerms.permissions.has(PermissionFlagsBits.MuteMembers)) {
        return await interaction.editReply('You Cannot Use This Command: Insufficient Permissions');
      }

      const user = interaction.options.getUser('user');
      const durationString = interaction.options.getString('duration');
      const reason = interaction.options.getString('reason');

      // Check if a duration string is provided
      let duration = 0;
      if (durationString) {
        // Parse the duration using the custom function
        duration = parseDuration(durationString);

        if (isNaN(duration) || duration <= 0) {
          return interaction.editReply('Invalid duration format. Please use a valid format like "30s", "5m", "2h", etc.');
        }
      }

      // Assign the timeout to the user
      const guild = interaction.guild;
      const member = guild.members.cache.get(user.id);

      if (duration) {
        await member.timeout(duration);

        interaction.editReply(`${member.displayName} has been muted for ${ms(duration)}.\nReason: ${reason || 'No Reason Provided'}`);

        // Create a connection to the MySQL database
        const connection = await getConnection();

        // Define the SQL query to add the mute action to the database
        const addMuteQuery = "INSERT INTO mod_tracker (guild_id, guild_name, username, modname, modevent, reason, timestamp, duration, number_of_messages) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

        // Execute the query with the necessary parameters
        await connection.query(addMuteQuery, [interaction.guild.id, interaction.guild.name, user.username, interaction.user.username, 'Mute', reason || 'No Reason Provided', `${duration || 'Permanent'}`, new Date().toLocaleString(), 'N/A']);

        connection.release();
      } else {
        await member.timeout(0);

        interaction.editReply(`${member.displayName} has been permanently muted.\nReason: ${reason || 'No Reason Provided'}`);
      }
    } catch (error) {
      console.error(error);
    }
  },
};

function parseDuration(durationString) {
  const parsed = ms(durationString);
  if (!parsed) {
    const match = durationString.match(/(\d+)\s*(\w+)/);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      switch (unit) {
        case 's':
          return value * 1000; // seconds to milliseconds
        case 'm':
          return value * 60 * 1000; // minutes to milliseconds
        case 'h':
          return value * 60 * 60 * 1000; // hours to milliseconds
        case 'd':
          return value * 24 * 60 * 60 * 1000; // days to milliseconds
        default:
          return NaN; // Invalid format
      }
    } else {
      return NaN; // Invalid format
    }
  }
  return parsed;
}
