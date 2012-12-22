var dorm = require('..')
  , e = require('./test_entities/entities');

module.exports['test dorm.save(node)'] = function (beforeExit, assert) { 
    var node = e.Node.create();

    node.name = 'test node';                

    for (var i in node){
        console.log(i,':',node[i]);
    }

    dorm.save(node, function(err,res) {
        console.log('Node saved', res, err);
    });
};
