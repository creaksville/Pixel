const { Client, ApplicationCommandOptionType, SlashCommandBuilder } = require("discord.js");
const getConnection = require("../../functions/database/connectDatabase");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setconf")
        .setDescription("Updates a Configuration Setting in a Specific DB Table (DEPRECATED SOON)")
        .addStringOption(option =>
            option
              .setName('table')
              .setDescription('Table to Look At')
              .setRequired(true)
              .addChoices(
                { name: 'Enable/Disable', value: 'cfg_enable' },
                { name: 'Channel IDs', value: 'cfg_channels' },
                { name: 'Intervals', value: 'cfg_interval' },
                { name: 'Miscellaneous', value: 'cfg_misc'}
        ))
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
            const table = interaction.options.getString('table');
            const setting = interaction.options.getString('setting');
            const value = interaction.options.getString('value');

            if (!table || !setting || !value) {
                return interaction.editReply('Please specify the table, setting, and value.');
            }

            const guildId = interaction.guild.id;

            // Define the map of tables to SQL table names
            const tableMap = {
                cfg_enable: 'cfg_enable',
                cfg_channels: 'cfg_channels',
                cfg_misc: 'cfg_misc',
            };

            const tableName = tableMap[table];

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
            } else {
                newValue = value;
                outputValue = value;
            }

            // If setting is for Miscellaneous and the value is a comma-separated list of role IDs
            if (tableName === 'cfg_misc' && setting === 'autorole') {
                const roles = value.split(',').map(roleId => roleId.trim());
                // Update the setting in MySQL
                const connection = await getConnection();
                const sql = `UPDATE ${tableName} SET ${setting} = ? WHERE guild_id = ?`;
                const [results] = await connection.query(sql, [roles.join(','), guildId]);
                connection.release();

                if (results.affectedRows > 0) {
                    interaction.editReply(`Setting updated:\nTable Name: ${table}\nSetting: ${setting}\nValue: ${roles.join(', ')}`);
                } else {
                    interaction.editReply('No settings updated. Check your table and setting names.');
                }
            } else {
                // Update other settings
                const connection = await getConnection();
                const sql = `UPDATE ${tableName} SET ${setting} = ? WHERE guild_id = ?`;
                const [results] = await connection.query(sql, [newValue, guildId]);
                connection.release();

                if (results.affectedRows > 0) {
                    interaction.editReply(`Setting updated:\nTable Name: ${table}\nSetting: ${setting}\nValue: ${outputValue}`);
                } else {
                    interaction.editReply('No settings updated. Check your table and setting names.');
                }
            }
        } catch (error) {
            console.error(error);
            interaction.editReply('An error occurred while updating the setting.');
        }
    },
};
