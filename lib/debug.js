
var config = require('../config.json');

// TODO: transaction support !
var red, blue, reset;
red   = '\u001b[31m';
blue  = '\u001b[34m';
reset = '\u001b[0m';

var dbg = {
    debug : config.debugOutput,
    showSql: config.showSql,

    dlog:function (){
        if (dbg.debug) {
            dbg._log(red, arguments);
        }
    },
    
    slog:function (){
        if(dbg.showSql){
            dbg._log(blue, arguments);
        }
    },

    _log: function (color, args){
        console.log(dbg.currentLine()); 
        for (var i in args){
            console.log(blue+args[i]+reset);
        }
    },  
 
    currentLine:function () {
        var e = new Error();
        return e.stack.split('\n')[4].split(new RegExp('[\(,\)]'))[1];
    },
    
    red:red,
    blue:blue,
    reset:reset
};

module.exports = dbg;
