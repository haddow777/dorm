var dorm = require('../lib/dorm')
  , e = require('./test_entities/entities');
  
module.exports["test: create user role"] = function (beforeExit, assert){

	//save a new instance
	var role = e.UserRole.create();
	
	role.name = 'admin';
	role.description = 'Administrative duties';
	
	dorm.save(role, function(err, results){
	    if (err){
	        console.log(err);
	    } else {
	        console.log('id after save: '+results.id);
	         
	        //test identifier
	        console.log('Identifier:', role.identifier);
	        
	        // get an instance
	        dorm.get(e.UserRole, { 
	            where: { 
	                name: {
	                    cmp:"=", 
	                    value:"admin"
	                },
	            }
	        }, function(se, rs){ 
	            if (se) {
	                console.log('Error reached.');
	                console.log(se);
	            } else {
	                console.log('Success!');
	                console.log(rs);
	                
	                // get an instance
	                dorm.deleteEntity(role, function(se1, rs1){ 
	                    if (se1) {
	                        console.log('Error reached.');
	                        console.log(se);
	                        process.exit();
	                    } else {
	                        console.log('Success!');
	                        console.log(rs1);
	                        process.exit();
	                    }
	                });
	            }
	        });
	        
	    }
	});
};

