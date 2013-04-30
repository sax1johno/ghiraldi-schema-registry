var jugglingDB = require('jugglingdb'),
    _ = require('underscore'),
    EventEmitter = require('events').EventEmitter,
    schema,
    adapter,
    adapterArgs,
    schemas,
    util = require('util'),
    alreadyRegistered,
    util = require('util'),
    logger = require('ghiraldi-simple-logger');
    
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
    logger.log('trace', "Adapter = " + adapter + " and args = " + args);
    schema = new jugglingDB.Schema(adapter, adapterArgs);
    schemas = {};
    alreadyRegistered = false;
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
 * is extended.
 * @param schema the schema to add.
 * @param tag the tag for this schema
 * @return the added schema.
 **/
SchemaRegistry.prototype.add = function(tag, model, fn) {
    // Right now, we just clobber one model with another.  Eventually this
    // should be changed to throw an exception?
    if (!_.isUndefined(schemas[tag]) && !_.isNull(schemas[tag])) {
        if (!_.isUndefined(fn) && !_.isNull(fn) && _.isFunction(fn)) {
            // fn(schema.define(tag, model));
            fn(schemas[tag] = model);
        } else {
            // fn(schema.define(tag, model));
            schemas[tag] = model;
        }
    } else {
        if (!_.isUndefined(fn) && !_.isNull(fn) && _.isFunction(fn)) {
            // fn(schema.define(tag, model));            
            fn(schemas[tag] = model);
        } else {
            // fn(schema.define(tag, model));            
            schemas[tag] = model;
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
    delete schemas[tag];
    if (!_.isUndefined(fn) && !_.isNull(fn) && _.isFunction(fn)) {
        fn(true);
    }
    this.emit('remove', deleted);
    return true;
};


/**
 * Gets the non-inflated schema object, which is the object prior to being
 * turned into a data model.
 **/
SchemaRegistry.prototype.getSchema = function(tag, fn) {
    if (_.isUndefined(schemas[tag]) || _.isNull(schemas[tag])) {
        return null;
    }
    if (!_.isUndefined(fn) && !_.isNull(fn) && _.isFunction(fn)) {
        fn(schemas[tag]);
        return schemas[tag];
    } else {
        return schemas[tag];
    }
};

/** 
 * Get the specified model from the underly schema store. Returns null if no
 * schema with the specified tag exists.  This is different from getting a
 * non-inflated schema.
 * @param tag the tag name of the schema.
 * @fn a callback function that will contain the returned schema, fn(schema);
 **/
SchemaRegistry.prototype.getModel = function(tag, fn) {
    if (_.isUndefined(schema.models[tag]) || _.isNull(schema.models[tag])) {
        return null;
    }
    if (!_.isUndefined(fn) && !_.isNull(fn) && _.isFunction(fn)) {
        fn(schema.models[tag]);
        return schema.models[tag];
    } else {
        return schema.models[tag];
    }
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

/** 
 * Turns the schema of the specified type with the backing data management
 * layer.  This is currently hard coded as jugglingdb but could change later.
 * This is only run once in an application lifecycle.
 **/
SchemaRegistry.prototype.register = function(fn) {
    if (alreadyRegistered) {
        fn("already registered");
        return;
    }
    _.each(schemas, function(value, tag, list) {
        _.each(_.omit(schemas[tag], ["methods", "validators", "relations"]), function(value, field, list) {
            // Fields.
            try {
                schema.define(tag, list);
            } catch (e) {
                logger.log('error', e.stack);
                throw e;
            }
            
        });
        if (!_.isUndefined(schemas[tag].methods) && !_.isNull(schemas[tag].methods)) {
            _.each(schemas[tag].methods, function(value, field, list) {
                schema.models[tag].prototype[field] = value;
            });            
        }
        if (!_.isUndefined(schemas[tag].validators) && !_.isNull(schemas[tag].validators)) {
            _.each(schemas[tag].validations, function(validationArgs, validationName, list) {
                // schema.models[tag][validationFunctionName]();
            });
        }
        if (!_.isUndefined(schemas[tag].relations) && !_.isNull(schemas[tag].relations)) {        
            _.each(schemas[tag].relations, function(value, field, list) {
                // _.each(value, function(relationship, name, list) {
                    
                //     // schemas[tag][field](name, relationship); 
                // });
                // schemas[tag][field]()
            });
        }
        // console.log(key + " : " + JSON.stringify(value)); 
    });
    
    // var schemaIndex = 0;
    // _.each(schemas, function(thisSchema, tag, list) {
    //     // We omit the methods first, then add them afterward.
    //     var fieldIndex = 0;
    //     _.each(_.omit(thisSchema, 'methods'), function(fieldValue, fieldName, list) {
    //         console.log("Schema fieldValue = " + fieldValue);
    //         console.log("Schema FieldName = " + fieldName);
    //         schema.define(tag, {fieldName: fieldValue});
    //         if (fieldIndex >= _.size(list) - 1) {
    //             var methodIndex = 0;
    //             _.each(_.pick(thisSchema, 'methods'), function(fieldValue, fieldName, list) {
                    
    //             });
    //         } else {
    //             fieldIndex++;
    //         }
    //     });
    //     // First, we'll loop through all of the properties and add them to 
    //     // the model through a schema.define.  Then, we'll 
    //     if (key !== 'methods') {
    //         schema.define(key, element);
    //     }
    // });
};

SchemaRegistry.prototype.__proto__ = EventEmitter.prototype;

module.exports = SchemaRegistry;