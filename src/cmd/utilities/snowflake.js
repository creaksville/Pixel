const getConnection = require('../../functions/database/connectDatabase');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('snowflake')
        .setDescription('Get join date of a user by their User ID')
        .addStringOption(option =>
            option
                .setName('id')
                .setDescription('The User\'s Numerical ID you want to get the snowflake of')),
    usage: '<userid>',
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

            const user = interaction.options.getString('id');
              
            const fetchedUser = await client.users.fetch(user);

            if (!user) {
                return message.reply(`Could not find user with ID '${user}'.`);
            }

            // Get the join date of the user
            const createdAt = fetchedUser.createdAt.toLocaleString('en-US');

            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle(`${fetchedUser.username}'s Account Creation Date`)
                .setDescription(`${createdAt}`);

            await interaction.reply({ embeds: [embed] });
        } catch(error) {
            console.error(error);
        }
    },
};