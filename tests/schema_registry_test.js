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
            });
        });
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
                    };
                    registry.add('t', t, function(success) {
                        registry.getSchema('t', function(t2) {
                            console.log(t2);
                            test.ok(t2.testMethod(), "Test method should return true.");
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
        console.log("Test remove");
        var registry = new SchemaRegistry('memory');
        var testSchema = {
            title: String,
            test: String
        };
        registry.add('t', testSchema, function(success) {
            registry.add('t2', testSchema, function(success) {
                registry.remove('t', function(success) {
                    // test.ok(_.size(registry.schemas) == 1, 'Should have removed the schema from the registry');
                    console.log("schema names = " + JSON.stringify(registry.getSchemaNames()));
                    test.ok(_.size(registry.getSchemaNames()) == 1, 'Should have removed the schema from the registry');
                    registry.log(function(schemas) {
                        console.log(JSON.stringify(schemas));
                        test.done();
                    });
                });
            });
        });
    }
});