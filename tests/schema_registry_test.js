var nodeunit = require('nodeunit'),
    SchemaRegistry = require('../lib/schema_registry');

exports.registryTest = nodeunit.testCase({
    'testConstructor': function(test) {
        var registry = new SchemaRegistry('memory');
        test.done();
    },
    'testAdd': function(test) {
        var registry = new SchemaRegistry('memory');
        var testSchema = registry.getSchema('t');
        testSchema.extendModel('t', {
            title: String,
            test: String
        });
        registry.add('t', testSchema, function(success) {
            test.ok(success, "Registration adding should've succceeded");
            registry.log(function(schemas) {
                console.log(JSON.stringify(schemas));
                test.done();                
            })
        })
    },
    'testRemove': function(test) {
        var registry = new SchemaRegistry('memory');
        var testSchema = registry.getSchema('t');
        testSchema.extendModel('t', {
            title: String,
            test: String
        });
        registry.add('t', testSchema, function(success) {
            registry.remove('t', function(success) {
                test.ok(success, 'Should have removed the schema from the registry');
                registry.log(function(schemas) {
                    console.log(JSON.stringify(schemas));
                    test.done();
                });
            });
        });
    },
    'testKeys': function(test) {
        var registry = new SchemaRegistry('memory');
        var t1 = registry.getSchema('t1');
        t1.extendModel('t1', {
        });
        var t2 = registry.getSchema('t2');
        t2.extendModel('t2', {});
        
        var t3 = registry.getSchema('t3');
        t3.extendModel('t3', {});
        
        registry.add('t1', t1, function(success) {
            registry.add('t2', t2, function(success) {
                registry.add('t3', t3, function(success) {
                    registry.getKeys(function(keys) {
                        var testArray = ['t1', 't2', 't3'];
                        test.deepEqual(testArray, keys);
                        test.done();
                    })
                })
            })
        })
    }
});