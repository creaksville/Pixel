const { Client, ApplicationCommandOptionType, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const getConnection = require("../../functions/database/connectDatabase");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setlogger")
        .setDescription("Updates a Configuration Setting in a Specific DB Table (DEPRECATED SOON)")
        .addStringOption(option =>
            option
                .setName('table')
                .setDescription('Table to Look At')
                .setRequired(true)
                .addChoices(
                    { name: 'Enable/Disable', value: 'logger_enable' },
                    { name: 'Channel IDs', value: 'logger_channels' },
        ))
        .addStringOption(option =>
            option
                .setName('setting')
                .setDescription('Selects a Setting to Change')
                .setRequired(true)
                .addChoices(
                    { name: 'Channel Create', value: 'channelCreate' },
                    { name: 'Channel Delete', value: 'channelDelete' },
                    { name: 'Channel Update', value: 'channelUpdate' },
                    { name: 'Guild Ban', value: 'guildBanAdd' },
                    { name: 'Guild Unban', value: 'guildBanRemove' },
                    { name: 'Guild Emoji Create', value: 'guildEmojisCreate' },
                    { name: 'Guild Emoji Delete', value: 'guildEmojisDelete' },
                    { name: 'Guild Emoji Update', value: 'guildEmojisUpdate' },
                    { name: 'Guild Member Joins', value: 'guildMemberAdd' },
                    { name: 'Guild Member Leaves', value: 'guildMemberDelete' },
                    { name: 'Guild Member Kick', value: 'guildMemberKick' },
                    { name: 'Guild Member Nickname Update', value: 'guildMemberNickUpdate' },
                    { name: 'Guild Member Update', value: 'guildMemberUpdate' },
                    { name: 'Guild Role Created', value: 'guildRoleCreate' },
                    { name: 'Guild Role Deleted', value: 'guildRoleDelete' },
                    { name: 'Guild Role Updated', value: 'guildRoleUpdate' },
                    { name: 'Guild Update', value: 'guildUpdate' },
                    { name: 'Message Delete', value: 'messageDelete' },
                    { name: 'Message Bulk Delete', value: 'messageDeleteBulk' },
                    { name: 'Message Update', value: 'messageUpdate' },
                    { name: 'Voice Channel Join', value: 'voiceChannelJoin' },
                    { name: 'Voice Channel Leave', value: 'voiceChannelLeave' },
                    { name: 'Voice Channel Switch', value: 'voiceChannelSwitch' },
                    { name: 'Voice State Update', value: 'voiceStateUpdate' },
                    { name: 'All', value: 'all' }
                )
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
            const selectsetting = interaction.options.getString('setting');
            const value = interaction.options.getString('value');

            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return await interaction.reply('You Cannot Use This Command: Insufficient Permissions')
            }

            if (!table || !selectsetting || !value) {
                return interaction.editReply('Please specify the table, setting, and value.');
            }

            if (selectsetting === 'all') {
                const settings = [
                    'channelCreate',
                    'channelDelete',
                    'channelUpdate',
                    'guildBanAdd',
                    'guildBanRemove',
                    'guildEmojisCreate',
                    'guildEmojisDelete',
                    'guildEmojisUpdate',
                    'guildMemberAdd',
                    'guildMemberDelete',
                    'guildMemberKick',
                    'guildMemberNickUpdate',
                    'guildMemberUpdate',
                    'guildRoleCreate',
                    'guildRoleDelete',
                    'guildRoleUpdate',
                    'guildUpdate',
                    'messageDelete',
                    'messageDeleteBulk',
                    'messageUpdate',
                    'voiceChannelJoin',
                    'voiceChannelLeave',
                    'voiceChannelSwitch',
                    'voiceStateUpdate',
                ];

                // Update each setting individually
                const connection = await getConnection();
                const guildId = interaction.guild.id;
                const newValue = (value === 'true' || value === 'True' || value === 'TRUE') ? 1 : (value === 'false' || value === 'False' || value === 'FALSE') ? 0 : value;
                const updates = settings.map(setting => {
                    const sql = `UPDATE ${table} SET ${setting} = ? WHERE guild_id = ?`;
                    return connection.query(sql, [newValue, guildId]);
                });

                await Promise.all(updates); // Wait for all update queries to complete
                connection.release();

                interaction.editReply(`Settings updated:\nTable Name: ${table}\nValue: ${value}`);
            } else {
                const guildId = interaction.guild.id;

                // Define the map of tables to SQL table names
                const tableMap = {
                    logger_enable: 'logger_enable',
                    logger_channels: 'logger_channels',
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

                const connection = await getConnection();
                const sql = `UPDATE ${tableName} SET ${selectsetting} = ? WHERE guild_id = ?`;
                const [results] = await connection.query(sql, [newValue, guildId]);
                connection.release();

                if (results.affectedRows > 0) {
                    interaction.editReply(`Setting updated:\nTable Name: ${table}\nSetting: ${selectsetting}\nValue: ${outputValue}`);
                } else {
                    interaction.editReply('No setting updated. Check your table and setting name.');
                }
            }
        } catch (error) {
            console.error(error);
            interaction.editReply('An error occurred while updating the setting.');
        }
    },
};