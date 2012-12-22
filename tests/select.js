var dorm = require('../lib/dorm')
  , e = require('../lib/domain/Entities')
  , util = require('util');

var handler = function(err, res){
    console.log(err, util.inspect(res));
    process.exit();
};
  
dorm.get(UserRole, {
        where:{
            name:{
              cmp:'=', value:'admin'
            }
        }
    }, handler);
    
dorm.get(UserRole, 1, handler);


console.log(UserRole.getFieldDef('id'));

