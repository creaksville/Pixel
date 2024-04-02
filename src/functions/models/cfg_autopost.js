const getConnection = require('../database/connectDatabase');

module.exports = async (client) => {
  try {
    const connection = await getConnection();

    await connection.query(`CREATE TABLE IF NOT EXISTS cfg_autopost (
        id INT AUTO_INCREMENT PRIMARY KEY,
        guild_id VARCHAR(255),
        guild_name VARCHAR(255),
        autopost1name TEXT,
        autopost1channel VARCHAR(255) DEFAULT 0,
        autopost1subreddits TEXT,
        autopost1interval TEXT,
        autopost2name TEXT,
        autopost2channel VARCHAR(255) DEFAULT 0,
        autopost2subreddits TEXT,
        autopost2interval TEXT,
        autopost3name TEXT,
        autopost3channel VARCHAR(255) DEFAULT 0,
        autopost3subreddits TEXT,
        autopost3interval TEXT,
        autopost4name TEXT,
        autopost4channel VARCHAR(255) DEFAULT 0,
        autopost4subreddits TEXT,
        autopost4interval TEXT,
        autopost5name TEXT,
        autopost5channel VARCHAR(255) DEFAULT 0,
        autopost5subreddits TEXT,
        autopost5interval TEXT,
        autopost6name TEXT,
        autopost6channel VARCHAR(255) DEFAULT 0,
        autopost6subreddits TEXT,
        autopost6interval TEXT,
        autopost7name TEXT,
        autopost7channel VARCHAR(255) DEFAULT 0,
        autopost7subreddits TEXT,
        autopost7interval TEXT,
        autopost8name TEXT,
        autopost8channel VARCHAR(255) DEFAULT 0,
        autopost8subreddits TEXT,
        autopost8interval TEXT,
        autopost9name TEXT,
        autopost9channel VARCHAR(255) DEFAULT 0,
        autopost9subreddits TEXT,
        autopost9interval TEXT,
        autopost10name TEXT,
        autopost10channel VARCHAR(255) DEFAULT 0,
        autopost10subreddits TEXT,
        autopost10interval TEXT
    )`);

    connection.release();
  } catch (error) {
    
  }
}

