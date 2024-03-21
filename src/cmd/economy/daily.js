const fs = require('fs');
const config = require('../../config/config');
const { SlashCommandBuilder } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Collect Your Daily Points'),
  usage: '<question>',
  async execute(interaction, client) {
    try {

      const connection = await getConnection();
      const userId = interaction.options.getUser('user')?.id || interaction.user.id;
      const username = interaction.options.getUser('user')?.username || interaction.user.username;

      const [economyRows] = await connection.query('SELECT * FROM economy WHERE guild_id = ? AND user_id = ?', [interaction.guild?.id, userId]);

      if (economyRows.length === 0) {
        // If the user doesn't have an entry in the economy table, create one.
        await connection.query('INSERT INTO economy (guild_id, guildname, user_id, username, wallet, last_daily) VALUES (?, ?, ?, ?, ?, ?)', [
          interaction.guild?.id,
          interaction.guild?.name,
          userId,
          username,
          1000,
          Date.now(), // Set the last_daily value to the current timestamp using Date.now().
        ]);
      } else {
        const userEntry = economyRows[0];
        const lastDailyTimestamp = userEntry.last_daily;

        // Calculate the current timestamp using Date.now().
        const currentTimestamp = Date.now();

        // Calculate the time elapsed since the last daily command in milliseconds.
        const timeElapsed = currentTimestamp - lastDailyTimestamp;

        if (timeElapsed >= 86400000) {
          // More than 24 hours have passed since the last daily command (86400000 milliseconds in 24 hours).

          // Update the last_daily timestamp to the current timestamp.
          await connection.query('UPDATE economy SET wallet = wallet + 1000, last_daily = ? WHERE guild_id = ? AND user_id = ?', [
            currentTimestamp,
            interaction.guild?.id,
            userId,
          ]);

          await interaction.reply('You collected your daily points! You now have 1000 additional points.');
        } else {
          // The user already collected their daily points today.
          const timeRemaining = 86400000 - timeElapsed;

          const hoursRemaining = Math.ceil(timeRemaining / 3600000); // Convert milliseconds to hours.

          await interaction.reply(`You already collected your daily points. You can collect again in ${hoursRemaining} hours.`);
        }
      }

      connection.release();
    } catch (error) {
      console.error(error);
      await interaction.reply('An error occurred while processing your daily points.');
    }
  },
};
