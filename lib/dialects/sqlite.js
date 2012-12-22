'use strict';

var dbg = require('../debug'),
    sqlite = require('sqlite'),
    dialect = Object.create(require('./baseDialect')),
    _aliasCounter = 0;

//TODO: abstraction layer between dorm.js and dialect?
// should the dialect itself be responsible for all queries?
dialect.connect = function (errorHandler, successHandler) {
	var db = new sqlite.Database();
    db.open(dialect.config.db.connectionString, function (err) {
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