'use strict;'

var dorm = require('../');
var F = dorm.Fields;

module.exports['test TestTest'] = function (beforeExit, assert) {
    assert.ok(true, 'This test will pass.');
};

module.exports['test DomainEntityTest'] = function(beforeExit, assert) { 
    
    var instance;
    
    function defineTypes() {
        var aType = dorm.Entity.create({type:'aType', table:'aTable'}).define([{id:F.IntegerField()}]);
        
        var a = aType.create();
        a.id = 15;
        
        var SomeType = dorm.Entity.create({type:'SomeType', table:'some_table_here'});
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
        
        assert.ok(instance.name === 'some name', 'Test Name');
        assert.ok(instance.flag === false, 'Test Name');
        assert.ok(instance.cost === 4.56, 'Test Name');
        assert.ok(instance.fkID === 15, 'Test Name');
    }
    
    assert.doesNotThrow(defineTypes, 'Failed to not throw', 'This test is for all domainEntity Fields.');
} 

