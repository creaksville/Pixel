const fs = require('fs');
const config = require('../../config/config');
const { SlashCommandBuilder } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check Your Balance')
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Select a user to check their balance')
    ),
  usage: '<user>',
  async execute(interaction, client) {
    try {
      await interaction.deferReply();

      const connection = await getConnection();
      const userId = interaction.options.getUser('user')?.id || interaction.user.id;

      const [economyRows] = await connection.query('SELECT * FROM economy WHERE guild_id = ? AND user_id = ?', [interaction.guild?.id, userId]);

      if (economyRows.length === 0) {
        await interaction.editReply('This user does not have an economy entry.');
      } else {
        const userEntry = economyRows[0];
        const walletBalance = userEntry.wallet || 0;
        const bankBalance = userEntry.bank || 0;
        const totalBalance = walletBalance + bankBalance;

        await interaction.editReply(`**${userEntry.username}'s Balance**\nWallet: ${walletBalance} points\nBank: ${bankBalance} points\nTotal: ${totalBalance} points`);
      }

      connection.release();
    } catch (error) {
      console.error(error);
      await interaction.editReply('An error occurred while checking the balance.');
    }
  },
};
