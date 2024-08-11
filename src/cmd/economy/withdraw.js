const { SlashCommandBuilder } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('withdraw')
    .setDescription('Withdraw Points from the Bank')
    .addStringOption(option =>
      option
        .setName('amount')
        .setDescription('Amount to withdraw (e.g., "all", "half", or a specific amount)')
    ),
  usage: '<amount>',
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

        const withdrawAmount = interaction.options.getString('amount');

        if (withdrawAmount.toLowerCase() === 'all') {
          // Withdraw the entire bank balance to the wallet.
          userEntry.wallet += bankBalance;
          userEntry.bank = 0;
        } else if (withdrawAmount.toLowerCase() === 'half') {
          // Withdraw half of the bank balance to the wallet.
          const halfAmount = Math.floor(bankBalance / 2);
          userEntry.wallet += halfAmount;
          userEntry.bank -= halfAmount;
        } else {
          const specificAmount = parseInt(withdrawAmount, 10);
          if (!isNaN(specificAmount) && specificAmount > 0 && specificAmount <= bankBalance) {
            // Withdraw the specified amount from the bank to the wallet.
            userEntry.wallet += specificAmount;
            userEntry.bank -= specificAmount;
          } else {
            await interaction.editReply('Invalid withdrawal amount or insufficient funds in your bank.');
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

        await interaction.editReply(`Withdrawn points from your bank to your wallet. New balances:\nWallet: ${userEntry.wallet} points\nBank: ${userEntry.bank} points`);
      }

      connection.release();
    } catch (error) {
      console.error(error);
      await interaction.editReply('An error occurred while processing the withdrawal.');
    }
  },
};
