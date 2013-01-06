var dorm = require('..')
  , dbg = require('../lib/debug')
  , util = require('util')
  , e = require('./test_entities/entities');

module.exports['test dorm.save(node)'] = function (beforeExit, assert) { 
    var node = e.Node.create();
     
    node.name = 'test node';                
   
    dorm.createTable(e.Node, function (err, res){
        assert.ok(err==null);

        dorm.save(node, function(err,res) {
            assert.ok(res.id !== undefined);            
    
            dorm.dropTable(e.Node, function (err, res){
                assert.isNull(err);
                assert.isNotNull(res);
            });
        });
    });
};
