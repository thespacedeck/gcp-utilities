const mysql = require('mysql');
const util = require('util')

module.exports = class MySql {
    /**
     * Construct this mysql connection instance
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
     * Create a single connection
     *
     * @param promise Bolean, to forse a promise on the return
     */
    connect(promise) {

        let connection = null;

        connection = mysql.createConnection(this.connectionConfig);

        connection.connect(function(err) {
            if(err) {
                console.log(err)
            } 

            connection.end()
        });

        if(promise === true){
            connection.query = util.promisify(connection.query)
        }

        return connection;

    }

    /**
     * Create a pool connection
     *
     * @param promise Bolean, to forse a promise on the return
     */
    pool(promise) {

        let pool = null;

        pool = mysql.createPool(this.connectionConfig);

        pool.getConnection((err, connection) => {
            if (err) {
                console.log(err)
            }
            if (connection) connection.release()
            return
        })

        if(promise === true){
            pool.query = util.promisify(pool.query)
        }

        return pool;

    }
  
}