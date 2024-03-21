const { SlashCommandBuilder } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

const cooldowns = new Map();
const cooldownTime = 600000; // 10 minutes in milliseconds

// Define your max points, prize amount, and ticket cost
const maxPoints = 1000; // Change this to your desired max points
const prizeAmount = Math.floor(Math.random() * 1000000) + 150000;
const ticketCost = 50; // Change this to the ticket cost

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lottery')
    .setDescription('Participate in a lottery')
    .addStringOption(option =>
      option
        .setName('tickets')
        .setDescription('Number of lottery tickets to buy')
    ),
  usage: '<tickets>',
  async execute(interaction, client) {
    try {
      await interaction.deferReply();
      const userId = interaction.user.id;

      const connection = await getConnection();
      const [economyRows] = await connection.query('SELECT * FROM economy WHERE guild_id = ? AND user_id = ?', [interaction.guild?.id, userId]);
      let walletBalance = economyRows[0].wallet;
      connection.release();

      const tickets = parseInt(interaction.options.getString('tickets'));

      if (isNaN(tickets) || tickets <= 0) {
        await interaction.followUp('Please enter a valid number of tickets to buy.');
        return;
      }

      if (walletBalance < tickets * ticketCost) {
        await interaction.followUp('You don\'t have enough points to buy these tickets.');
        return;
      }

      const now = Date.now();
      const cooldown = cooldowns.get(userId);

      if (cooldown && now < cooldown) {
        const timeLeft = ((cooldown - now) / 1000).toFixed(0);
        await interaction.followUp(`You have to wait ${timeLeft} seconds before buying more lottery tickets.`);
        return;
      }

      // Set the cooldown for the user
      cooldowns.set(userId, now + cooldownTime);
      setTimeout(() => cooldowns.delete(userId), cooldownTime);

      // Calculate the winning chance based on wallet balance
      const winningChance = 1 - walletBalance / maxPoints;
      const isWinner = Math.random() < winningChance;

      if (isWinner) {
        // User won the lottery
        walletBalance += prizeAmount * tickets;
        await interaction.followUp(`Congratulations! You won the lottery and received ${prizeAmount * tickets} points.`);
      } else {
        // User lost the lottery
        walletBalance -= ticketCost * tickets;
        await interaction.followUp(`Sorry, you didn't win. You lost ${ticketCost * tickets} points.`);
      }

      // Update the user's wallet balance in the database
      const updateQuery = 'UPDATE economy SET wallet = ? WHERE guild_id = ? AND user_id = ?';
      const updateConnection = await getConnection();
      await updateConnection.query(updateQuery, [walletBalance, interaction.guild.id, userId]);
      updateConnection.release();

    } catch (error) {
      console.error(error);
    }
  },
};
