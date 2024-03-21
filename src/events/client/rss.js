const fs = require('fs');
const path = require('path');


const Parser = require('rss-parser');
const parser = new Parser({
  timeout: 180000
});

const src = require('../../config/config');
const getConnection = require('../../functions/database/connectDatabase');

const CACHE_FILE_PATH = path.join(__dirname, '../../custom/rss-cache.json');

module.exports = async (client, message) => {
  //return;
  try {
    const guilds = client.guilds.cache;
    if (guilds.size === 0) return;

    guilds.forEach(async (guild) => {

      const connection = await getConnection();
        const [enableRows] = await connection.query("SELECT rss FROM cfg_enable WHERE guild_id = ?", [guild.id]);
        const [channelRows] = await connection.query("SELECT rss FROM cfg_channels WHERE guild_id = ?", [guild.id]);
      connection.release();

      

      const cacheData = fs.existsSync(CACHE_FILE_PATH) ? JSON.parse(fs.readFileSync(CACHE_FILE_PATH, 'utf-8')) : {};
      const sources = JSON.parse(fs.readFileSync(src.plugins.rss.source, 'utf8'));
      const feedList = sources.map((source) => ({
        name: source.name,
        url: source.url,
        lastUpdated: new Date(cacheData[source.url]?.lastUpdated || 0),
        lastSentItemLink: cacheData[source.url]?.lastSentItemLink || null, // add last sent item link to cache data
        seenLinks: cacheData[source.url]?.seenLinks || [], // add seen links to cache data
      }));

      setInterval(async () => {
        const rssEnable = enableRows[0].rss;
        const rssChannel = channelRows[0].rss;

        if (!rssEnable || rssEnable !== 1) return;
        for (const feed of feedList) {
          try {
            const data = await parser.parseURL(feed.url);
            const lastBuildDate = new Date(data.lastBuildDate || data.pubDate || 0);

            if (lastBuildDate > feed.lastUpdated) {
              const newItems = data.items.filter(item => !feed.seenLinks.includes(item.link));
              if (newItems.length === 0) {
                continue;
              }

              const latestItem = newItems[0];

              client.channels.cache.get(rssChannel).send(`📰 | **NEW ARTICLE** | 📰\n**Article Title: ${latestItem.title}**\n\n**URL:** ${latestItem.link}`);

              feed.lastUpdated = lastBuildDate;
              feed.lastSentItemLink = latestItem.link;
              feed.seenLinks.unshift(latestItem.link);
              feed.seenLinks = feed.seenLinks.slice(0, 100); // only keep the last 10 seen links

              cacheData[feed.url] = {
                lastUpdated: lastBuildDate.toISOString(),
                lastSentItemLink: latestItem.link,
                seenLinks: feed.seenLinks,
              };
              fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cacheData));

              await new Promise(resolve => setTimeout(resolve, 10000)); // add a delay of 10 seconds before posting the next article
            }
          } catch (error) {
            if (error.code === 'ETIMEDOUT') {
              console.log(`Request timed out for ${feed.url}`);
              // handle the timeout error here
            } else {
              console.error(`Error fetching data for ${feed.url}: ${error}`);
            }
          }
        }
      }, 5 * 60 * 1000);
    });
  } catch (error) {
    console.error(error);
  }
};
