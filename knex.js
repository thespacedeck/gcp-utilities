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
  }

  /**
   * Create a pool connection
   *
   * @param promise Bolean, to forse a promise on the return
   */
  connect(options) {
    return require("knex")({
      client: "pg",
      connection: this.connectionConfig,
      ...options,
    });
  }
};
