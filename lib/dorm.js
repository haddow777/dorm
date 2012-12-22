'use strict';

var dbg = require('./debug.js'),
    config = require('../config.json'), // default config
    dorm = {};

var dialect = require('./dialects/'+config.dialect);

dorm.config = function (fileName) {
    config = require(fileName);
};

//TODO: put all sql generation in dialect
dorm.createTable = function (entity, handler) {
    var sql = dialect.buildCreateTableStatement(entity);
    _singleEntityQuery({text:sql}, entity, handler);
};

dorm.dropTable = function (entity) {
    var sql = dialect.buildDropTableStatement(entity);
    _singleEntityQuery({text:sql}, entity, handler);
};

dorm.get = function (Type, options, handler) {
    if(typeof options == 'number') {
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

// TODO: move the SQL generation to the dialect
dorm.delete = function (options, handler) {
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
        console.log(err)
    }, function (client) {
        var query = sqlBuilder.buildDeleteStatement(toe, options);
        dbg.slog(query.text);
        if(dbg.showSql) console.log('Parameters:', query.values);
        client.query(query, function (qerr, result) {
            handler(qerr, result);
        });
    });
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

function _singleEntityQuery(query, entity, handler) {
    dialect.connect(console.log, function(client){
        client.query(query, function (err, results) {
            var id;
            if(!err && entity.identifier) { 
                entity.values[entity.identifier] = results.rows[0][entity.identifier];
            }
            handler(err, entity); //TODO: perhaps update the entity's id field here'
        });
    });
}

// private module utilities:

function _getWithOptions(Type, options, handler) {
    dialect.connect(function (err) {
        console.log(err)
    }, function (client) {
        var query;
        if(dorm.useRowToJson) {
            query = sqlBuilder.buildJSONSelectStatement(Type, options);
        } else {
            query = sqlBuilder.buildFlatSelectStatement(Type, options); //DB Agnostic flat select
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
    ,
        results = [];

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
            dorm._assignChildProperties(rowEntities[i], rowEntities);
        }
    }
}

module.exports = dorm;