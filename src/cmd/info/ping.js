const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const getConnection = require("../../functions/database/connectDatabase"); // Import your MySQL connection pool
const wait = require('node:timers/promises').setTimeout;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Return Client Ping'),
    usage: '',
    async execute(interaction, client) {
        const userId = interaction.member.user.id;
        const guildId = interaction.guild?.id;
        await interaction.deferReply();

        const connection = await getConnection();
            const [cfgMiscRows] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [guildId]);
            const [userColorRow] = await connection.query("SELECT * FROM user_config WHERE user_id = ? AND guild_id = ?", [userId, guildId]);
        const defaultColor = cfgMiscRows[0].mastercolor;
        const userColor = userColorRow[0].usercolor;
        let embedColor;
        
        if (!userColor) {
            embedColor = defaultColor;
        } else if (userColor) {
            embedColor = userColor;
        }

        connection.release();

        const gettingReadyPingMessage = `API Latency: \nClient Ping: `;
        const beforeAPIPingMessage = `API Latency: Pinging...\nClient Ping: `;
        const afterAPIPingMessage = `API Latency: ${client.ws.ping}ms\nClient Ping: `;
        const beforeClientPingMessage = `API Latency: ${client.ws.ping}ms\nClient Ping: Pinging...`;
        const afterPingMessage = `API Latency: ${client.ws.ping}ms\nClient Ping: ${Date.now() - interaction.createdTimestamp}ms`;

        const gettingReadyPingEmbed = new EmbedBuilder()
            .setColor(embedColor) // Use a type assertion here
            .setTitle('Please Wait...')
            .setDescription('Currently Gathering Ping Data From Discord')
            .addFields({ name: 'Current Ping Time:', value: `${gettingReadyPingMessage}` });

        const beforeAPIPingEmbed = new EmbedBuilder()
            .setColor(embedColor) // Use a type assertion here
            .setTitle('Please Wait...')
            .setDescription('Currently Gathering Ping Data From Discord')
            .addFields({ name: 'Current Ping Time:', value: `${beforeAPIPingMessage}` });

        const afterAPIPingEmbed = new EmbedBuilder()
            .setColor(embedColor) // Use a type assertion here
            .setTitle('Please Wait...')
            .setDescription('Currently Gathering Ping Data From Discord')
            .addFields({ name: 'Current Ping Time:', value: `${afterAPIPingMessage}` });

        const beforeClientPingEmbed = new EmbedBuilder()
            .setColor(embedColor) // Use a type assertion here
            .setTitle('Please Wait...')
            .setDescription('Currently Gathering Ping Data From Discord')
            .addFields({ name: 'Current Ping Time:', value: `${beforeClientPingMessage}` });

        const afterPingEmbed = new EmbedBuilder()
            .setColor(embedColor) // Use a type assertion here
            .setTitle('Ping Time')
            .setDescription('The Ping for The Application')
            .addFields({ name: 'Current Ping Time:', value: `${afterPingMessage}` });

                    
        await interaction.editReply({ embeds: [gettingReadyPingEmbed] });
        await wait(3000);
        await interaction.editReply({ embeds: [beforeAPIPingEmbed] });
        await wait(3000);
        await interaction.editReply({ embeds: [afterAPIPingEmbed] });
        await wait(3000);
        await interaction.editReply({ embeds: [beforeClientPingEmbed] });
        await wait(3000);
        await interaction.editReply({ embeds: [afterPingEmbed] });
    }
}