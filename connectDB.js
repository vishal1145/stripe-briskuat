// config for your database
const { request } = require("express");
const sql = require("mssql");
var config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DATABASE,
    port: 1433
};
 function connect() {
    sql.connect(config)
    var request = new sql.Request();
    return request
}
var connection = connect()
module.exports.connect = connection
