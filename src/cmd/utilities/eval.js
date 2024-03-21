const getConnection = require('../../functions/database/connectDatabase');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
      .setName('eval')
      .setDescription('Evaluates Arbitrary JS Code/Does Math')
      .addStringOption(option =>
        option
          .setName('expression')
          .setDescription('The Mathematical Equation you want Evaluated')
          .setRequired(true)),
    usage: '<code|math>',
    async execute(interaction, client) {
    try {
      const guildId = interaction.guild?.id;
      const userId = interaction.member.user.id;

      const connection = await getConnection();
        const [miscRows] = await connection.query("SELECT mastercolor FROM cfg_misc WHERE guild_id = ?", [guildId]);
        const [userColorRow] = await connection.query(`SELECT * FROM user_config WHERE user_id = ? AND guild_id = ?`, [userId, guildId]);
      connection.close();

      const defaultColor = miscRows[0].mastercolor;
      const userColor = userColorRow[0].usercolor;
      let embedColor;
            
      if (!userColor) {
        embedColor = defaultColor;
      } else if (userColor) {
        embedColor = userColor;
      }

      const expression = interaction.options.getString('expression');

      // Check if the expression contains any non-mathematical characters
      if (/[^-+*/0-9.()%]/g.test(expression)) {
        await interaction.reply("Invalid characters in the expression. Only basic mathematical operations are allowed.");
        return;
      }

            // Perform the mathematical evaluation
      let result = eval(expression);

      const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle('Mathematical Evaluation Results')
        .addFields({ name: 'Expression', value: `\`\`\`${expression}\`\`\`` })
        .addFields({ name: 'Result', value: `\`\`\`${result}\`\`\`` });

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(error);
      interaction.reply(`An error occurred: \`${error}\``);
    }
  },
};
