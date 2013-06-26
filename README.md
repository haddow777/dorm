dorm
==========

An ORM for node.js built for efficiency and flexibility. (but for now is very alpha!)

Usage example: (For a more detailed explanation, see http://interaxiom.blogspot.ca/2013/02/dorm-yet-another-orm-for-node.html)

Given the following entity definitions:

    var dorm = require('dorm')
	  , Entity = dorm.Entity
	  , Fields = dorm.Fields;


	exports.UserRole = Entity.create({type: 'UserRole', table:'user_roles'}).define([
	    { id:Fields.PrimaryKeyField() },
	    { name: Fields.StringField() }
	]);

	exports.TranslatedItem = Entity.create({type:'TranslatedItem',table:'translated_items'}).define([
	    {id : Fields.PrimaryKeyUuidField()},
	    {history_id : Fields.IntegerField()},
	]);

	exports.Translation = Entity.create({type:'Translation',table:'translations'}).define([
	    {id : Fields.PrimaryKeyUuidField()},
	    {history_id : Fields.IntegerField()},
	    {lang : Fields.StringField(3)},
	    {text : Fields.StringField()},
	    {translated_item_id : Fields.ForeignKeyUuidField(exports.TranslatedItem)},
	]);

	exports.NodeType = Entity.create({type:'NodeType',table:'node_types'}).define([
	    {id : Fields.PrimaryKeyUuidField()},
	    {history_id : Fields.IntegerField()},
	    {name_trans_id : Fields.ForeignKeyUuidField(exports.TranslatedItem)},
	    {description_trans_id : Fields.ForeignKeyUuidField(exports.TranslatedItem)},
	    {hierarchy_level : Fields.IntegerField()},
	]);

	exports.Node = Entity.create({type: 'Node', table:'nodes'}).define([
	    { id : Fields.PrimaryKeyUuidField()},
	    { name_trans_id : Fields.ForeignKeyUuidField(exports.TranslatedItem)},
	    { description_trans_id : Fields.ForeignKeyUuidField(exports.TranslatedItem) },
	    { node_type_id : Fields.ForeignKeyUuidField(exports.NodeType) },
	]);


Using these together with the query engine, we can then build:

	dorm.get(Entities.Node, {
		where : {
		    id : 1
		},

		join : {
		    node_type : {
		        on : 'node_type_id', // must be a ForeignKeyField!
		    },
		    description : {
		        on : 'description_trans_id',
		        join : {
		            translation :{
		                on : 'id',
		                type : Entities.Translation,
		                where :{
		                    lang : 'ENG'
		                }
		            }
		        }
		    },
		    name : {
		        on : 'name_trans_id', //field in THIS table
		        join : {
		            translation : { // freeform join without foreign key in this direction
		                on: 'id',
		                type: Entities.Translation,                         
		                where : {
		                    lang:'ENG'
		                }
		            }
		        }
		    }
		},
	 
	     }, function (err, results){ // Success
		console.dir(results[f]);
	     } else { // Failure
		console.log('Error encountered: ', err)
	     }
	 });

Dorm will then create the following query:

	SELECT
	    nod0.id as nod0_id,
	    nod0.name_trans_id as nod0_name_trans_id,
	    nod0.description_trans_id as nod0_description_trans_id,
	    nod0.node_type_id as nod0_node_type_id,
	    nod1.id as nod1_id,
	    nod1.history_id as nod1_history_id,
	    nod1.name_trans_id as nod1_name_trans_id,
	    nod1.description_trans_id as nod1_description_trans_id,
	    nod1.hierarchy_level as nod1_hierarchy_level,
	    tra2.id as tra2_id,
	    tra2.history_id as tra2_history_id,
	    tra3.id as tra3_id,
	    tra3.history_id as tra3_history_id,
	    tra3.lang as tra3_lang,
	    tra3.text as tra3_text,
	    tra3.translated_item_id as tra3_translated_item_id,
	    tra4.id as tra4_id,
	    tra4.history_id as tra4_history_id,
	    tra5.id as tra5_id,
	    tra5.history_id as tra5_history_id,
	    tra5.lang as tra5_lang,
	    tra5.text as tra5_text,
	    tra5.translated_item_id as tra5_translated_item_id
	FROM nodes nod0
	    INNER JOIN node_types nod1 ON nod1.id = nod0.node_type_id
	    INNER JOIN translated_items tra2 ON tra2.id = nod0.description_trans_id
	    INNER JOIN translations tra3 ON tra3.id = tra2.id
	    INNER JOIN translated_items tra4 ON tra4.id = nod0.name_trans_id
	    INNER JOIN translations tra5 ON tra5.id = tra4.id
	WHERE nod0.id = $1 -- 1
	AND tra3.lang = $2 -- 'ENG'
	AND tra5.lang = $3 -- 'ENG'
	ORDER BY nod0.name

Transactions

Support for transactions have been added now. It is pretty basic, but allows you control them over multiple Dorm queries. (NOTE: these functions have only been tested using the Postgres functionality of Dorm. For a test, check out dorm-chains library.)

Added functions are:

	dorm.begin()

	dorm.rollback()

	dorm.savepoint("name")

	dorm.rollbackTo("name")

	dorm.commit()

On top of that, there is also a new function for calling stored procedures in the database:

	dorm.runStoredProcedure("name()")

Also, to better manage connections in Postgres, a special function has been added to close it down safely. It should be called at the end of your use of the connection or it can cause your program to hang when finishing.

	dorm.end()


*Supported Databases:*
 * PostgreSQL > 8

## License 

(The MIT License)

Copyright (c) 2013 Daniel Werner &lt;dan.werner@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
