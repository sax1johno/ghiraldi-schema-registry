ghiraldi-schema-registry
========================

This allows users to register model schemas using generic JugglingDB schemas.
Schemas can be extended through plugins and can utilize any database storage 
engine supported by JugglingDB.

# Creating a new schema registry
To create a new schema registry, create a new instance of the schema registry
with the adapter parameters that will be passed to the underlying JugglingDB
schema.

    var registry = new require('ghiraldi-schema-registry')('memory');
    
    var testSchema = {
        title: String,
        test: String
    };
    
    registry.add('testName', testSchema, function(success) {
        if (success) {
            // The registry item was added succesfully.
        }
    });
    
Schema registry is a singleton, so subsequent calls to the schema registry
will return the original object.  This is useful for retrieving the database
models from the registry once they're registered.

    var testModel = registry.getModel('testName'); // retrive the model from the registry.

# Defining Schemas.
Schema fields are defined as attributes on an object (using the standard
JugglingDB syntax to defined the data types):

    var sampleSchema = {
        field: String,
        field: {type: String},
        etc...
    }

Model files should export their schemas in the following format:
    {
        schemaName: sampleSchema
    }

## Schema methods.
Additionally, methods can be added to a schema by adding a special reserved
property called "methods":

SampleSchema.methods = {};
    
    SampleSchema.methods.beforeSave = function() {
        ...
    }
    
    SampleSchema.methods.nonJugglingMethod = function() {
        ...
    };

Note that JugglingDB hooks are simply added as methods on the schema, and will
automatically work.

## Schema validators
validators are added in a special reserved property called "validators".   These
validators are just JugglingDB validators, and can be created the same way as
those validators are.

    SampleSchema.validators = {};
    
    SampleSchema.validators.validatesPresenceOf = ['name', 'email'];
    SampleSchema.validators.validatesLengthOf = ['password', {min: 5, message: {min: 'Password is too short'}}];

## Schema Relationships
Schema relations are defined in a special reserved property called "relations". 
These are just basic JugglingDB relationships, and are passed directly to the 
underlying JugglingDB schema.

    SampleSchema.relations = {};
    
    /** Set up relationship between role and user. **/
    SampleSchema.relations.hasMany = {
        SampleSchema2:   {
            as: 'schema2',  
            foreignKey: 'schema2Id'
        }
    };

## Augmenting previously created schemas.
Schemas in the schema registry are additive - you can add to a schema from any model
in any plugin.  This powerful feature of the ghiraldi schema registry allows
schemas to be developed incrementally.  For example, adding roles to a user could
look like the following:

    var Role = {
        title: String
    }

    var User = registry.getSchema('User');
    
    User.relations = {};
    
    /** Set up relationship between role and user. **/
    User.relations.hasMany = {
        Role:   {
            as: 'roles',  
            foreignKey: 'roleId'
        }
    };

## Putting it all together
The following is an example from a version of the ghiraldi-base-role plugin that
illustrates all of the concepts of the creating, modifying, and using schemas.

    // First, we create an instance of the schema registry. Since registry is a 
    // singleton, all instances of the registry will return the first one.
    var registry = new require('ghiraldi-schema-registry')(),
    
    // Create the role definition -- it follows the JugglingDB schema 
    // definition format, which is just a simple JSON object with a key
    // for the field name and type for the values.
    var Role = {
        title: String,
        created_at: {type: Date, default: Date.now()}
    }
    
    // This Role plugin also modifies the user schema, so we retrieve it from
    // the schema registry.
    var User = registry.getSchema('User');
    
    // Lets set up the relations object since we want to add relations to the user.
    // We add the initial check so we don't clobber previous relations.
    User.relations = User.relations || {};
    
    // We'll set up a hasMany relationship between roles and users.
    User.relations.hasMany = {
        Role:   {
            as: 'roles',  
            foreignKey: 'roleId'
        }
    };
    
    // Now we'll add some methods to the User schema.
    User.methods = User.methods || {};
    
    // This method will be called on the User model instance as user.hasRole(roleName) and 
    // will return true if the number of roles with the specified name is greater than 0.
    User.methods.hasRole = function(role) {
        return this.roles({roleTitle: role}) > 0 ;
    }
    
    // Just for fun, we'll add a presence validator to the role field as well 
    // just to make sure every user gets a role at some point.
    User.validators = User.validators || {};
    User.validators.validatesPresenceOf = User.validators.validatesPresenceOf || [];
    User.validators.validatesPresenceOf.push('roleId');
    
    // Finally, make sure to add ALL of the schemas you want to have reigstered to 
    // the module.exports of your model definition file.  If it's not added here,
    // the changes won't propagate throughout the system.
    // NOTE: The key is the name of the schema in the registry (case-sensitive) and
    // the value is the schema object.
    module.exports = {
        'Role': Role,
        'User': User
    };
    
# Registering models and getting a model from the registry.
Schemas are registered once during the lifetime of the schema registry after
all schema changes are made.  "Registering" a schema turns it into
a database model and connects it with the data store you specified when
creating the regsitry. Since this makes it persistent, registration is only done once you've
finished modifying the schema.

Registration is done with the SchemaRegistry.register(tagname) call.  For example, the following
would register the 'User' schema (which has been earlier defined).

    var registry = new require('ghiraldi-schema-registry')();
    
    registry.register('User');

# Getting a model from the schema registry.
Once the schemas are registered, they can be retrieved from the schema registry
using the SchemaRegistry.getModel(tag, fn) method.  The getModel method is
used to create instance of models that are backed by the database. Models are
directly mapped to JugglingDB schema models, so you can use any methods on a 
schema model that can be used on a JugglingDB model.

    var registry = new require('ghiraldi-schema-registry')();
    var Post = registry.getModel('Post');
    var User = registry.getModel('User');
    
    // work with models:
    var user = new User;
    user.save(function (err) {
        var post = user.posts.build({title: 'Hello world'});
        post.save(console.log);
    });
    
    // or just call it as function (with the same result):
    var user = User();
    user.save(...);

    // Common API methods
    
    var p = new Post()
    
    // save model (of course async)
    Post.create(cb);
    
    // get all posts
    Post.all(cb)
    
    // get all posts by user
    Post.all({where: {userId: user.id}, order: 'id', limit: 10, skip: 20});
    
    // the same as prev
    user.posts(cb)
    
    // get one latest post
    Post.findOne({where: {published: true}, order: 'date DESC'}, cb);
    
    // same as new Post({userId: user.id});
    user.posts.build
    
    // save as Post.create({userId: user.id}, cb);
    user.posts.create(cb)
    
    // find instance by id
    User.find(1, cb)
    // count instances
    User.count([conditions, ]cb)
    // destroy instance
    user.destroy(cb);
    // destroy all instances
    User.destroyAll(cb);

