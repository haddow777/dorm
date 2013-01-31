var dorm = require('../lib/dorm')
  , e = require('./test_entities/entities')
  , util = require('util');

module.exports["test: select UserRole"] = function (beforeExit, assert){
	dorm.get(e.UserRole, {});
};

