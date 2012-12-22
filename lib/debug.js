
var config = require('../config.json');

// TODO: transaction support !
var red, blue, reset;
red   = '\u001b[31m';
blue  = '\u001b[34m';
reset = '\u001b[0m';

var dbg = {
    debug : config.debugOutput,
    showSql: config.showSql,
    
    dlog:function (text){
        if (dbg.debug) console.log(red+text+reset);
    },
    
    slog:function (text){
        if(dbg.showSql) console.log(blue+text+reset);
    },
    
    red:red,
    blue:blue,
    reset:reset
};

module.exports = dbg;
