'use strict';

// field types 
var BaseTypes = {

    BooleanField : function (){
        return {
            dbType : 'boolean',
            jsType : Boolean,
        }
    },

    DecimalField : function(precision){
        return {
            precision : precision,
            dbType : 'decimal',
            jsType : Number,
        }
    },

    StringField : function(precision){
        return {
            precision : precision,
            dbType : 'varchar',
            jsType : String,
        }
    },

    IntegerField : function (){
        return {
            dbType : 'integer',
            jsType : Number,
        }
    },

    UuidField : function () {
        return {
            dbType : 'uuid',
            jsType : String,
        }
    },
    
    ForeignKeyField : function (fkType, options){
        var nullable;
        if (!fkType){
            throw new Error("ForeignKeyField type must be an object.");
        }
        if(options && options.nullable){
            nullable = true;
        }
        return {
            dbType : 'integer',
            jsType : Number,
            foreignKeyType : fkType,
            nullable : nullable
        }
    },

    ForeignKeyUuidField : function (fkType, options){
        var nullable;
        if (!fkType){
            throw new Error("ForeignKeyField type must be an object.");
        }
        if(options && options.nullable){
            nullable = true;
        }
        return {
            dbType : 'uuid',
            jsType : String,
            foreignKeyType : fkType,
            nullable : nullable
        }
    },
    
    PrimaryKeyField : function (options) {
        return {
            dbType : 'integer',
            jsType : Number,
            primaryKey : true
        }
    },

    PrimaryKeyUuidField : function (options) {
        return {
            dbType : 'uuid',
            jsType : String,
            primaryKey : true
        }
    },

    DateField : function (){
        return {
            dbType : 'timestamp',
            jsType : Date,
        }
    },
};

module.exports = BaseTypes;
