module.exports = class Knex {
  /**
   * Construct this PG connection instance
   * Undefined values may be replaced with defaults
   *
   * @param host mysql host
   * @param user mysql user
   * @param database mysql database
   * @param password mysql password
   */
  constructor(config) {
    this.connectionConfig = config;
    this.client = null;
  }

  /**
   * Create a pool connection
   *
   * @param promise Bolean, to forse a promise on the return
   */
  connect(searchPath, options) {
    this.client = require("knex")({
      client: "pg",
      connection: this.connectionConfig,
      ...options,
      searchPath: searchPath,
    });
    return this.client;
  }

  /**
   * Close a pool connection
   *
   */
  close() {
    this.client.destroy();
  }
};
