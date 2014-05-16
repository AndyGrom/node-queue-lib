/**
 * node-queue-lib
 * Copyright(c) 2014 year Andrey Gromozdov
 * License: MIT
 */

var storage = {};

module.exports = function createMemoryStorage(name) {

    if (!storage[name]) {
        var data = [];
        var id = 0;
        storage[name] = {
            next : function(callback) {
                callback(data.shift());
            },
            push : function(obj, callback) {
                obj.id = ++id;
                data.push(obj);
                callback && callback();
            },
            count : function(callback) {
                callback(null, data.length)
            },
            unshift : function(obj, callback) {
                callback && callback(data.unshift(obj));
            }
        };
    }
    return storage[name];
};