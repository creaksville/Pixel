const { SlashCommandBuilder, SelectMenuBuilder } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resetbalance')
    .setDescription('Resets Balance'),
  usage: '<amount>',
  async execute(interaction, client) {
    try {
      await interaction.deferReply();

      const connection = await getConnection();
      const [economyRows] = await connection.query('SELECT * FROM economy WHERE guild_id = ?', [interaction.guild?.id]);

      if (economyRows.length === 0) {
        await interaction.followUp('There is no Entries in the Economy.');
      } else {
        await connection.query('UPDATE economy SET wallet = ?, bank = ? WHERE guild_id = ?', [
          0,
          0,
          interaction.guild?.id,
        ]);

        await interaction.followUp(`Balance is Reset`);
      }

      connection.release();
    } catch (error) {
      console.error(error);
      await interaction.followUp('An error occurred while removing balance.');
    }
  },
};
