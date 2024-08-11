const { SlashCommandBuilder, EmbedBuilder, time, TimestampStyles } = require('discord.js');
const getConnection = require("../../functions/database/connectDatabase");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('minecraft')
        .setDescription('Sets/Gets Minecraft Status')
        .addSubcommand(sub =>
            sub
                .setName('get')
                .setDescription('Get the Current Status of the Minecraft Server')
        )
        .addSubcommand(sub =>
            sub
                .setName('set')
                .setDescription('Update the Status of the Minecraft Server')
                .addStringOption(option =>
                    option
                        .setName('status')
                        .setDescription('Set the Status')
                        .setRequired(true)
                        .addChoices(
                            { name: '🟢 Online', value: 'online' },
                            { name: '🟠 Down for Maintenance', value: 'maintenance' },
                            { name: '🔴 Offline', value: 'offline' },
                            { name: '🔵 Information', value: 'info'}
                        )
                )
                .addStringOption(option =>
                    option
                        .setName('info')
                        .setDescription('The Information for the Status Update')
                        .setRequired(true)),
            ),
    usage: '<get>/<set> <status>',
    async execute(interaction, client) {
        try {
            await interaction.deferReply();
            const connection = await getConnection();
            const [serverStatus] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [interaction.guild.id])
            const [channel] = await connection.query("SELECT * FROM cfg_channels WHERE guild_id = ?", [interaction.guild.id])
            const [cfgMiscRows] = await connection.query('SELECT mastercolor FROM cfg_misc WHERE guild_id = ?', [interaction.guild?.id]);
            const [userColorRow] = await connection.query("SELECT * FROM user_config WHERE user_id = ? AND guild_id = ?", [interaction.member.user.id, interaction.guild.id]);

            const defaultColor = cfgMiscRows[0].mastercolor;
            const userColor = userColorRow[0].usercolor;
            let embedColor;
            
            if (!userColor) {
                embedColor = defaultColor;
            } else if (userColor) {
                embedColor = userColor;
            }
            const date = new Date();

            const longTime = time(date, TimestampStyles.LongTime);

            const statusRecord = serverStatus[0].status;
            const statusChannel = channel[0].minecraft;
            const setChannel = await client.channels.fetch(statusChannel);
            let embedRecord;

            if (statusRecord === 'Online' || statusRecord === 'online') {
                embedRecord = '🟢 - Online'
            } else if (statusRecord === 'Offline' || statusRecord === 'offline') {
                embedRecord = '🔴 - Offline'
            } else if (statusRecord === 'Maintenance' || statusRecord === 'maintenance') {
                embedRecord = '🟠 - Down For Maintenace'
            } else if (statusRecord === 'Info' || statusRecord === 'info') {
                embedRecord = '🔵 - Information'
            }

            
            
            if (interaction.options.getSubcommand() === 'set') {
                const statusOption = interaction.options.getString('status');
                const statusInfo = interaction.options.getString('info');
                if (statusOption === 'online') {
                    connection.query(`UPDATE cfg_misc SET status = ? WHERE guild_id = ?`, [statusOption, interaction.guild.id]);
                    await setChannel.edit({ name: '🟢-server-status' });
                    await interaction.editReply('Status Updated in Channel Name and in Database\nStatus Sent to Channel');
                    await setChannel.send(`[${longTime}] | 🟢: Server Online\n**INFO**: ${statusInfo}`)
                } else if (statusOption === 'offline') {
                    connection.query(`UPDATE cfg_misc SET status = ? WHERE guild_id = ?`, [statusOption, interaction.guild.id]);
                    await setChannel.edit({ name: '🔴-server-status'  });
                    await interaction.editReply('Status Updated in Channel Name and in Database\nStatus Sent to Channel');
                    await setChannel.send(`[${longTime}] | 🔴: Server Offline\n**INFO**: ${statusInfo}`)
                } else if (statusOption === 'maintenance') {
                    connection.query(`UPDATE cfg_misc SET status = ? WHERE guild_id = ?`, [statusOption, interaction.guild.id]);
                    await setChannel.edit({ name: '🟠-server-status' });
                    await interaction.editReply('Status Updated in Channel Name and in Database\nStatus Sent to Channel');
                    await setChannel.send(`[${longTime}] | 🟠: Server Down For Maintenance\n**INFO**: ${statusInfo}`)
                } else if (statusOption === 'info') {
                    await interaction.editReply('Status Sent to Channel');
                    await setChannel.send(`[${longTime}] | 🔵: New Information for Server\n**INFO**: ${statusInfo}`)
                }
            } else if (interaction.options.getSubcommand() === 'get') {
                const embed = new EmbedBuilder()
                    .setColor(embedColor) // Use a type assertion here
                    .setTitle('MC Server Status:')
                    .setDescription('This May Not Be Accurate 100% of the Time, its determined by whoever ran the Command')
                    .addFields({ name: 'Status', value: `${embedRecord}` });
                await interaction.editReply({ embeds: [embed]});
            }
            connection.release();
        } catch (error) {
            console.error(error);
        }
    }
}