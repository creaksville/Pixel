const fs = require('fs');
const config = require('../../config/config');
const getConnection = require('../../functions/database/connectDatabase');
const funFacts = JSON.parse(fs.readFileSync(config.plugins.funfact.source, 'utf8'));
const { EmbedBuilder } = require('discord.js');

let lastFunFactIndex = -1;
module.exports = async (client, message) => {
  //return;
  try {    
    const guildser = client.guilds.cache;
    if (guildser.size === 0) return;

    guildser.forEach(async (guild) => {
      const connection = await getConnection();
        const [miscRows] = await connection.query("SELECT mastercolor FROM cfg_misc WHERE guild_id = ?", [guild.id]);
        const [enableRows] = await connection.query("SELECT funfact FROM cfg_enable WHERE guild_id = ?", [guild.id]);
        const [channelRows] = await connection.query("SELECT funfact FROM cfg_channels WHERE guild_id = ?", [guild.id]);
      connection.release();

      setInterval(() => {
        const guildEnable = enableRows[0].funfact;
        const guildChannel = channelRows[0].funfact;
        const embedColor = miscRows[0].mastercolor;
        if (!guildEnable || !guildChannel || guildEnable !== 1) return;
        let funFactIndex;
        do {
          funFactIndex = Math.floor(Math.random() * funFacts.length);
        } while (funFactIndex === lastFunFactIndex);
        lastFunFactIndex = funFactIndex;
            const funFact = funFacts[funFactIndex];
            const customMessage = "**Fun Fact:**";
            const channelSend = client.channels.cache.get(guildChannel);

            const messageSend = new EmbedBuilder()
                .setTitle(customMessage)
                .setDescription(funFact)
                .setColor(embedColor)
                .setTimestamp()

            channelSend.send({embeds: [messageSend]});
      }, 24 * 60 * 60 * 1000);
    });
  } catch (error) {
    console.error(error);
  }
};