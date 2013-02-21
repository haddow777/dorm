//baseDialect.js

'use strict';

var dbg = require('../debug'),
    dialect = {},
    _aliasCounter = 0;

/* stubbed out for dorm to load this in dorm */
dialect.config = {};

dialect.buildCreateTableStatement = function (entity) {

    var sql = "CREATE TABLE " + entity.table + " (",
        columns = [],
        col, 
        field;
    for(col in entity.fields) {
        for (field in entity.fields[col]){
            if(entity.fields[col][field].primaryKey === true) {
                if (entity.fields[col][field].dbType.toUpperCase() === 'UUID') {
                    columns.push(field + " UUID PRIMARY KEY"); // pgsql UUID
                } else {
                    columns.push(field + " SERIAL PRIMARY KEY"); // pgsql SERIAL
                }
            } else {
                columns.push(field + " " + entity.fields[col][field].dbType);
            }
        }
    }
    sql += columns.join(', ');
    sql += ");";
    dbg.slog(sql);
    return sql;
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
            if(!entity.fields[fieldDef][k].primaryKey || entity.fields[fieldDef][k].dbType.toUpperCase() === 'UUID') {
                fieldRefs.push(k);
                paramRefs.push('$' + counter);
                values.push(entity[k]);
                counter++;
                break;
            } 
            if (entity.fields[fieldDef][k].primaryKey) {
                primaryKeyField = k;
            }
        }

    }

    sql += ' (' + 
            fieldRefs.join(", ") + 
            ') VALUES (' + 
            paramRefs.join(', ') + 
            ') returning '+ entity.identifier +';';

    var query = {
        text: sql,
        values: values
    };
    dbg.slog(sql);
    dbg.dlog(values);
    return query;
};


dialect.buildUpdateQuery = function (entity) { //TODO: needs to accept a where clause
    var field, 
        fieldRefs = [],
        values = [],
        counter = 1,
        primaryKeyClause,
        fieldDef, k, primaryKeyField, results, sql;

    // this is where we make use of the enumerable:true properties, and is why we hide everything else.
    for(fieldDef in entity.fields) { // find the field in the ordered entity.fields array
        for(k in entity.fields[fieldDef]) {
            if(!entity.fields[fieldDef][k].primaryKey) {
                fieldRefs.push(k+ " = " + '$' + counter);
                values.push(entity[k]);
                counter++;
                break;
            } else { //TODO: use the _buildWhereClauseAndParams() instead
                var primeVal = (entity.fields[fieldDef][k].jsType === Number ? entity[k] : ("'" + entity[k] + "'")); //typeof entity[k] === 'Number'
                primaryKeyClause = k + ' = ' + primeVal;
            }
        }

    }

    sql = 'UPDATE ' + entity.table + ' SET ' + 
          fieldRefs.join(", ") + 
          ' WHERE ' + primaryKeyClause +';';

    var query = {
        text: sql,
        values: values
    };
    dbg.slog(sql);
    return query;
};

dialect.buildDropTableStatement = function (entity){
    var sql = 'DROP TABLE ' + entity.table + ';'
    dbg.slog(sql);
    return sql;
};

dialect.buildDeleteStatement = function (TypeOrEntity, options) {
    if(!TypeOrEntity) throw new Error('DeleteError: could not determine type of entity.', options);

    var whereClauseAndParams = {},
        query = {
            text: 'DELETE FROM ' + TypeOrEntity.table,
            values: []
        };
    console.log('DELETE ENTITY', TypeOrEntity)
    if(options.where) {

        if(dbg.debug) {
            dbg.dlog('Options for where:');
            console.log(options);
            dbg.dlog('Type.table:');
            console.log(TypeOrEntity);
        }

        //whereClauseAndParams = sqlBuilder._buildWhereClauseAndParams(options.where);
        whereClauseAndParams = _buildWhereClauseAndParams(options.where);
        dbg.dlog(whereClauseAndParams.text);
    }

    return {
        text: query.text + (whereClauseAndParams.text || '') + ';',
        values: whereClauseAndParams.params
    }
}

dialect.buildFlatSelectStatement = function (Type, options) {
    return this.buildSelectStatement(Type, options);
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

    for(var field in Type.fields) { // fields is an array of {name:value}
        for(var k in Type.fields[field]) {
            fieldRefs.push(rootTblAlias + '.' + k + ' as ' + rootTblAlias + '_' + k);
        }
    }

    if(!options.join) options.join = {};
    joins = _buildJoins(Type, rootTblAlias, options.join);

    for(var a in joins.aliases) aliases.push(joins.aliases[a]);
    for(var k in joins.selectList) fieldRefs.push(joins.selectList[k]);

    sql += fieldRefs.join(", ") + 
            " FROM " + Type.table + ' ' + 
            rootTblAlias + " " + 
            (joins.joinList.join(' ') || '');

    if(options.where) whereClause = _buildWhereClauseAndParams(options.where, rootTblAlias, joins);

    var mappedSqlStatement = {
        aliases: aliases,
        text: sql + (whereClause.text || '') + (options.orderby ? " ORDER BY " + rootTblAlias + "." + options.orderby : ''),
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
            console.log('* Found join with provided type: ' + ChildType.type);
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
            for(var k in ChildType.fields[field]) {
                selectList.push(alias + '.' + k + ' as ' + alias + "_" + k);
            }
        }

        if(!fieldDef && !ChildType.getFieldDef(joinOptions[opt].on)) throw new Error('QueryError: field definition not found in mapping:' + ChildType.type + "." + joinOptions[opt].on);

        if (!joinOptions[opt].type) {
            joinList.push('INNER JOIN ' + ChildType.table + ' ' + alias + ' ON ' + 
                alias + '.' + ChildType.identifier + ' = ' + rootAlias + "." + joinOptions[opt].on);
        } else {
            joinList.push('INNER JOIN ' + ChildType.table + ' ' + alias + ' ON ' + 
                alias + '.' + joinOptions[opt].on + ' = ' + rootAlias + "." + Type.identifier);
        }

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
            nestedJoins[opt] = _buildJoins(ChildType, alias, details.join);
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
    counter = _pushWhereItems(rootAlias, whereOptions, whereItems, paramValues, counter);

    // add any where clauses from nested joins
    if(joins && joins.whereList) { // where clauses from nested joins
        for(joinWhere in joins.whereList) {
            alias = joins.whereList[joinWhere].alias;
            whereClause = joins.whereList[joinWhere].where;
            counter = _pushWhereItems(alias, whereClause, whereItems, paramValues, counter);
        }
    }

    // render as text
    return {
        text: " WHERE " + whereItems.join(' AND '), // +';',
        params: paramValues
    }
}

function _pushWhereItems(alias, whereOptions, whereItems, paramValues, counter) {
    for(var field in whereOptions) { //object or scalar
        var val = whereOptions[field]; //object or scalar

        if(typeof val == 'number' || typeof val == 'string' || val instanceof Date) {
            counter++;
            whereItems.push((alias ? alias + "." : '') + field + ' = ' + '$' + counter);
            paramValues.push(val);
        } else if(val instanceof Object && val.value === null) {
            whereItems.push((alias ? alias + "." : '') + field + ' is null');
        } else if(val instanceof Object) {
            counter++;
            whereItems.push((alias ? alias + "." : '') + field + ' ' + val.cmp + ' ' + '$' + counter);
            paramValues.push(val.value);
        }
    }
    return counter;
}


module.exports = dialect;
