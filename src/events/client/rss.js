const fs = require('fs');
const path = require('path');
const src = require('../../config/config');
const Parser = require('rss-parser');
const parser = new Parser({
  timeout: 180000
});
const { WebhookClient, EmbedBuilder } = require('discord.js');
const getConnection = require('../../functions/database/connectDatabase');

const CACHE_FILE_PATH = path.join(__dirname, '../../custom/rss-cache.json');

let rssEnable = {};
let rssChannel = {};
let color = {};

async function updateConfig(guildId) {
  try {
    const connection = await getConnection();
    const [enableRows] = await connection.query("SELECT rss FROM cfg_enable WHERE guild_id = ?", [guildId]);
    const [channelRows] = await connection.query("SELECT rss FROM cfg_channels WHERE guild_id = ?", [guildId]);
    const [embedColor] = await connection.query("SELECT mastercolor FROM cfg_misc WHERE guild_id = ?", [guildId]);
    connection.release();
    
    rssEnable[guildId] = enableRows[0].rss;
    rssChannel[guildId] = channelRows[0].rss;
    color[guildId] = embedColor[0]?.mastercolor;
  } catch (error) {
    console.error("Error updating configuration:", error);
  }
}

module.exports = async (client, message) => {
  try {
    const guilds = client.guilds.cache;
    if (guilds.size === 0) return;

    guilds.forEach(async (guild) => {
      await updateConfig(guild.id);

      setInterval(async () => {
        await updateConfig(guild.id);

        if (!rssEnable[guild.id] || rssEnable[guild.id] !== 1) return;

        const channel = guild.channels.cache.get(rssChannel[guild.id]);
        if (!channel) return;

        let webhook = await channel.fetchWebhooks();
        const name = 'RSS FEED';
        webhook = webhook.find(wh => wh.name === name);

        if (!webhook) {
          console.log("Creating webhook with name:", name);
          webhook = await channel.createWebhook({
            name: name,
            avatar: client.user?.displayAvatarURL(),
            reason: 'none'
          });
        }

        const cacheData = fs.existsSync(CACHE_FILE_PATH) ? JSON.parse(fs.readFileSync(CACHE_FILE_PATH, 'utf-8')) : {};
        const sources = JSON.parse(fs.readFileSync(src.plugins.rss.source, 'utf8'));
        const feedList = sources.map((source) => ({
          name: source.name,
          url: source.url,
          lastUpdated: new Date(cacheData[source.url]?.lastUpdated || 0),
          lastSentItemLink: cacheData[source.url]?.lastSentItemLink || null,
          seenLinks: cacheData[source.url]?.seenLinks || [],
        }));

        for (const feed of feedList) {
          try {
            const data = await parser.parseURL(feed.url);
            const lastBuildDate = new Date(data.lastBuildDate || data.pubDate || 0);

            if (lastBuildDate > feed.lastUpdated) {
              const newItems = data.items.filter(item => !feed.seenLinks.includes(item.link));
              if (newItems.length === 0) continue;

              const latestItem = newItems[0];

              const embedFooter = lastBuildDate.toDateString();

              const embed = new EmbedBuilder()
                .setTitle(latestItem.title)
                .setURL(latestItem.link)
                .setDescription(latestItem.contentSnippet || latestItem.content || ' ')
                .setImage(latestItem.enclosure?.url || 'https://img.freepik.com/premium-photo/close-up-question-mark-dark-theme-interrogative-topics_183270-417.jpg?size=626&ext=jpg')
                .setColor(color[guild.id])
                .setTimestamp()
                .setFooter({ text: `Published on ${embedFooter} | ${feed.name}` });

              webhook.send({ embeds: [embed] });

              feed.lastUpdated = lastBuildDate;
              feed.lastSentItemLink = latestItem.link;
              feed.seenLinks.unshift(latestItem.link);
              feed.seenLinks = feed.seenLinks.slice(0, 100);

              cacheData[feed.url] = {
                lastUpdated: lastBuildDate.toISOString(),
                lastSentItemLink: latestItem.link,
                seenLinks: feed.seenLinks,
              };
              fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cacheData));

              await new Promise(resolve => setTimeout(resolve, 10000));
            }
          } catch (error) {
            if (error.code === 'ETIMEDOUT') {
              console.log(`Request timed out for ${feed.url}`);
            } else {
              console.error(`Error fetching data for ${feed.url}`, error);
            }
          }
        }
      }, 5 * 60 * 1000); // Check every 5 minutes
    });
  } catch (error) {
    console.error("Error in main function:", error);
  }
};
