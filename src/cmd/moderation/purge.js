const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ms = require('ms');
const getConnection = require('../../functions/database/connectDatabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Deletes a Set Number of Messages')
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Number of Messages to Remove')
        .setRequired(true)),
    usage: '<# of messages>',
  async execute(interaction, client) {
    try {
      const memberPerms = interaction.member;

      if (!memberPerms.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return await interaction.reply('You Cannot Use This Command: Insufficient Permissions');
      }

      const number = interaction.options.getInteger('amount');

      if (!number) return interaction.reply('Please Specify a Number of Messages to Clear');
      if (isNaN(number)) return interaction.reply('This is Not a Number, Please Specify a Number');
      if (number > 100) return interaction.reply('Cannot Complete Request: Specify a Number less than 100');
      if (number < 1) return interaction.reply('Cannot Complete Request: Specify a Number Greater than 0');

      const textChannel = interaction.channel;

      await textChannel.messages.fetch({ limit: number }).then(async (messages) => {
        const messageIDs = messages.map((message) => message.id);

        // Delete the messages by their IDs
        await textChannel.bulkDelete(messageIDs);
        await interaction.reply(`Successfully Deleted ${number} Messages`);

        // Create a connection to the MySQL database
        const connection = await getConnection();

        // Define the SQL query to add the purge action to the database
        const addPurgeQuery = "INSERT INTO mod_tracker (guild_id, guild_name, modname, modevent, number_of_messages, timestamp) VALUES (?, ?, ?, ?, ?, ?)";

        // Execute the query with the necessary parameters
        await connection.query(addPurgeQuery, [interaction.guild.id, interaction.guild.name, interaction.user.username, 'Purge', number, new Date().toLocaleString()]);

        connection.release();
      });
    } catch (error) {
      console.error(error);
    }
  },
};
