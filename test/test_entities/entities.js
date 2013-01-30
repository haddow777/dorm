var dorm = require('../..')
  , Entity = dorm.Entity
  , Fields = dorm.Fields;

var Node = Entity.create({type: 'node', table:'nodes'}).define([
    { id:Fields.PrimaryKeyField() },
    { name: Fields.StringField() }
]);

var UserRole = Entity.create({type: 'node', table:'nodes'}).define([
    { id:Fields.PrimaryKeyField() },
    { name: Fields.StringField() }
]);

module.exports.Node = Node;
module.exports.UserRole = UserRole;
