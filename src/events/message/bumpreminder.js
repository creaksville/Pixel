const getConnection = require('../../functions/database/connectDatabase');
console.log(`Bump Reminder Loaded at ${new Date().toLocaleString()}`);
const { EmbedBuilder } = require('discord.js');
const calculateLevelXp = require('../../utils/calculateLevelXp');

module.exports = async (message, client) => {
    try {
        const connection = await getConnection();
        const [colorRows] = await connection.query("SELECT mastercolor FROM cfg_misc WHERE guild_id = ?", [message.guild.id]);
        const [miscRows] = await connection.query("SELECT bumprole FROM cfg_misc WHERE guild_id = ?", [message.guild.id]);
        const [enableRows] = await connection.query("SELECT bump FROM cfg_enable WHERE guild_id = ?", [message.guild.id]);
        const [channelRows] = await connection.query("SELECT bump FROM cfg_channels WHERE guild_id = ?", [message.guild.id]);
        connection.release();

        const guildEnable = enableRows[0].bump;
        const guildChannel = channelRows[0].bump;
        const guildRole = miscRows[0].bumprole;

        if (!guildEnable || !guildChannel || !guildRole) return;

        if (guildEnable !== 1) return;
        const color = colorRows[0].mastercolor;
        const role = message.guild.roles.cache.get(guildRole);
        const channel = message.guild.channels.cache.get(guildChannel);

        if (!role) {
            console.log(`Error: Could not find role with ID ${guildRole} in server unknown.`);
            return;
        }

        if (message.interaction && message.interaction.commandName === "bump") {
            // Capture the user ID of the user who ran the command
            const userId = message.author.id;

            const xpToGive = 50;

            // Execute the bump logic here
            if (userId === "302050872383242240") {
                const disboardReminderEmbed = new EmbedBuilder()
                    .setTitle('Thank You For Bumping to DISBOARD!!')
                    .setDescription(`You have just Earned **${xpToGive} XP!!**\nPlease Check Back in 2 Hours!!`)
                    .setColor(color)
                    .setTimestamp();
                channel.send({ embeds: [disboardReminderEmbed] });

                const query = {
                  userId: message.interaction?.user.id,
                  guildId: message.guild.id,
                  username: message.interaction?.user.username,
                  guildname: message.guild.name
              };
      
      
              const [levelRows] = await connection.query(
                  'SELECT * FROM level WHERE userId = ? AND guildId = ?',
                  [query.userId, query.guildId]
              );

              const [bumpLB] = await connection.query(
                  'SELECT * FROM bumplb WHERE guildId = ?',
                  [query.guildId]
              );
      
              if (Array.isArray(levelRows) && levelRows.length > 0) {
                  const level = levelRows[0];
                  level.xp += xpToGive;
                  level.totalxp += xpToGive; // Update totalXP whenever XP is gained
      
                  // Check for level up
                  const currentLevelXp = calculateLevelXp(level.level);
                  if (level.xp >= currentLevelXp) {
                      // Level up logic
                      level.xp -= currentLevelXp;
                      level.level += 1;
      
                      // Execute role assignment logic here
      
                      // Send level up message here
                  }
      
                  // Update XP and totalXP in the database
                  await connection.query(
                      'UPDATE level SET xp = ?, level = ?, totalxp = ? WHERE userId = ? AND guildId = ?',
                      [level.xp, level.level, level.totalxp, query.userId, query.guildId]
                  );
              } else {
                  // If the user doesn't have a level record, create one
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

              const bump = bumpLB[0];

              if (bump) {
                  await connection.query(
                      'UPDATE bumplb SET total_bumps = ? WHERE userId = ? AND guildId = ?',
                      [bump.total_bumps + 1, query.userId, query.guildId]
                  );
              } else {
                  // If the query didn't return any results, you may want to insert a new record instead
                  await connection.query(
                      'INSERT INTO bumplb (userId, username, guildId, guildname, total_bumps) VALUES (?, ?, ?, ?, 1)',
                      [query.userId, query.username, query.guildId, query.guildname]
                  );
              }

                setTimeout(() => {
                    channel.send(`<@&${guildRole}> Don't forget to bump using DISBOARD the server to get more members!`);
                }, 2 * 60 * 60 * 1000);
            }
        }

        
    } catch (error) {
        console.error(error);
    }
};
