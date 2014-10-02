App = Ember.Application.create();

App.Router.map(function() {
    this.resource("archway", {
        path: "/"
    });
});

App.IndexRoute = Ember.Route.extend({
    model: function() {
        return this.store.find("scene", 1);
    }
});

App.ArchwayController = Ember.Controller.extend({
    version: .1,
    actions: {
        loadModel3d: function() {},
        loadOPCLayout: function() {}
    },
    loadModel: function() {},
    loadLayout: function() {}
});

App.ArchwayView = Ember.View.extend({
    templateName: "archway",
    classNames: [ "site-wrapper" ]
});

App.SceneView = Ember.View.extend({
    templateName: "scene"
});