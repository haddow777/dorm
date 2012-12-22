var R = require('rhizomorph')
  , Entities = require('../lib/domain/Entities');

var entityName, entity;
for (entityName in Entities){
    entity = Entities[entityName];
    runQuery(entity);
}

function runQuery(entity){
    dorm.get(entity, 1, function (err, results){
        if (results && results[0]) {
            console.log(entity.type + ' : ', results[0].toString());
        } else {
            console.log(entity.type + ' : ' + 'No data returned.')
        }
    });
}
