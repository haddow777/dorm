'use strict';

var dbg = require('../debug'),
    pg = require('pg'),
    dialect = Object.create(require('./baseDialect')),
    _aliasCounter = 0;

dialect.connect = function (errorHandler, successHandler) {
    pg.connect(dialect.config.db.connectionString, function (err, client) {
        if(err) {
            dbg.dlog('Error connecting to database.');
            dbg.dlog('Connection string: ');
            dbg.dlog(err);
            errorHandler(err);
            throw new Error(err);
        } else {
            //dbg.dlog('Connected to client.');
            successHandler(client);
        }
    })
}


module.exports = dialect;
