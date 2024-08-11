const { SlashCommandBuilder } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

// Create a collection to store cooldown information.
const cooldowns = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('work')
    .setDescription('Earn Points by Working'),
  usage: '<user>',
  async execute(interaction, client) {
    try {
      const userId = interaction.user.id;

      // Check if the user is on cooldown.
      if (cooldowns.has(userId)) {
        const cooldownTime = cooldowns.get(userId);
        const currentTime = Date.now();

        if (currentTime < cooldownTime) {
          const remainingTime = Math.ceil((cooldownTime - currentTime) / 1000); // Convert milliseconds to seconds.
          await interaction.reply(`You're on cooldown. You can work again in ${remainingTime} seconds.`);
          return;
        }
      }

      await interaction.deferReply();

      // Generate a random number between 1 and 200 for points earned.
      const pointsEarned = Math.floor(Math.random() * 200) + 1;

      const connection = await getConnection();

      const [economyRows] = await connection.query('SELECT * FROM economy WHERE guild_id = ? AND user_id = ?', [interaction.guild?.id, userId]);

      if (economyRows.length === 0) {
        await interaction.editReply('You do not have an economy entry.');
      } else {
        const userEntry = economyRows[0];

        // Update the user's wallet balance with the points earned.
        userEntry.wallet += pointsEarned;

        // Update the economy table with the new wallet balance.
        await connection.query('UPDATE economy SET wallet = ? WHERE guild_id = ? AND user_id = ?', [
          userEntry.wallet,
          interaction.guild?.id,
          userId,
        ]);

        // Set the cooldown for this user.
        const cooldownTime = Date.now() + 10 * 60 * 1000; // 10 minutes cooldown in milliseconds.
        cooldowns.set(userId, cooldownTime);

        await interaction.editReply(`You earned ${pointsEarned} points by working! New wallet balance: ${userEntry.wallet} points.`);
      }

      connection.release();
    } catch (error) {
      console.error(error);
      await interaction.editReply('An error occurred while processing your work reward.');
    }
  },
};
