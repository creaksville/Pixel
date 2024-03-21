const { Client, Message, TextChannel } = require('discord.js');
const getConnection = require('../database/connectDatabase'); // Import your MySQL connection pool
const calculateLevelXp = require('../../utils/calculateLevelXp');

const cooldowns = new Set();

module.exports = async (client) => {
    client.on('messageCreate', async (message) => {
        const guildId = message.guild?.id;
        const userId = message.author?.id;

        const query = {
            userId: message.author?.id,
            guildId: message.guild?.id,
            username: message.author?.username,
            guildname: message.guild?.name
        };

        try {
            const connection = await getConnection();
                const [channelRows] = await connection.query("SELECT levelup FROM cfg_channels WHERE guild_id = ?", [guildId]);
                const [userConfig] = await connection.query("SELECT mentionOnLevelUp FROM user_config WHERE user_id = ? AND guild_id = ?", [userId, guildId])
                const [minmax_xp] = await connection.query("SELECT min_xp, max_xp FROM cfg_lvl WHERE guild_id = ?", [guildId])
            await connection.beginTransaction();

            const min_xp = minmax_xp[0].min_xp;
            const max_xp = minmax_xp[0].max_xp;
            const xpToGive = getRandomXp(`${min_xp}`, `${max_xp}`);

            const [levelRows] = await connection.query(
                'SELECT * FROM level WHERE userId = ? AND guildId = ?',
                [query.userId, query.guildId]
            );

            if (Array.isArray(levelRows) && levelRows.length > 0) {
                const level = levelRows[0];
                const currentLevelXp = calculateLevelXp(level.level);
                level.xp += xpToGive;
                level.totalxp += xpToGive; // Update totalXP whenever XP is gained

                if (!message.author.bot) {
                    await connection.query(
                        'UPDATE level SET xp = ?, level = ?, totalxp = ? WHERE userId = ? AND guildId = ?',
                        [level.xp, level.level, level.totalxp, query.userId, query.guildId]
                    );
                } else {
                    console.log('Bot Tried Sending Message, but this is not allowed');
                }
                const warnmessage = '**NOTE: If you do not Wish To Be Mentioned, Please Run** /setuconf mentionOnLevelUp False';

                if (level.xp > currentLevelXp) {
                    level.xp -= currentLevelXp;
                    level.level += 1;

                    if (Array.isArray(channelRows) && channelRows.length > 0) {
                        const levelUpChannel = channelRows[0]?.levelup;

                        try {
                            const channel = message.guild?.channels.cache.get(levelUpChannel);
                            const mention = userConfig[0].mentionOnLevelUp;
                            if (mention === 1) {
                                if (channel && channel instanceof TextChannel) {
                                    if (level.level % 3 === 0) {
                                        await channel.send(`Congrats ${message.member}, you have just reached Level **${level.level}**\n${warnmessage}`)
                                    } else {
                                        await channel.send(`Congrats ${message.member}, you have just reached Level **${level.level}**`);
                                    }
                                } else {
                                    await message.channel.send(`Congrats ${message.member}, you have just reached Level **${level.level}**`);
                                }
                            } else if (mention === 0) {
                                if (channel && channel instanceof TextChannel) {
                                    await channel.send(`Congrats **${message.author.tag}**, you have just reached Level **${level.level}**`);
                                } else {
                                    await message.channel.send(`Congrats **${message.author.tag}**, you have just reached Level **${level.level}**`);
                                }
                            }
                            
                        } catch (error) {
                            console.error(`Error sending level up message: ${error}`);
                        }
                    } else {
                        console.log('No level up channel found in the database.');
                    }

                    console.log(`Updating level to ${level.level}`);
                    await connection.query(
                        'UPDATE level SET xp = ?, level = ?, totalxp = ? WHERE userId = ? AND guildId = ?',
                        [level.xp, level.level, level.totalxp, query.userId, query.guildId]
                    );

                    const rolesSQL = "SELECT role_id, levels FROM lvlroles WHERE guild_id = ?";
                    const rolesRows2 = await connection.query(rolesSQL, [guildId]);

                    const rolesRows = rolesRows2[0]; // Extracting the roles data from the array
                    if (Array.isArray(rolesRows) && rolesRows.length > 0) {
                        for (const roleData of rolesRows) {
                            const role = message.guild?.roles.cache.get(roleData.role_id);
                            if (!role) {
                                console.error(`Role with ID ${roleData.role_id} not found.`);
                                continue; // Skip to the next role if the role is not found
                            }
                            if (level.level >= roleData.levels) {
                                const member = message.guild?.members.cache.get(message.author.id);
                                if (!member) {
                                    console.error(`Member with ID ${message.author.id} not found.`);
                                    continue; // Skip to the next role if the member is not found
                                }
                                if (!member.roles.cache.has(role.id)) {
                                    try {
                                        await member.roles.add(role);
                                        console.log(`Assigned role ${role.name} to ${message.author.tag}`);
                                    } catch (error) {
                                        console.error(`Error assigning role ${role.name} to ${message.author.tag}: ${error}`);
                                    }
                                }
                            }
                        }
                    }

                }

                // Update XP and totalXP in the database

            } else {
                if (message.author.bot) return;
                console.log('Creating a new level record');
                const newLevel = {
                    userId: query.userId,
                    guildId: query.guildId,
                    xp: xpToGive,
                    totalxp: xpToGive,
                    username: query.username, // Set username
                    guildname: query.guildname, // Set guildname
                    level: 0
                };

                await connection.query('INSERT INTO level SET ?', newLevel);
            }

            cooldowns.add(message.author.id);
            setTimeout(() => {
                cooldowns.delete(message.author.id);
            }, 60000);

            // Commit the transaction
            await connection.commit();
            connection.release();
            connection.destroy();
        } catch (error) {
            console.error(error);
        }
    });
};

function getRandomXp(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
