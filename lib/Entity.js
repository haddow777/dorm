'use strict';

var Fields        = require('./Fields'),
	isCorrectType = require('./correctType'),
    dbg = require('./debug'),
    util = require('util'),
    Entity = {};

// model validation in setters/getters
Object.defineProperty(Entity, 'defineField', {
	enumerable: false,
	writable: false,
	value: function (name, Field) {
		// create a place to store the field definitions if it doesnt exist
		if(!this.hasOwnProperty('fields')) {
			Object.defineProperty(this, 'fields', {
				value: [],
				writable: true,
				enumerable: false
			});
		}
		// push the current field definition into the storage area
		var def = {};
		def[name] = Field;
		this.fields.push(def);

		// define the enumerable and usable property
		Object.defineProperty(this, name, {
			enumerable: true,
			get: function () {
                if (!this.instance) return undefined;

                if ((!this.values && !this.values[name]) && this.getFieldDef(name) === undefined)
                    throw new Error('FieldError: \''+ name +'\' not defined in mapping: '+Entity.type);

				return this.values[name];
			},
			set: function (value) {
				if(isCorrectType(value, Field)) {
					this.values[name] = value;
					this.values_set[name] = true;
				} else {
					throw new Error('TypeError: Cannot assign a value of ' + value + ' to a field type of ' + Field.dbType + '. (Field: ' + name + ')');
				}
			},
		});
	}
});

// create a way to define a property on a domain object
Object.defineProperty(Entity, 'define', {
	enumerable: false,
	writable: false,
	value: function (options) {
		var i, k, self = this;
		for(i in options) {
			for(k in options[i]) {
				this.defineField(k, options[i][k]);
			}
		}
		return self;
	}
});

Object.defineProperty(Entity, 'clear_values_set', {
	enumerable: false,
	writable: false,
	value: function () {
		this.values_set = {};
	}
});

Object.defineProperty(Entity, 'is_entity', {
	enumerable: false,
	writable: false,
	value: true
});

// inherit from this class (Entity.create(typeName, tableName))
Object.defineProperty(Entity, 'create', {
	enumerable: false,
	writable: false,
	value: function (options) {

		// This method can be used in 2 cases, to create new Domain types, and to instance them.
		// If we already have a type, we want to reuse some properties already set,
		// but mark this an instance
		var derived = Object.create(this);

		if(this.table && this.type && !this.instance) {
			//Mark this as an instance. Only instances can be save to the database.
			Object.defineProperty(derived, 'instance', {
				value: true,
				writable: false,
				enumerable: false
			});

			// create a place to store the field values if it doesnt exist
			if(!derived.hasOwnProperty('values')) {
				Object.defineProperty(derived, 'values', {
					value: [],
					writable: true,
					enumerable: false
				});
			}

			if(!derived.hasOwnProperty('values_set')) {
				Object.defineProperty(derived, 'values_set', {
					value: {},
					writable: true,
					enumerable: false
				});
			}
            
            // initialize values to null, leaving undefined entries -unmapped-
            for (var i in this.fields){
                for (var k in this.fields[i]){
                    derived.values[k] = null;
                }
            }

			//Bulk assignment, of course also validated - recommended way of assigning properties.
			Object.defineProperty(derived, 'assign', {
				enumerable: false,
				writable: false,
				value: function (values) {
					var val;
					for(val in values) {
						if(derived.hasOwnProperty(val)) {
							derived[val] = values[val];
						}
					}
				}
			});

			Object.defineProperty(derived, 'copyValues', {
				value: function (obj) {
					for(var k in obj) {
						derived.values[k] = obj[k];
					}
				}
			});

			Object.defineProperty(derived, 'toString', {
				value: function () {
					var s = [];
					for(var k in derived) {
						s.push(k + ':' + derived[k]);
					}
					return '{' + s.join() + '}';
				}
			});

		} else {
			if(!options.type || !options.table) {
				console.log(options);
				throw new Error('EntityError: Cannot create a base entity without a type and table.');
			}


			Object.defineProperty(derived, 'table', {
				value: options.table,
				writable: false,
				enumerable: false
			});

			Object.defineProperty(derived, 'type', {
				value: options.type,
				writable: false,
				enumerable: false
			});

			// get an array containing all primary key names in order, and cache it in the entity
			Object.defineProperty(derived, 'identifier', {
				enumerable: false,
				get: function () {
					if(typeof derived._identifier_cache == 'undefined') {
						Object.defineProperty(derived, '_identifier_cache', {
							writable: true,
							enumerable: false
						});
						var k, fieldDef, fieldName, pkeys = [];

						for(k in derived.fields) {
							fieldDef = derived.fields[k];
							for(fieldName in fieldDef)
							if(fieldDef[fieldName].primaryKey) {
								pkeys.push(fieldName);
							}
						}
						derived._identifier_cache = pkeys;
					}
					return derived._identifier_cache;
				},
			});

			// get an array containing all primary key names in order, and cache it in the entity
			Object.defineProperty(derived, 'getFieldDef', {
				enumerable: false,
				value: function getFieldDef (defName) {
					var k, fieldDef, fieldName, pkeys = [];

					for(k in derived.fields) {
						fieldDef = derived.fields[k];
						for(fieldName in fieldDef) {
							if(fieldName === defName) {
								return fieldDef;
							}
						}
					}
				}
			});
		}
		return derived;
	}
});  


module.exports = Entity;
