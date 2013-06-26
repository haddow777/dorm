'use strict';

var dbg = require('./debug.js'),
    util = require('util'),
    deferred = require('deferred'),
    dorm = {};

var dialect; 

dorm.config = function (opts) {
    var config;
    if (typeof opts === 'string'){ // filename
        config = require(opts);
    } else if (typeof opts === 'object') { // object
        config = opts;
    }
    dbg.dlog("Config loaded:", config);
    dialect = require('./dialects/' + config.dialect);
    dialect.config = config;
    dbg.config(config);
    return dorm;
};

dorm.createTable = function createTable (entity, handler) { 
    var sql = dialect.buildCreateTableStatement(entity);
    _singleEntityQuery({text:sql}, entity, handler);
};

dorm.dropTable = function dropTable (entity, handler) {
    var sql = dialect.buildDropTableStatement(entity);
    _singleEntityQuery({text:sql}, entity, handler);
};

dorm.__get = function __get (Type, options, handler) {
    if(typeof options == 'number' || typeof options === 'string') {
        var idVal = options;
        options = {
            where: {}
        };
        options.where[Type.identifier[0]] = {
            cmp: '=',
            value: idVal
        };
    }
    _getWithOptions(Type, options, handler);
};

dorm.get = function get (Type, options, handler) {
    if (options instanceof Object && typeof options.then === 'function') {
        options.then(function(win) {
            dorm.__get(Type, win, handler);
        });
    } else {
        dorm.__get(Type, options, handler);
    }
};

// TODO: move the SQL generation to the dialect
dorm.__delete = function (options, handler) {
    if(!options) throw new Error("DeleteError: Cannot delete without options");

    var toe;

    if(options.instance) {
        toe = options;
        dbg.dlog('Deleting an instance entity.' + toe.table + ':' + toe[toe.identifier]);
        options = {
            where: {}
        };
        options.where[toe.identifier] = toe[toe.identifier];
    } else if(options.type && options.where) {
        toe = options.type;
    } else {
        throw new Error('DeleteError: Cannot determine what to do with:', options);
    }

    dialect.connect(function (err) {
        throw new Error(err)
    }, function (client) {
        var query = dialect.buildDeleteStatement(toe, options);
        dbg.slog(query.text);
        dbg.slog('Parameters:', query.values);
        client.query(query, function (qerr, result) {
            handler(qerr, result);
        });
    });
};

dorm.delete = function (options, handler) {
    if ((typeof options === 'object' && options !== null) && typeof options.then === 'function') {
        options.then(function(win) {
            dorm.__delete(win, handler);
        });
    } else {
        dorm.__delete(options, handler);
    }
};


// we do not cascade our saves. if you want to do this, find the children yourself and save manually.
dorm.save = function (entity, handler) {
    // we COULD cache the insert statement, as it is parameterized, when we first create it.
    var query;

    if(!entity) throw new Error("ValueError: cannot save undefined or null entity");
    if(!entity.instance) throw new Error("EntityError: Cannot save a base type.");

    if(!entity.id || entity.id === 0) { // id was not provided, so we assume an insert
        query = dialect.buildInsertQuery(entity);
    } else { // TODO: handle update, when ID is provided
        query = dialect.buildUpdateQuery(entity);
    }

    _singleEntityQuery(query, entity, handler);
};

dorm.insert = function (entity, handler) {
    // we COULD cache the insert statement, as it is parameterized, when we first create it.
    var query;

    if(!entity) throw new Error("ValueError: cannot save undefined or null entity");
    if(!entity.instance) throw new Error("EntityError: Cannot save a base type.");

    query = dialect.buildInsertQuery(entity);
    
    _singleEntityQuery(query, entity, handler);
};

dorm.update = function (entityOrOptions, handler) {
    var query,
        options;

    if(!entityOrOptions) throw new Error("ValueError: cannot save undefined or null entity");
    if(typeof entityOrOptions.entity === 'object' && typeof entityOrOptions.entity !== null) {
        options = entityOrOptions;
        entityOrOptions = entityOrOptions.entity;
        delete options.entity;
        if (options.update_set_values === undefined) {
            options.update_set_values = true;
        }
    } else {
        options = {update_set_values: true};
    }
    if(!entityOrOptions.instance) throw new Error("EntityError: Cannot update a base type. If you are trying to pass an options object, make sure you assign the instance of the entity to options.entity.");

    query = dialect.buildUpdateQuery(entityOrOptions, options);
    
    _singleEntityQuery(query, entityOrOptions, handler);
};

// This is a quick hack for Postgres transactions. In the future they will need to
// grab their queries from the database specific dialect files to ensure compatibility.
// For now, they provide a test interface.
dorm.begin = function (options, handler) {
    var query = "BEGIN;";
    dbg.dlog('DORM: begin');
    _noEntityQuery(query, undefined, handler);
};

dorm.commit = function (options, handler) {
    var query = "COMMIT;";
    _noEntityQuery(query, undefined, handler);
};

dorm.rollback = function (options, handler) {
    var query = "ROLLBACK;";
    _noEntityQuery(query, undefined, handler);
};

dorm.savepoint = function (name, handler) {
    var query = "SAVEPOINT " + name + ";";
    _noEntityQuery(query, undefined, handler);
};

