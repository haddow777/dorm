var util = require('util');

// TODO: transaction support !
var red, blue, reset;
red   = '\u001b[31m';
blue  = '\u001b[34m';
reset = '\u001b[0m';

var dbg = {
    config:function(opts){
        var conf;
        if (typeof opts === 'string'){
            conf = require(opts);
        } else if (typeof opts === 'object'){
            conf = opts;
        }
        this.debug = conf.debugOutput;
        this.showSql = conf.showSql;
        this.showLineNumbers = conf.showLineNumbers;
    },
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
        if (this.showLineNumbers) util.puts(dbg.currentLine());
        for (var i in args) {
            util.puts(util.inspect(args[i], false, null, true));        
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
