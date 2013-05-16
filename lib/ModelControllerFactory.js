/**
 * Creates ModelControllers.
 **/
 
var util = require('util'),
    ModelController = require('./ModelController'),
    logger = require('ghiraldi-simple-logger');
    
var ModelControllerFactory = function() {
};

ModelControllerFactory.prototype.createModelController = function(model, options, pluginName) {
    return new ModelController(model, options, pluginName);
};

module.exports = new ModelControllerFactory();