// http://stackoverflow.com/questions/13300863/why-does-console-log-not-show-inherited-properties-from-object-create

var util = require('util');
var Base = {};

module.exports["test: some JavaScript things I should know."] = function (beforeExit, assert){
	Object.defineProperty(Base, 'prop1', {
	    enumerable:true,
	    get:function(){ return 'prop1 value';}
	});
	
	Object.defineProperty(Base, 'prop2', {
	    enumerable:true,
	    value : 'prop 2 value'
	});
	
	Object.defineProperty(Base, 'create', {
	    value:function(){
	        return Object.create(Base);
	    }
	});
	
	var derived = Base.create();
	
	Object.defineProperty(derived, 'prop3', {
	    enumerable:true,
	    value:'prop 3 value'
	});

};