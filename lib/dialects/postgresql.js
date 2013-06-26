'use strict';

var dbg = require('../debug'),
    Client = require('pg').Client,
    dialect = Object.create(require('./baseDialect')),
    _aliasCounter = 0,
    client;

function connect(errorHandler) {
    if (client === undefined) {
        client = new Client(dialect.config.db.connectionString);
        client.connect(function(err) {
            if(err) {
                dbg.dlog('Error connecting to database.');
                dbg.dlog('Connection string: ');
                dbg.dlog(err);
                errorHandler(err);
                client = undefined;
                throw new Error(err);
            }
            console.log("connect successfull");
        });
    }
}

dialect.connect = function (errorHandler, successHandler) {
    connect(errorHandler);
    successHandler(client);
}

//dialect.done = function () {
//    pg.connect(dialect.config.db.connectionString, function (err, c_client, done) {
//        done();
//    });
//}

dialect.end = function () {
    client.end();
    client = undefined;
    console.log("Postgresql Dialect: End called.")
}


module.exports = dialect;
