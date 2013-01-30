
var dorm = require('./lib/dorm')
  , Fields = require('./lib/Fields')
  , Entity = require('./lib/Entity');
  
dorm.Fields = Fields;
dorm.Entity = Entity;

module.exports = dorm;
 