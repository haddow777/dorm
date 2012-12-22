'use strict;'

var R = require('../');
var F = R.Fields
  , rhizo = R;

module.exports.TestTest = function (test) {
    test.expect(1);
    test.ok(true, 'This test will pass.');
    test.done();
};

module.exports.DomainEntityTest = function(test) {
    test.expect(5);
    
    var instance;
    
    function defineTypes() {
        var aType = R.DomainEntity.create({type:'aType', table:'aTable'}).define([{id:F.IntegerField()}]);
        
        var a = aType.create();
        a.id = 15;
        
        var SomeType = R.DomainEntity.create({type:'SomeType', table:'some_table_here'});
        SomeType.define([
            {id:F.PrimaryKeyField()},
            {name:F.StringField()},
            {flag:F.BooleanField()},
            {cost:F.DecimalField()},
            {fkID:F.ForeignKeyField(aType, {nullable:true})}
        ]);
        
        instance = SomeType.create();
        instance.name = 'some name';
        instance.flag = false;
        instance.cost = 4.56;
        instance.fkID = a.id;
        
        test.ok(instance.name === 'some name', 'Test Name');
        test.ok(instance.flag === false, 'Test Name');
        test.ok(instance.cost === 4.56, 'Test Name');
        test.ok(instance.fkID === 15, 'Test Name');
    }
    
    test.doesNotThrow(defineTypes, 'Failed to not throw', 'This test is for all domainEntity Fields.')

    test.done();
} 

// this test will fail unless you have a postgres instance configured and config.json set.
module.exports.ConnectTest = function (test){
    test.expect(1);
    rhizo.connect(function(err){ 
        test.ifError(err);
        test.done();
    },
    function(success){
        test.ok(success);
        test.done();
    });
}