dorm.rollbackTo = function (name, handler) {
    var query = "ROLLBACK TO " + name + ";";
    _noEntityQuery(query, undefined, handler);
};

dorm.runStoredProcedure = function (unfiltered_name, handler) {
    var name = /\s?.*\(\)/.exec(unfiltered_name)[0],
        query;

    if (/[\'\"]/.test(name)){
        throw new Error("DORM -> runStoreProcedure: Procedure name contained invalid characters.");
    } else {
        query = "SELECT " + name + ";"
        _noEntityQuery(query, undefined, handler);
    }
};

dorm.done = function () {
    dialect.done();
};

dorm.end = function () {
    dialect.end();
};

function _singleEntityQuery(query, entity, handler) {
    console.log('_singleEntityQuery start', query);
    dialect.connect(function (err){
        console.log("Config: ", config, err);        
        throw new Error('Error connecting to database. ');
    }, function(client){
        console.log('_singleEntityQuery before', query);
        client.query(query, function (err, results) {
            console.log('_singleEntityQuery successful');
            var id;
            if(!err && entity.identifier && entity.instance) { 
                if (results.rows[0] !== undefined) {
                    if (results.rows[0].length === 1) {
                        entity.values[entity.identifier] = results.rows[0][entity.identifier];
                    } else {
                        for (var field in entity.values) {
                            if (entity.values[field] !== undefined) {
                                entity.values[field] = results.rows[0][field];
                            }
                        }
                    }
                }
                entity.clear_values_set();
                dbg.dlog('query results:', results);
                if (dbg.debug) console.log(util.inspect(entity, true, 3, true));
            } else {
                console.log('_singleEntityQuery failed:', query);
                console.log('failure message', err);
            }
            if (handler) {handler(err, entity);console.log('$$$$$$$$normal query has a handler function');} //TODO: perhaps update the entity's id field here'
            else {console.log('$$$$$$$$normal query no handler function');}
            console.log('_singleEntityQuery after handler');
        });
    });
}

function _noEntityQuery(query, options, handler) {
    dialect.connect(function (err){
        console.log("Config: ", config, err);        
        throw new Error('Error connecting to database. ');
    }, function(client){
        console.log("_noEntityQuery before call", query);
        client.query(query, function (err, results) {
            console.log('query successfull');
            dbg.dlog('query results:', results);
            if (typeof handler === 'number') throw new Error("handler is a number <" + handler + "> on query: " + query);
            if (handler) {handler(err, results);}
            else {console.log('No handler function');}
            console.log('_noEntityQuery after handler');
        });
    });
}

// private module utilities:

function _getWithOptions(Type, options, handler) {
    dialect.connect(function (err) {
        console.log("Config: ", config, err);
        throw new Error(err);
    }, function (client) {
        var query;
        if(dorm.useRowToJson) {
            query = dialect.buildJSONSelectStatement(Type, options);
        } else {
            query = dialect.buildFlatSelectStatement(Type, options); //DB Agnostic flat select
        }
        dbg.slog(query.text);
        client.query(query, function (qerr, result) {
            var transformed_results;
            if(!qerr) {
                // Type.create(); instances of the type
                transformed_results = _transformFlatResults(query.aliases, result.rows);
            }
            handler(qerr, transformed_results);
        });
    });
}



function _transformFlatResults(aliases, rows) {
    // perform transformation to entities
    // apply methods as mixins
    // perhaps use prototype here to propagate methods
    var k, prop, instance, alias, aliasDetails, rowEntities = [] // for this row, all entities created
      , results = [];
    //TODO: make this handle recursive levels of depth. (nested joins)
    for(k in rows) {
        for(alias in aliases) {
            aliasDetails = aliases[alias];
            instance = aliasDetails.type.create();
            for(prop in rows[k]) {
                if(prop.substring(0, 4) === aliasDetails.alias) {
                    instance.values[prop.substring(5)] = rows[k][prop];
                }
            }

            rowEntities.push({
                obj: instance,
                alias: aliasDetails
            });

        }
        results.push(_buildEntityTree(rowEntities)); // there can be only one ... root element per row.
        rowEntities = [];
    }
    return results; // TODO: transform results with mixins
}

function _buildEntityTree(rowEntities) {
    var rootObject, i, entity;

    for(i in rowEntities) {
        entity = rowEntities[i];
        if(entity.alias && !entity.alias.as && !entity.alias.parentAlias) {
            rootObject = entity;
            break;
        }
    }

    _assignChildProperties(rootObject, rowEntities)

    return rootObject.obj;
}

function _assignChildProperties(entity, rowEntities) {
    var i, children = [];
    for(i in rowEntities) {
        if(entity.alias && entity.alias.alias && rowEntities[i].alias.parentAlias === entity.alias.alias) {
            entity.obj[rowEntities[i].alias.as] = rowEntities[i].obj;
            //dorm._assignChildProperties(rowEntities[i], rowEntities);
            _assignChildProperties(rowEntities[i], rowEntities);
        }
    }
}

/*
*
* Cache promisified versions of all the methods defined below
*
*/

dorm.promises = {};

for (var i in dorm){
    if (i !== 'promises') {
        if (dbg.debug) console.log(i, util.inspect(dorm[i]));
        dorm.promises[i] = deferred.promisify(dorm[i]);
    }
}

module.exports = dorm;
