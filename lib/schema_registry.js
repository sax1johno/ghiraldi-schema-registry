var jugglingDB = require('jugglingdb'),
    _ = require('underscore'),
    EventEmitter = require('events').EventEmitter,
    schema,
    util = require('util');
    
/** 
 * Constructor creates a new Schema Registry with the specifed adapter.  This
 * allows the application to specify which adapter their application.  Ghiraldi
 * supports one type of data store per application through the schema registry.
 **/
function SchemaRegistry(adapter, args) {
//    /* This class is a singleton */
//    if (arguments.callee._singletonInstance) {
//        return arguments.callee._singletonInstance;
//    }
//    arguments.callee._singletonInstance = this;
//    
    EventEmitter.call(this);
    
    args = args || {};
    schema = new jugglingDB.Schema(adapter, args);
    this.schemas = {};
    
    return this;
}

/** 
 * Add a new schema to the schema registry.  If a tag is re-used, the previous schema
 * is overwritten.
 * @param schema the schema to add.
 * @param tag the tag for this schema
 * @return the added schema.
 **/
SchemaRegistry.prototype.add = function(tag, model, fn) {
    if (!_.isUndefined(this.schemas[tag]) && !_.isNull(this.schemas[tag])) {
        if (!_.isUndefined(fn) && !_.isNull(fn) && _.isFunction(fn)) {
            fn(this.schemas[tag] = model);
        } else {
            this.schemas[tag] = model;
        }
    } else {
        var thisModel = schema.define(tag, model);
        if (!_.isUndefined(fn) && !_.isNull(fn) && _.isFunction(fn)) {
            fn(this.schemas[tag] = thisModel);
        } else {
            this.schemas[tag] = thisModel;
        }
    }
    this.emit('add', this.schemas[tag]);
    return this.schemas[tag];
};

/**
 * Remove a schema from the schema registry.
 * @param tag the tag for the schema to be removed
 * @return true if the delete was successful, false otherwise.
 **/
SchemaRegistry.prototype.remove = function(tag, fn) {
    var deleted = this.schemas[tag];
    if (!_.isUndefined(fn) && !_.isNull(fn) && _.isFunction(fn)) {
        fn(delete this.schemas[tag]);
    } else {
        return delete this.schemas[tag];
    }
    this.emit('remove', deleted);
};
    
/** 
 * Get the specified schema from the registry. Returns null if no
 * schema with the specified tag exists.
 * @param tag the tag name of the schema.
 * @fn a callback function that will contain the returned schema, fn(schema);
 **/
SchemaRegistry.prototype.getSchema = function(tag, fn) {
    if (!_.isUndefined(fn) && !_.isNull(fn) && _.isFunction(fn)) {
        fn(schema.models[tag]);
    }
    return schema.models[tag];
};
    
/** For testing purposes.  Will probably go away soon **/
SchemaRegistry.prototype.log = function(fn) {
    if (!_.isUndefined(fn) && !_.isNull(fn)) {
        fn(this.schemas);
    }
    return this.schemas;
};

/**
 * Return the names of all of the currently registere schemas.
 * @param fn a callback function that returns the names.
 **/
SchemaRegistry.prototype.getSchemaNames = function(fn) {
    var keys = _.keys(this.schemas);
    if (!_.isArray(keys)) {
        keys = [keys];
    }
    if (!_.isUndefined(fn) && !_.isNull(fn)) {
        fn(keys);      
    }
    return keys;
};

SchemaRegistry.prototype.__proto__ = EventEmitter.prototype;

module.exports = SchemaRegistry;