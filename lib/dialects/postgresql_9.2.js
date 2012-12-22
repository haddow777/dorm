var original_dialect = require('./postgresql')
  , dialect;

dialect = Object.create(original_dialect);

dialect.buildSelectStatement = function (Type, options){
        var whereItems = []
          , aliases = []
          , a
          , sql = 'SELECT row_to_json(row) \nFROM (\n'
          , query = {}
          , paramValues = []
          , joins = {}
          , cmp
          , k
          , fields
          , counter = 0
          , whereClause = {}
          , rootTblAlias = Type.table.substring(0,3) + '1';// increment from here for new aliases 
                                                            //TODO: Intelligenly named aliases
        
        aliases.push({type:Type,alias:rootTblAlias});
        
        sql += ' \tSELECT ' + rootTblAlias + '.*'; // first field ref for main table
        
        if (!options.join) options.join = {};
        joins = sqlBuilder._buildJSONJoins(Type, rootTblAlias, options.join);
    
        for (a in joins.aliases){
            aliases.push(joins.aliases[a]);
            //sql += joins.aliases[a].selectList[0]; // just the first select list element.
        }
        
        sql += " from "+ Type.table + ' ' + rootTblAlias + " " + 
               joins.joinList.join(', ') + '\n ) row \n';
        
        if (options.where){
            whereClause = sqlBuilder._buildWhereClauseAndParams(options.where, rootTblAlias);
        }

        var mappedSqlStatement = {
            aliases : aliases,
            text : sql + whereClause.text || '' + (options.orderby ? " ORDER BY " + rootTblAlias + "."+options.orderby : ''),
            values : whereClause.params
        };
        
        sqlBuilder._aliasCounter = 2; //reset GLOBAL counter for the aliases
        // should we simply store the counter to generate unique aliases in the Type perhaps?
        return mappedSqlStatement;
    },
    
    // Build the select statement to format JSON instead of a flat row (Leverage PGSQL 9.2 row_to_json() )
    _buildJSONJoins : function (Type, rootAlias, joinOptions) {

        var selectList = [] // elements that belong in the select list, with incremented alias
          , joinList = [] // the JOIN statements themselves, defining the above aliases
          , joinAliases = []
          , fieldRefs = []
          , subQuery = {}
          , nestedJoins = {}
          , opt // join option
          , details // join option details
          , field // join option field name
          , fieldDef // current fieldDefinition (must be ForeignKeyField)
          , alias // current alias 
          , as // translated object to be added to parent
          , ChildType // type linked to by the ForeignKeyField;
        
        for (opt in joinOptions){
            
            fieldDef = Type.getFieldDef(opt);
            ChildType = fieldDef[opt].foreignKeyType;
            
            alias = ChildType.table.substring(0,3) + sqlBuilder._aliasCounter;
            dorm._aliasCounter++;
            
            selectList.push(alias + ' as ' + joinOptions[opt].as);
            
            for (field in Type.fields) { // fields is an array of {name:value}
                for (k in Type.fields[field]){
                    fieldRefs.push(k);
                }
            }
        
            
            //TODO: Deal with nested joins
            details = joinOptions[opt];

            // recursiveness
            if(details && details.join && details.join.as){
                nestedJoin[details] = _buildJSONJoins(ChildType, alias, details.join);
            }

            joinList.push('\n\tINNER JOIN ( \n'+
                            '\t\tSELECT ' + alias + '.* \n' + 
                            '\t\tFROM '+ ChildType.table+' '+alias+'\n'+
                            '\t\tINNER JOIN ' + ChildType.table + ' '+ 
                          alias + ' ON ' + alias + '.' + ChildType.identifier + ' = ' + 
                          rootAlias + "." + Type.identifier + " \n\t) " + 
                          alias + '('+fieldRefs.join(', ')+', ' +joinOptions.as+') on ' + alias+'.'+ChildType.identifier + ' = '+ rootAlias+'.'+Type.identifier);

            //pull the nested join info out and mash it into joinAliases
            joinAliases.push({type:ChildType, alias:alias, as:details.as, parentAlias:rootAlias});
        }
        
        // Build subQuery
        
        
        return {
            selectList : selectList,
            joinList : joinList,
            aliases : joinAliases,
            subQuery : subQuery
        };
    },
