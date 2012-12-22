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
    
    PrimaryKeyField : function (options) {
        return {
            dbType : 'integer',
            jsType : Number,
            primaryKey : true,
            allowManualAssignment: false
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