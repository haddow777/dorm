var dorm = require('../..')
  , Entity = dorm.Entity
  , Fields = dorm.Fields;


exports.UserRole = Entity.create({type: 'UserRole', table:'user_roles'}).define([
    { id:Fields.PrimaryKeyField() },
    { name: Fields.StringField() }
]);

exports.TranslatedItem = Entity.create({type:'TranslatedItem',table:'translated_items'}).define([
    {id : Fields.PrimaryKeyUuidField()},
    {history_id : Fields.IntegerField()},
]);

exports.Translation = Entity.create({type:'Translation',table:'translations'}).define([
    {id : Fields.PrimaryKeyUuidField()},
    {history_id : Fields.IntegerField()},
    {lang : Fields.StringField(3)},
    {text : Fields.StringField()},
    {translated_item_id : Fields.ForeignKeyUuidField(exports.TranslatedItem)},
]);

exports.NodeType = Entity.create({type:'NodeType',table:'node_types'}).define([
    {id : Fields.PrimaryKeyUuidField()},
    {history_id : Fields.IntegerField()},
    {name_trans_id : Fields.ForeignKeyUuidField(exports.TranslatedItem)},
    {description_trans_id : Fields.ForeignKeyUuidField(exports.TranslatedItem)},
    {hierarchy_level : Fields.IntegerField()},
]);

exports.Node = Entity.create({type: 'Node', table:'nodes'}).define([
    { id : Fields.PrimaryKeyUuidField()},
    { name_trans_id : Fields.ForeignKeyUuidField(exports.TranslatedItem)},
    { description_trans_id : Fields.ForeignKeyUuidField(exports.TranslatedItem) },
    { node_type_id : Fields.ForeignKeyUuidField(exports.NodeType) },
]);


