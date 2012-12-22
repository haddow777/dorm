'use strict';

var dbg = require('../debug'),
    pg = require('pg'),
    config = require('../../config.json'),
    dialect = Object.create(require('./baseDialect')),
    _aliasCounter = 0;

dialect.connect = function (errorHandler, successHandler) {
    pg.connect(config.db.connectionString, function (err, client) {
        if(err) {
            if(dbg.debug) {
                dbg.dlog('Error connecting to database.');
                dbg.dlog('Connection string: ');
                dbg.dlog(err);
            }
            errorHandler(err);
        } else {
            if(dbg.debug) {
                dbg.dlog('Connected to client: ');
                dbg.dlog(client);
            }
            successHandler(client);
        }
    });
};


module.exports = dialect;
