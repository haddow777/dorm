var dorm = require('../lib/dorm')
  , Entities = require('./test_entities/entities');
 
module.exports["test: get Node "] = function (beforeExit, assert){
	dorm.get(Entities.Node, {
	    where : {
	        id : {
	            cmp:'=',
	            value:1
	        }
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
	                    type: Entities.Translation, //ONLY needed when you are joining tables without a relationship in this parent
	                    where : {
	                        lang:'ENG'
	                    }
	                }
	            }
	        }
	    },
	    
	    orderby:'name'
	}, function (err, results){
	    if (results && results[0]) {
	        console.log('Raw results:', results);
	        for (var f in results){
	            console.dir(results[f]);
	            console.log(results[f].name.translation.text);
	            console.log(results[f].description.translation.text);
	        }
	    } else {
	        console.log('No data returned.', err)
	    }
	});

};
