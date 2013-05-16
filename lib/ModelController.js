/**
 * ModelController is a base class for other model controllers.  Model controllers
 * are classes that handle the render and CRUD logic of a model.
 * It contains 8 methods that can be used directly as a convenience or
 * overridden, essentially a way of scaffolding without generating unnecessary
 * code.
 * @author John O'Connor
 * @copyright 2013 John O'Connor
 * @license MPL
 **/

var logger = require('ghiraldi-simple-logger'),
    plugins = require('ghiraldi-plugin-registry').registry,
    util = require('util'),
    _ = require('underscore');

/**
 * Constructor creates a modelController with the 8 basic methods:
 * index: Render an view showing all of the objects of this type
 * show: Render a view showing the fields of one object of this type.
 * add: Render a view that allows the user to add an object.
 * edit: Render a view that allows the user to edit an object.
 * create: Creates an object with the passed-in parameters.
 * update: Modifies / edits an object with the passed-in parameters.
 * destroy: Destroy's an object with the specified id.
 * get: Gets an item with the specified id.
 * 
 * The options object defines the redirect and other basics for each
 * method and has the following format:
 * {
 *      create: {
 *          // create options go here.
 *          redirect: '<url goes here>'
 *      }, 
 *      update: {
 *          // update options go here.
 *      },
 *      etc...
 * }
 * @param model the model type for this ModelController.
 * @param plugin the plugin for this view, or blank for the base 'app'
 **/
function ModelController(model, options, plugin) {
    this.model = model;
    this.pluginName = 'app';
    if (!_.isUndefined(plugin) && !_.isNull(plugin)) {
        this.pluginName = plugin;
    }
    this.plugin = plugins.get(plugin);
    this.options = options || {};
    
    var that = this;
    this.index = function(req, res, next) {
        var indexParams = that.options.index || {};
        that.model.all(function(err, objects) {
            if (err) {
                next(err);
            } else {
                _.extend(indexParams, {objects: objects});
                logger.log('trace', util.inspect(indexParams));
                that.plugin.render('index', indexParams, function(err, html) {
                    if (!err) {
                        res.send(html);
                    } else {
                        res.send('error: ' + err);
                    }
                });
            }
        });
    };
    this.add = function(req, res, next) {
        var addParams = that.options.add || {};
        that.plugin.render('add', addParams, function(err, html) {
            if (err) {
                logger.log('error', err);
                res.send(err);
            } else {
                logger.log('trace', html);
                res.send(html);            
            }
        });
    };
    this.show = function(req, res, next){
        var showParams = that.options.show ||  {};
        that.model.find(req.params.id, function(err, object){
            if (err) return next(err);
            _.extend(showParams, {object: object});
            that.plugin.render('show', showParams, function(err, html) {
                if (!err) {
                    res.send(html);
                } else {
                    res.send(err);
                }
            });
        });
    };
    this.edit = function(req, res, next){
        var editParams = that.options.edit || {};
        that.model.find(req.params.id, function(err, object) {
            if (err) {
                return res.send(err);
            }
            _.extend(editParams, {object: object});
            that.plugin.render('edit', editParams, function(err, html) {
                if (!err) {
                    res.send(html);
                } else {
                    res.send(err);
                }
            });
        });
    };
    this.update = function(req, res, next){
        var thisObject = req.body.object;
        var id = req.params.id;
        var updateParams = that.options.update || {};
        that.model.find(id, function(err, object) {
            if (err) {
                req.session.messages = {'error': 'Unable to update: ' + err};
                return next(err);
            }
            _.extend(object, thisObject);
            that.model.save(object, function(error) {
                if (!error) {
                    req.flash('success', 'Successfully updated ' + object.id);
                    res.redirect('back');
                } else {
                    req.flash('error', 'Unable to update: ' + error);
                    res.redirect('back');
                }
            });
        }
        );
    };
    this.create = function(req, res, next) {
        var createOptions = that.options.create || 
            {
                redirect: 'back'
            };
        var thisObject = req.body.object;
        that.model.create(thisObject, function(err, object) {
            if (!err) {
                req.session.messages = {'success': 'Successfully created new  ' + that.model + ': ' + object.id};
            } else {
                req.session.messages = {'error': 'Unable to create: ' + err};
            }
            res.redirect(createOptions.redirect);
        });
    }; 

    this.destroy = function(req, res, next) {
        var id = req.params.id;
        that.model.find(id, function(err, object) {
            if (err) return next(err);
            var deleted = object;
            object.destroy(function(err) {
                if (!err) {
                    req.session.messages = {'success': 'Successfully deleted  ' + deleted};
                    res.redirect('back');
                }
            });
        });
    };
};

module.exports = ModelController;