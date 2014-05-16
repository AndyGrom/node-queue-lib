/**
 * node-queue-lib
 * Copyright(c) 2014 year Andrey Gromozdov
 * License: MIT
 */

/*global setImmediate*/
module.exports = {
    after : function (count, callback) {
        var i = 0;
        return function(){
            if (++i >= count) {
                callback();
            }
        }
    },
    asyncLoop: function (callback) {
        var index = 0;
        (function next() {
            setImmediate(function() {
                callback(++index, next);
            });
        }());
    },
    inherits : function(ctor, superCtor) {
        ctor.super_ = superCtor;
        ctor.prototype = Object.create(superCtor.prototype, {
            constructor: {
                value: ctor,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
    }
};