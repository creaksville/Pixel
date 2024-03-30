const getConnection = require('../../functions/database/connectDatabase');
const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const calculateLevelXp = require("../../utils/calculateLevelXp");
const canvacord = require('canvacord');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('xp')
        .setDescription('Retrieve XP')
        .addUserOption(option =>
            option
              .setName('user')
              .setDescription('Choose a User')),
    usage: '<user>',
    async execute(interaction, client) {
        try {
            const mentionedUserId = interaction.options.getUser('user')?.id;
            const specifiedUserId = mentionedUserId || interaction.member?.user.id;
            const specifiedUserObj = await interaction.guild?.members.fetch(specifiedUserId);
            const guildId = interaction.guild?.id;
            
            // Execute MySQL queries
            const connection = await getConnection();
            const [rows] = await connection.query('SELECT * FROM level WHERE userId = ? AND guildId = ?', [
                specifiedUserId,
                interaction.guild?.id,
            ]);
            console.log('Rows:', rows);

            const [miscRows] = await connection.query('SELECT mastercolor FROM cfg_misc WHERE guild_id = ?', [interaction.guild?.id]);
            const [userColorRow] = await connection.query(`SELECT * FROM user_config WHERE user_id = ${mentionedUserId || interaction.member?.user.id} AND guild_id = ?`, [guildId]);

            console.log('Misc Rows:', miscRows);

            const [rankingsRows] = await connection.query('SELECT levels, role_id FROM lvlroles WHERE guild_id = ? ORDER BY levels ASC', [interaction.guild?.id]);
            console.log('Rankings Rows:', rankingsRows);

            const fetchedLevel = rows[0];
            const ranks = rankingsRows;

            let embedColor;
            const defaultColor = miscRows[0].mastercolor;
            const userColor = userColorRow[0].usercolor;
            
            if (!userColor) {
                embedColor = defaultColor;
            } else if (userColor) {
                embedColor = userColor;
            }

            connection.release();

            if (!fetchedLevel) {
                interaction.reply(
                    mentionedUserId ? `${specifiedUserObj?.user} doesn't have any XP yet!!` : `You Don't have Any XP Yet`
                );
                return;
            }

            const xpNeeded = calculateLevelXp(fetchedLevel.level);
            const xpPercentage = Math.floor((fetchedLevel?.xp / xpNeeded) * 100);
            const xpBar = getXPBar(fetchedLevel?.xp, xpNeeded, xpPercentage, fetchedLevel);
            const nextUp = ranks?.find(m => rows?.level < m.levels);

            let nextUpStr = '';
            if (!nextUp) {
                nextUpStr = `There are no ranks upcoming :(`
            } else {
                const left = nextUp.levels - fetchedLevel.level;
                nextUpStr = `**${left} level${left == 1 ? '' : 's'}** left to reach <@&${nextUp.role_id}>!`
            }

            if (!isNaN(xpNeeded) && !isNaN(fetchedLevel.xp)) {
                nextUpStr += `\n**${xpNeeded - fetchedLevel.xp} XP** left to reach level ${fetchedLevel.level + 1}!`;
            }

            const allLevels = await connection.query('SELECT userId FROM level WHERE guildId = ? ORDER BY level DESC, xp DESC', [interaction.guild?.id]);

            const allLevelsArray = allLevels[0];
            const currentRank = allLevelsArray.findIndex((lvl) => lvl.userId === specifiedUserId) + 1;

            // Check if the user's status is defined, or set it to 'online' if undefined
            const userStatus = specifiedUserObj?.presence?.status || 'online';

            /*const rank = new canvacord.Rank()
                .setAvatar(specifiedUserObj?.user.displayAvatarURL({ size: 256 }))
                .setLevel(fetchedLevel.level)
                .setRank(currentRank)
                .setCurrentXP(fetchedLevel.xp)
                .setRequiredXP(xpNeeded)
                .setStatus(userStatus) // Pass the user's status here
                .setProgressBar(embedColor)
                .setUsername(specifiedUserObj?.user.username);

            const data = await rank.build();
            const attachment = new AttachmentBuilder(data);

            interaction.reply({ files: [attachment] });*/

            const rank = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle(`XP for ${specifiedUserObj?.user.username}`)
                .setDescription(`${nextUpStr}`)
                .addFields({ name: '**XP**', value: `${fetchedLevel.xp}`, inline: true})
                .addFields({ name: '**Total XP**', value: `${fetchedLevel.totalxp}`, inline: true})
                .addFields({ name: '**Level**', value: `${fetchedLevel.level}`, inline: true})
                .addFields({ name: '**XP Progress**', value: `${xpBar}`})
                .setThumbnail(specifiedUserObj?.user.displayAvatarURL({ size: 256 }))
                .setTimestamp()
            
            interaction.reply({ embeds: [rank] })
        } catch (error) {
            console.error(error);
        }
    }
};

function getXPBar(xp, xpNeeded, xpPercentage, row) {
    const progress = Math.floor((xp / xpNeeded) * 10);
    const filledBar = '🟥'.repeat(progress);
    const emptyBar = '⬛'.repeat(10 - progress);
    const percentageBar = `${xpPercentage}%`;
    return `[${row.xp}/${xpNeeded}] ${filledBar}${emptyBar} ${percentageBar}`;
}
