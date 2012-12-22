//baseDialect.js

'use strict';

var dbg = require('../debug'),
    dialect = {},
    _aliasCounter = 0;

dialect.config = {};

dialect.buildCreateTableStatement = function (entity) {

    var sql = "CREATE TABLE " + entity.table + " ( ",
        columns = [],
        field;
    for(field in entity.fields) {
        if(entity[field].primaryKey === true) {
            columns.push(field + " SERIAL PRIMARY KEY"); // pgsql SERIAL
        } else {
            columns.push(field + " " + entity[field].dbtype);
        }
    }
    sql += columns.join(',\n');
    sql += "); ";
    dbg.slog(sql);
};


dialect.buildInsertQuery = function (entity, fieldRefs, paramRefs) {
    var field, 
        fieldRefs = [],
        paramRefs = [],
        values = [],
        counter = 1,
        fieldDef, k, primaryKeyField, results, sql = 'INSERT INTO ' + entity.table;

    // this is where we make use of the enumerable:true properties, and is why we hide everything else.
    for(fieldDef in entity.fields) { // find the field in the ordered entity.fields array
        for(k in entity.fields[fieldDef]) {
            if(!entity.fields[fieldDef][k].primaryKey) {
                fieldRefs.push(k);
                paramRefs.push('$' + counter);
                values.push(entity[k]);
                counter++;
                break;
            } else {
                primaryKeyField = k;
            }
        }

    }

    sql += ' (' + 
            fieldRefs.join(", ") + 
            ') VALUES (' + 
            paramRefs.join(', ') + 
            ') returning id;';

    var query = {
        text: sql,
        values: values
    };

};


dialect.buildUpdateQuery = function (entity){
    var field, 
        fieldRefs = [],
        values = [],
        counter = 1,
        fieldDef, k, primaryKeyField, results, sql;

    // this is where we make use of the enumerable:true properties, and is why we hide everything else.
    for(fieldDef in entity.fields) { // find the field in the ordered entity.fields array
        for(k in entity.fields[fieldDef]) {
            if(!entity.fields[fieldDef][k].primaryKey) {
                fieldRefs.push(k+ " = " + '$' + counter);
                values.push(entity[k]);
                counter++;
                break;
            } else {
                primaryKeyClause = k + '=' + entity[k];
            }
        }

    }

    sql = 'UPDATE ' + entity.table + ' SET ' + 
          fieldRefs.join(", ") + 
          'WHERE ' + primaryKeyClause +';';

    var query = {
        text: sql,
        values: values
    };
};

dialect.buildDropTableStatement = function (entity){
    return 'DROP TABLE ' + entity.table + ';'
};

dialect.buildDeleteStatement = function (TypeOrEntity, options) {
    if(!TypeOrEntity) throw new Error('DeleteError: could not determine type of entity.', options);

    var whereClauseAndParams = {},
        query = {
            text: 'DELETE FROM ' + TypeOrEntity.table,
            values: []
        };

    if(options.where) {

        if(dbg.debug) {
            dbg.dlog('Options for where:');
            console.log(options);
            dbg.dlog('Type.table:');
            console.log(TypeOrEntity);
        }

        whereClauseAndParams = sqlBuilder._buildWhereClauseAndParams(options.where);
        dbg.dlog(whereClauseAndParams.text);
    }

    return {
        text: query.text + (whereClauseAndParams.text || '') + ';',
        values: whereClauseAndParams.params
    }
}

dialect.buildSelectStatement = function (Type, options) {
    var whereItems = [],
        aliases = [],
        a, sql = 'SELECT ',
        query = {},
        paramValues = [],
        joins = {},
        cmp, k, fields, counter = 0,
        fieldRefs = [],
        whereClause = {},
        rootTblAlias = Type.table.substring(0, 3) + _aliasCounter; // increment from here for new aliases 
    //TODO: Intelligenly named aliases
    _aliasCounter++;
    aliases.push({
        type: Type,
        alias: rootTblAlias
    });

    for(field in Type.fields) { // fields is an array of {name:value}
        for(k in Type.fields[field]) {
            fieldRefs.push(rootTblAlias + '.' + k + ' as ' + rootTblAlias + '_' + k);
        }
    }

    if(!options.join) options.join = {};
    joins = _buildJoins(Type, rootTblAlias, options.join);

    for(a in joins.aliases) aliases.push(joins.aliases[a]);
    for(k in joins.selectList) fieldRefs.push(joins.selectList[k]);

    sql += fieldRefs.join(", ") + "\nFROM " + Type.table + ' ' + rootTblAlias + " " + joins.joinList.join(' ');

    if(options.where) whereClause = _buildWhereClauseAndParams(options.where, rootTblAlias, joins);

    var mappedSqlStatement = {
        aliases: aliases,
        text: sql + whereClause.text || '' + (options.orderby ? " ORDER BY " + rootTblAlias + "." + options.orderby : ''),
        values: whereClause.params
    };

    _aliasCounter = 0; //reset GLOBAL counter for the aliases
    // should we simply store the counter to generate unique aliases in the Type perhaps?
    return mappedSqlStatement;
};



