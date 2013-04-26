var nodeunit = require('nodeunit'),
    SchemaRegistry = require('../lib/schema_registry'),
    _ = require('underscore');
    
exports.registryTest = nodeunit.testCase({
    'testConstructor': function(test) {
        var registry = new SchemaRegistry('memory');
        test.done();
    },
    'testAdd': function(test) {
        var registry = new SchemaRegistry('memory');
        var testSchema = {
            title: String,
            test: String
        };
        registry.add('t', testSchema, function(success) {
            test.ok(success, "Registration adding should've succceeded");
            registry.log(function(schemas) {
                console.log(JSON.stringify(schemas));
                test.done();                
            })
        })
    },
    'testGetAndModify': function(test) {
        var registry = new SchemaRegistry('memory');
        var testSchema = {
            title: String,
            test: String
        };
        registry.add('t', testSchema, function(model) {
            registry.getSchema('t', function(t) {
                if (!_.isNull(t) && !_.isUndefined(t)) {
                    t.testMethod = function() {
                        return true;
                    }
                    registry.add('t', t, function(success) {
                        registry.getSchema('t', function(t2) {
                            console.log(t2);
                            test.ok(t2.testMethod(), "Test method should return true.")
                            test.done();
                        });
                    });
                } else {
                    test.ok(false, "Schema should not have been null.");
                }
            });
        });
        test.done();
    },
    'testRemove': function(test) {
        var registry = new SchemaRegistry('memory');
        var testSchema = {
            title: String,
            test: String
        };
        registry.add('t', testSchema, function(success) {
            registry.add('t2', testSchema, function(success) {
                registry.remove('t', function(success) {
                    test.ok(_.size(registry.schemas) == 1, 'Should have removed the schema from the registry');
                    registry.log(function(schemas) {
                        console.log(JSON.stringify(schemas));
                        test.done();
                    });
                });
            })
        });
    },
    'testKeys': function(test) {
        var registry = new SchemaRegistry('memory');
        var t1 = {
            title: String,
            test: String
        };
        var t2 = {
            title: String,
            test: String
        };
        var t3 = {
            title: String,
            test: String
        };        
        registry.add('t1', t1, function(success) {
            registry.add('t2', t2, function(success) {
                registry.add('t3', t3, function(success) {
                    registry.getSchemaNames(function(keys) {
                        var testArray = ['t1', 't2', 't3'];
                        test.deepEqual(testArray, keys);
                        test.done();
                    })
                })
            })
        })
    }
});