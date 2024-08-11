const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setuptrackedrolesmessage')
        .setDescription('Sets up the message to track roles.')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel where the message will be sent.')
                .setRequired(true)),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');

        if (channel.type !== ChannelType.GuildText) {
            return interaction.reply({ content: 'Please select a text channel.', ephemeral: true });
        }

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('Members with Tracked Roles')
            .setDescription('No members with these roles.')
            .setThumbnail(client.user?.displayAvatarURL())
            .setTimestamp();

        const message = await channel.send({ embeds: [embed] });

        const connection = await getConnection();
        await connection.query("INSERT INTO tracked_roles_message (guild_id, channel_id, message_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE channel_id = ?, message_id = ?",
            [interaction.guild.id, channel.id, message.id, channel.id, message.id]);
        connection.release();

        await interaction.reply({ content: `Tracking message has been set up in ${channel}`, ephemeral: true });
    }
};
