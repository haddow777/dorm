var dorm = require('../..')
  , Entity = dorm.Entity
  , Fields = dorm.Fields;

var Node = Entity.create('node', 'nodes').define([
    { id:Fields.PrimaryKeyField() },
    { name: Fields.StringField() }
]);

module.exports.Node = Node;
