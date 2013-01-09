
var dorm = require('..').promises
  , dbg = require('../lib/debug')
  , util = require('util')
  , e = require('./test_entities/entities');

exports['test promises1'] = function (beforeExit, assert){    

    var node = e.Node.create();
     
    node.name = 'test node';                

/*
stub
*/

    dorm.createTable(e.Node)
    .then(function (win){
        assert.isNotNull(win);
        return dorm.save(node);
    }, function(fail){
        assert.ok(!fail);
    })
    .then(function (win){
        win.values.id=0;
        win.name='other node';
        return dorm.save(win);
    }, function (fail){
        assert.ok(!fail);
    }).then(function (win){
        assert.isNotNull(win);
        return dorm.dropTable(e.Node);
    }, function (fail){
        assert.ok(!fail);
    }).end();

    dorm.createTable(e.Node).then(dorm.save(node)).then(
};
