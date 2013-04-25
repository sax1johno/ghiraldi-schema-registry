var jugglingDB = require('jugglingdb'),
    _ = require('underscore'),
    EventEmitter = require('events').EventEmitter,
    schema;
    
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
 * @param tag the tag for this schema (used to retrieve the schema)
 * @return the added schema.
 **/
SchemaRegistry.prototype.add = function(tag, schema, fn) {
    if (!_.isUndefined(fn) && !_.isNull(fn) && _.isFunction(fn)) {
        fn(this.schemas[tag] = schema);
    } else {
        this.schemas[tag] = schema;
    }
    this.emit('add', tag, schema);        
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
 * Get the specified schema from the registry, or return a new schema of one
 * does not exist already.  Use this method to create new schemas or extend
 * existing ones.
 * @param tag the tag name of the schema.
 * @fn a callback function that will contain the returned schema, fn(schema);
 **/
SchemaRegistry.prototype.getSchema = function(tag, fn) {
    if (_.isUndefined(this.schemas[tag]) || _.isNull(this.schemas[tag])) {
        this.schemas[tag] = schema.define(tag, {});
    }
    if (!_.isUndefined(fn) && !_.isNull(fn)) {
        fn(this.schemas[tag]);
    }

    return this.schemas[tag];
};
    
/** For testing purposes.  Will probably go away soon **/
SchemaRegistry.prototype.log = function(fn) {
    if (!_.isUndefined(fn) && !_.isNull(fn)) {
        fn(this.schemas);
    }
    return this.schemas;
};
    
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