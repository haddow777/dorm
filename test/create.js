var dorm = require('..')
  , e = require('./test_entities/entities');

module.exports['test dorm.save(node)'] = function (beforeExit, assert) { 
    var node = e.Node.create();
     
    node.name = 'test node';                
   
    dorm.createTable(e.Node, function (err, res){
        console.log(err);

        assert.ok(err==null);

        dorm.save(node, function(err,res) {
            console.log('Node saved', res, err);
            for (var i in node){
                console.log(i,':',node[i]);
            }
            dorm.dropTable(e.Node, console.log);
        });
    });
};
