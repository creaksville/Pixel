const { Client, ApplicationCommandOptionType, SlashCommandBuilder } = require("discord.js");
const getConnection = require("../../functions/database/connectDatabase");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("genuconf")
        .setDescription("Generates a User Configuration Setting"),
    usage: '<table> <setting> <value>',
    async execute(interaction, client) {
        try {
            await interaction.deferReply();
            const table = 'user_config';

            const guildId = interaction.guild.id;
            const userId = interaction.member?.user.id;
            const guildname = interaction.guild.name;
            const username = interaction.member?.user.username;

            const tableName = table;

            if (!tableName) {
                return interaction.editReply('Invalid table name.');
            }

            const connection = await getConnection();
            const [userRecord] = await connection.query("SELECT * FROM user_config WHERE user_id = ? AND guild_id = ?", [userId, guildId]);

            if (userRecord.length === 0) {
                connection.query(`INSERT INTO user_config (user_id, username, guild_id, guildname, usercolor) VALUES (?, ?, ?, ?, ?)`, [userId, username, guildId, guildname, null]);
            } else {
                interaction.editReply('You Already Have a User Configuration...There is no need to generate one!!')
            }

            connection.release();
            interaction.editReply(`Configuration Generated!! To Update the Config, please run /setuconf. To Obtain the current Config, run /getuconf`);

        } catch (error) {
            console.error(error);
            interaction.editReply('An error occurred while updating the setting.');
        }
    },
};
