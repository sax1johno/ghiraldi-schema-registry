var jugglingDB = require('jugglingdb'),
    _ = require('underscore'),
    EventEmitter = require('events').EventEmitter,
    schema,
    adapter,
    adapterArgs,
    schemas,
    util = require('util');
    
/** 
 * Constructor creates a new Schema Registry with the specifed adapter.  This
 * allows the application to specify which adapter their application.  Ghiraldi
 * supports one type of data store per application through the schema registry.
 **/
function SchemaRegistry(adapter, args) {
//    /* This class is a singleton */
    if (arguments.callee._singletonInstance) {
        return arguments.callee._singletonInstance;
    }
    arguments.callee._singletonInstance = this;
   
    EventEmitter.call(this);
    
    adapterArgs = args || {};
    adapter = adapter || 'memory';
    console.log("Adapter = " + adapter + " and args = " + args);
    schema = new jugglingDB.Schema(adapter, adapterArgs);
    schemas = {};
    
    return this;
}

/**
 * Sets up a new adapter for the schema registry.  Useful for adding a schema system and then
 * initializing it.
 **/
 SchemaRegistry.prototype.setAdapter = function(pAdapter, pArgs, fn) {
     try {
         schema = new jugglingDB.Schema(pAdapter, pArgs);
         adapter = pAdapter;
         adapterArgs = pArgs;
     } catch (e) {
         if (!_.isUndefined(fn) && !_.isNull(fn) && _.isFunction(fn)) {
            fn(e, false);
         }
    }
    if (!_.isUndefined(fn) && !_.isNull(fn) && _.isFunction(fn)) {
        fn(null, true);
    }
 }
/** 
 * Add a new schema to the schema registry.  If a tag is re-used, the previous schema
 * is overwritten.
 * @param schema the schema to add.
 * @param tag the tag for this schema
 * @return the added schema.
 **/
SchemaRegistry.prototype.add = function(tag, model, fn) {
    if (!_.isUndefined(schemas[tag]) && !_.isNull(schemas[tag])) {
        if (!_.isUndefined(fn) && !_.isNull(fn) && _.isFunction(fn)) {
            fn(schemas[tag] = model);
        } else {
            schemas[tag] = model;
        }
    } else {
        var thisModel = schema.define(tag, model);
        if (!_.isUndefined(fn) && !_.isNull(fn) && _.isFunction(fn)) {
            fn(schemas[tag] = thisModel);
        } else {
            schemas[tag] = thisModel;
        }
    }
    this.emit('add', schemas[tag]);
    return schemas[tag];
};

/**
 * Remove a schema from the schema registry.
 * @param tag the tag for the schema to be removed
 * @return true if the delete was successful, false otherwise.
 **/
SchemaRegistry.prototype.remove = function(tag, fn) {
    var deleted = schemas[tag];
    console.log("delected = " + JSON.stringify(deleted));
    delete schemas[tag];
    if (!_.isUndefined(fn) && !_.isNull(fn) && _.isFunction(fn)) {
        fn(true);
    }
    this.emit('remove', deleted); 
    return true;
};
    
/** 
 * Get the specified schema from the registry. Returns null if no
 * schema with the specified tag exists.
 * @param tag the tag name of the schema.
 * @fn a callback function that will contain the returned schema, fn(schema);
 **/
SchemaRegistry.prototype.getSchema = function(tag, fn) {
    if (_.isUndefined(schemas[tag]) && _.isNull(schemas[tag])) {
        schemas[tag] = schema.define(tag, {});
    }
    if (!_.isUndefined(fn) && !_.isNull(fn) && _.isFunction(fn)) {
        fn(schemas[tag]);
    }
    return schemas[tag];
};
    
/** For testing purposes.  Will probably go away soon **/
SchemaRegistry.prototype.log = function(fn) {
    if (!_.isUndefined(fn) && !_.isNull(fn)) {
        fn(schemas);
    }
    return schemas;
};

/**
 * Return the names of all of the currently registered schemas.
 * @param fn a callback function that returns the names.
 **/
SchemaRegistry.prototype.getSchemaNames = function(fn) {
    var myKeys = _.keys(schemas);
    if (!_.isUndefined(fn) && !_.isNull(fn)) {
        fn(myKeys);      
    }
    return myKeys;
};

SchemaRegistry.prototype.__proto__ = EventEmitter.prototype;

module.exports = SchemaRegistry;