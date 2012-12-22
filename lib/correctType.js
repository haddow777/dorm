function isCorrectType (value, Field){
    if (Field.nullable && value === null) return true; //field is nullable, so accept a null value
    if ((Field.nullable !== true && value === null) 
        || value === undefined || !Field) return false;
    if (typeof value === 'boolean' && Field.jsType === Boolean) return true;
    if (typeof value === 'string' && Field.jsType === String) return true; 
    if (typeof value === 'number' && value % 1 !== 0 && Field.dbType === 'decimal') return true;
    if (typeof value === 'number' && value % 1 === 0 && Field.dbType === 'integer') return true;
    if (value instanceof Field.jsType) return true; //works only for Date
    return false;
}

module.exports = isCorrectType;