function _buildJoins(Type, rootAlias, joinOptions) {
    dbg.dlog('Entering sqlBuilder._buildJoins()');
    var selectList = [], // elements that belong in the select list, with incremented alias
        joinList = [], // the JOIN statements themselves, defining the above aliases
        joinAliases = [],
        joinWheres = [],
        nestedWhere, nestedJoins = {},
        nestedAlias, nestedJoin, nestedSelect, 
        opt, // join option
        details, // join option details
        field, // join option field name
        fieldDef, // current fieldDefinition (must be ForeignKeyField)
        alias, // current alias 
        as, // translated object to be added to parent
        ChildType; // type linked to by the ForeignKeyField

    if(dbg.debug) console.log(joinOptions);

    for(opt in joinOptions) {
        if(joinOptions[opt].type) { // if the field type is provided in the query
            ChildType = joinOptions[opt].type;
            if(dbg.debug) {
                dbg.dlog('Found join with provided type: ' + ChildType.type);
                console.log(ChildType);
            }
        } else {
            fieldDef = Type.getFieldDef(joinOptions[opt].on);
            if(fieldDef) { // If the field def is present in the mapping
                dbg.dlog('Field Type derived from mappings: ' + fieldDef[joinOptions[opt].on].foreignKeyType.type);
                if(dbg.debug) console.log(fieldDef);
                ChildType = fieldDef[joinOptions[opt].on].foreignKeyType;
            } else {
                throw new Error('OptionsError: Looks like your query or mapping is missing a DomainEntity reference.');
            }
        }

        alias = ChildType.table.substring(0, 3) + _aliasCounter;
        _aliasCounter++;

        for(field in ChildType.fields) { // fields is an array of {name:value}
            for(k in ChildType.fields[field]) {
                selectList.push(alias + '.' + k + ' as ' + alias + "_" + k);
            }
        }

        if(!fieldDef && !ChildType.getFieldDef(joinOptions[opt].on)) throw new Error('QueryError: field definition not found in mapping:' + ChildType.type + "." + joinOptions[opt].on);

        joinList.push('\nINNER JOIN ' + ChildType.table + ' ' + alias + ' ON ' + alias + '.' + ChildType.identifier + ' = ' + rootAlias + "." + joinOptions[opt].on);

        if(joinOptions[opt].where) { // save where clauses that have been nested.
            dbg.dlog('Nested where clause found:');
            if(dbg.debug) console.log(joinOptions[opt].where);
            joinWheres.push({
                alias: alias,
                where: joinOptions[opt].where
            })
        }

        //Deal with nested joins
        details = joinOptions[opt];

        if(details && details.join) {
            nestedJoins[opt] = sqlBuilder._buildJoins(ChildType, alias, details.join);
            if(nestedJoins[opt]) {
                for(nestedJoin in nestedJoins[opt].joinList) joinList.push(nestedJoins[opt].joinList[nestedJoin]);
                for(nestedAlias in nestedJoins[opt].aliases) joinAliases.push(nestedJoins[opt].aliases[nestedAlias]);
                for(nestedSelect in nestedJoins[opt].selectList) selectList.push(nestedJoins[opt].selectList[nestedSelect]);
                for(nestedWhere in nestedJoins[opt].whereList) joinWheres.push(nestedJoins[opt].whereList[nestedWhere]);
            }
        }

        //pull the nested join info out and mash it into joinAliases
        joinAliases.push({
            type: ChildType,
            alias: alias,
            as: opt,
            parentAlias: rootAlias
        })
    }

    return {
        selectList: selectList,
        joinList: joinList,
        aliases: joinAliases,
        whereList: joinWheres,
    };
}

function _buildWhereClauseAndParams(whereOptions, rootAlias, joins) {
    var field, counter = 0,
        alias, joinWhere, whereClause, paramValues = [],
        whereItems = [];

    // add where items for base table
    counter = sqlBuilder._pushWhereItems(rootAlias, whereOptions, whereItems, paramValues, counter);

    // add any where clauses from nested joins
    if(joins && joins.whereList) { // where clauses from nested joins
        for(joinWhere in joins.whereList) {
            alias = joins.whereList[joinWhere].alias;
            whereClause = joins.whereList[joinWhere].where;
            counter = sqlBuilder._pushWhereItems(alias, whereClause, whereItems, paramValues, counter);
        }
    }

    // render as text
    return {
        text: "\nWHERE " + whereItems.join(' \nAND ') +';',
        params: paramValues
    }
}

function _pushWhereItems(alias, whereOptions, whereItems, paramValues, counter) {

    for(field in whereOptions) { //object or scalar
        val = whereOptions[field]; //object or scalar
        counter++;
        if(typeof val == 'number' || typeof val == 'string' || val instanceof Date) {
            whereItems.push((alias ? alias + "." : '') + field + ' = ' + '$' + counter);
            paramValues.push(val);
        } else if(val instanceof Object) {
            whereItems.push((alias ? alias + "." : '') + field + ' ' + val.cmp + ' ' + '$' + counter);
            paramValues.push(val.value);
        }
    }
    return counter;
}


module.exports = dialect;