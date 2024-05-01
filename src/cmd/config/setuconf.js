const { Client, ApplicationCommandOptionType, SlashCommandBuilder } = require("discord.js");
const getConnection = require("../../functions/database/connectDatabase");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setuconf")
        .setDescription("Updates a User Configuration Setting (DEPRECATED SOON)")
        .addStringOption(option =>
            option
                .setName('setting')
                .setDescription('Selects a Setting to Change')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('value')
                .setDescription('The Value for the Setting')
                .setRequired(true)
        ),
        usage: '<table> <setting> <value>',
        async execute(interaction, client) {
        try {
            await interaction.deferReply();
            const table = 'user_config';
            const setting = interaction.options.getString('setting');
            const value = interaction.options.getString('value');

            if (!table || !setting || !value) {
                return interaction.editReply('Please specify the setting, and value.');
            }

            const guildId = interaction.guild.id;
            const userId = interaction.member?.user.id;
            const guildname = interaction.guild.name;
            const username = interaction.member?.user.username;

            // Define the map of tables to SQL table names

            const tableName = table;

            if (!tableName) {
                return interaction.editReply('Invalid table name.');
            }

            let newValue;
            let outputValue;
            if (value == 'true' || value == 'True' || value === 'TRUE') {
                newValue = 1;
                outputValue = 'True';
            } else if (value == 'false' || value == 'False' || value === 'FALSE') {
                newValue = 0;
                outputValue = 'False';
            } else if (value == 'default' || value == 'Default' || value == 'DEFAULT'){
                newValue = null;
                outputValue = 'Default'
            } else {
                newValue = value;
                outputValue = value;
            }

            // Update the setting in MySQL
            const connection = await getConnection();
            const [userRecord] = await connection.query("SELECT * FROM user_config WHERE user_id = ? AND guild_id = ?", [userId, guildId]);

            if (userRecord.length === 0) {
                connection.query(`INSERT INTO user_config (user_id, username, guild_id, guildname, ${setting}) VALUES (?, ?, ?, ?, ?)`, [userId, username, guildId, guildname, newValue]);
            } else {
                connection.query(`UPDATE user_config SET ${setting} = ? WHERE user_id = ? AND guild_id = ?`, [newValue, userId, guildId]);
            }
            connection.release();

            interaction.editReply(`Setting updated:\nTable Name: ${table}\nSetting: ${setting}\nValue: ${outputValue}`);

        } catch (error) {
            console.error(error);
            interaction.editReply('An error occurred while updating the setting.');
        }
    },
};
