const { SlashCommandBuilder, SelectMenuBuilder } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removebalance')
    .setDescription('Removes Balance from Wallet or Bank')
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Amount to remove')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('target')
        .setDescription('Select where to remove balance')
        .setRequired(true)
        .addChoices(
            { name: 'Wallet', value: 'wallet'},
            { name: 'Bank', value: 'bank'}
        )
    ),
  usage: '<amount>',
  async execute(interaction, client) {
    try {
      await interaction.deferReply();

      const amount = interaction.options.getInteger('amount');
      const userId = interaction.user.id;

      const target = interaction.options.getString('target');

      const connection = await getConnection();
      const [economyRows] = await connection.query('SELECT * FROM economy WHERE guild_id = ? AND user_id = ?', [interaction.guild?.id, userId]);

      if (economyRows.length === 0) {
        await interaction.followUp('You do not have an economy entry.');
      } else {
        const userEntry = economyRows[0];

        if (target === 'wallet') {
          userEntry.wallet -= amount;
        } else if (target === 'bank') {
          userEntry.bank -= amount;
        }

        await connection.query('UPDATE economy SET wallet = ?, bank = ? WHERE guild_id = ? AND user_id = ?', [
          userEntry.wallet,
          userEntry.bank,
          interaction.guild?.id,
          userId,
        ]);

        await interaction.followUp(`Removed ${amount} points to your ${target}. New balances:\nWallet: ${userEntry.wallet} points\nBank: ${userEntry.bank} points`);
      }

      connection.release();
    } catch (error) {
      console.error(error);
      await interaction.followUp('An error occurred while removing balance.');
    }
  },
};
