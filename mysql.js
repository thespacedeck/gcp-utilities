const mysql = require('mysql');

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
        this.host = config.host;
        this.user = config.user;
        this.database = config.database ? config.database : null;
        this.password = config.password ? config.password : null;
        this.connectionLimit = config.connectionLimit ? config.connectionLimit : 5;
    }
    
    /**
     * Create a single connection
     *
     * @param promise Bolean, to forse a promise on the return
     */
    connect(promise) {

        let connection = null;

        const mysqlConfig = {
            host: this.host,
            user: this.user,
            database: this.database,
            password: this.password
        }

        connection = mysql.createConnection(mysqlConfig);

        connection.connect(function(err) {
            if(err) {
                console.log(err)
            
            } 
            connection.end()
        });

        if(promise === true){
            console.log('making promise()')
            connection = connection.promise()
        }

        return connection;

    }

    pool(promise) {

        let pool = null;

        const mysqlConfig = {
            host: this.host,
            user: this.user,
            database: this.database,
            password: this.password,
            connectionLimit: this.connectionLimit,
        }

        pool = mysql.createPool(mysqlConfig)

        pool.getConnection((err, conn) => {
            if (err) {
                console.log(err)
            }
        })

        if(promise === true){
            pool = pool.promise()
        }

        return pool;

    }
  
}