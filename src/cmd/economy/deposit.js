const { SlashCommandBuilder } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('deposit')
    .setDescription('Deposit Points to the Bank')
    .addStringOption(option =>
      option
        .setName('amount')
        .setDescription('Amount to deposit (e.g., "all", "half", or a specific amount)')
    ),
  usage: '<amount>',
  async execute(interaction, client) {
    try {
      await interaction.deferReply();

      const connection = await getConnection();
      const userId = interaction.user.id;

      const [economyRows] = await connection.query('SELECT * FROM economy WHERE guild_id = ? AND user_id = ?', [interaction.guild?.id, userId]);

      if (economyRows.length === 0) {
        await interaction.editReply('You do not have an economy entry.');
      } else {
        const userEntry = economyRows[0];
        const walletBalance = userEntry.wallet || 0;
        const bankBalance = userEntry.bank || 0;

        const depositAmount = interaction.options.getString('amount');

        if (depositAmount.toLowerCase() === 'all') {
          // Deposit the entire wallet balance to the bank.
          userEntry.bank += walletBalance;
          userEntry.wallet = 0;
        } else if (depositAmount.toLowerCase() === 'half') {
          // Deposit half of the wallet balance to the bank.
          const halfAmount = Math.floor(walletBalance / 2);
          userEntry.bank += halfAmount;
          userEntry.wallet -= halfAmount;
        } else {
          const specificAmount = parseInt(depositAmount, 10);
          if (!isNaN(specificAmount) && specificAmount > 0 && specificAmount <= walletBalance) {
            // Deposit the specified amount from wallet to bank.
            userEntry.wallet -= specificAmount;
            userEntry.bank += specificAmount;
          } else {
            await interaction.editReply('Invalid deposit amount or insufficient funds in your wallet.');
            connection.release();
            return;
          }
        }

        // Update the economy table with the new balances.
        await connection.query('UPDATE economy SET wallet = ?, bank = ? WHERE guild_id = ? AND user_id = ?', [
          userEntry.wallet,
          userEntry.bank,
          interaction.guild?.id,
          userId,
        ]);

        await interaction.editReply(`Deposited points into your bank. New balances:\nWallet: ${userEntry.wallet} points\nBank: ${userEntry.bank} points`);
      }

      connection.release();
    } catch (error) {
      console.error(error);
      await interaction.editReply('An error occurred while processing the deposit.');
    }
  },
};
