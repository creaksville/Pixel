const fs = require('fs');
const config = require('../../config/config');
const { promisify } = require('util');
const { EmbedBuilder } = require('discord.js');

const readFileAsync = promisify(fs.readFile);
const getConnection = require('../../functions/database/connectDatabase');

let lastFunFactIndex = -1;

module.exports = async (client, message) => {
  try {
    const guildser = client.guilds.cache;
    if (guildser.size === 0) return;

    guildser.forEach(async (guild) => {
      setInterval(async () => {
        const connection = await getConnection();
        try {
          const [miscRows] = await connection.query("SELECT mastercolor FROM cfg_misc WHERE guild_id = ?", [guild.id]);
          const [enableRows] = await connection.query("SELECT funfact FROM cfg_enable WHERE guild_id = ?", [guild.id]);
          const [channelRows] = await connection.query("SELECT funfact FROM cfg_channels WHERE guild_id = ?", [guild.id]);

          const guildEnable = enableRows[0].funfact;
          const guildChannel = channelRows[0].funfact;

          if (!guildEnable || guildEnable !== 1) return;

          const channel = guild.channels.cache.get(guildChannel);
          if (!channel) return;

          let webhook = await channel.fetchWebhooks();
          const name = 'FUN FACTS';
          webhook = webhook.find(wh => wh.name === name);

          if (!webhook) {
            console.log("Creating webhook with name:", name);
            webhook = await channel.createWebhook({
              name: name,
              avatar: client.user?.displayAvatarURL(),
              reason: 'none'
            });
          }

          let funFacts;
          try {
            funFacts = JSON.parse(await readFileAsync(config.plugins.funfact.source, 'utf8'));
          } catch (error) {
            console.error("Error reading fun fact source file:", error);
            return;
          }

          let funFactIndex;
          do {
            funFactIndex = Math.floor(Math.random() * funFacts.length);
          } while (funFactIndex === lastFunFactIndex);
          lastFunFactIndex = funFactIndex;
          const funFact = funFacts[funFactIndex];
          const customMessage = "**Fun Fact:**";

          const messageSend = new EmbedBuilder()
            .setTitle(customMessage)
            .setDescription(funFact)
            .setColor(miscRows[0].mastercolor)
            .setTimestamp();

          webhook.send({ embeds: [messageSend] });
        } catch (error) {
          console.error("Error in interval function:", error);
        } finally {
          connection.release();
        }
      }, 2 * 60 * 1000);
    });
  } catch (error) {
    console.error("Error in main function:", error);
  }
};
