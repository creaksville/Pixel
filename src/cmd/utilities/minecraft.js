const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
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
                            { name: 'Online', value: 'online'},
                            { name: 'Offline', value: 'offline'}
                        )
                )
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

            const statusRecord = serverStatus[0].status;
            const statusChannel = channel[0].minecraft;
            const setChannel = await client.channels.fetch(statusChannel);
            let embedRecord;

            if (statusRecord === 'Online' || statusRecord === 'online') {
                embedRecord = '🟢: Online'
            } else if (statusRecord === 'Offline' || statusRecord === 'offline') {
                embedRecord = '🔴: Offline'
            }
            
            if (interaction.options.getSubcommand() === 'set') {
                const statusOption = interaction.options.getString('status');
                if (statusOption === 'online') {
                    const onlineTopic = 'Status: 🟢 Online | IP: hhavensmp.com';
                    connection.query(`UPDATE cfg_misc SET status = ? WHERE guild_id = ?`, [statusOption, interaction.guild.id]);
                    await setChannel.edit({ topic: onlineTopic, name: '🟢-server-status' });
                    await interaction.editReply('Status Updated in Topic and in Database');
                } else if (statusOption === 'offline') {
                    const offlineTopic = 'Status: 🔴 Offline | IP: hhavensmp.com';
                    connection.query(`UPDATE cfg_misc SET status = ? WHERE guild_id = ?`, [statusOption, interaction.guild.id]);
                    await setChannel.edit({ topic: offlineTopic, name: '🔴-server-status'  });
                    await interaction.editReply('Status Updated in Topic and in Database');
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