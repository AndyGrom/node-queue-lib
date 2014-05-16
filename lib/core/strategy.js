/**
 * node-queue-lib
 * Copyright(c) 2014 year Andrey Gromozdov
 * License: MIT
 */


var strategies = {};

module.exports = {
    register : function(name, obj){
        strategies[name] = obj;
    },
    get : function(name) {
        return strategies[name];
    }
}