var dorm = require('../lib/dorm')
  , Entities = require('./domain/Entities');
 

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
        descriptions : {
            on : 'description_trans_id',
            join : {
                translation :{
                    on : 'translated_item_id',
                    type : Entities.Translation
                }
            }
        },
        name : {
            on : 'name_trans_id', //field in THIS table
            join : {
                translation : { // freeform join without foreign key in this direction
                    on: 'translated_item_id',
                    type: Entities.Translation, //ONLY needed when you are joining tables without a relationship in this parent
                    where:{
                        lang:{ // if an object is used, you must provide cmp
                            value:'ENG',
                            cmp:'like'
                        },
                        something_else : 'someval' //otherwise it defaults to =
                    }
                }
            }
        }
    },
    
    orderby:'name'
}, function (err, results){
    if (results && results[0]) {
        console.log('Raw obj:', results[0].__proto__);
    } else {
        console.log('No data returned.')
    }
    process.exit();
});
