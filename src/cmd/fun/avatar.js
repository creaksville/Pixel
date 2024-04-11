const getConnection = require('../../functions/database/connectDatabase');
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Retrieve User\'s Avatar')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('The User You Want to Grab the Avatar Of')
            .setRequired(true)),
    usage: `<user>`,
    async execute(interaction, client) {
        try {
            let user = interaction.options.getUser('user');
            const guildId = interaction.guild?.id;
    
            if (!user) {
                return interaction.reply('Could not find user.');
            }
            
            const connection = await getConnection();
                const [cfgMiscRows] = await connection.query("SELECT * FROM cfg_misc WHERE guild_id = ?", [guildId]);
                const [userColorRow] = await connection.query(`SELECT * FROM user_config WHERE user_id = ${interaction.member?.user.id || user.id} AND guild_id = ?`, [guildId]);
            const defaultColor = cfgMiscRows[0].mastercolor;
            const userColor = userColorRow[0].usercolor;
            let embedColor;
            
            if (!userColor) {
                embedColor = defaultColor;
            } else if (userColor) {
                embedColor = userColor;
            }

            connection.release();

            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle(`${user.tag}'s Avatar`)
                .addFields({ name: '**Link As**', value: `[png](${user.avatarURL({ format: 'png' })}) | [jpg](${user.avatarURL({ format: 'jpg' })}) | [webp](${user.avatarURL({ format: 'png', dynamic: false, size: 1024 })})`})
                .setImage(user.avatarURL({ format: 'png', dynamic: false, size: 1024}))
                .setTimestamp();
    
            interaction.reply({ embeds: [embed] });
        } catch(error) {
            console.error(error);
        }
    }
};
