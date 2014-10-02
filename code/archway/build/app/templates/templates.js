Ember.TEMPLATES["archway"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  var buffer = '', stack1, escapeExpression=this.escapeExpression;


  data.buffer.push("\n	<div class=\"site-wrapper-inner\">\n		<div class=\"cover-container\">\n\n			<header class=\"masthead clearfix\">\n				<div class=\"inner\">\n					<h3 class=\"masthead-brand\">Archway v");
  stack1 = helpers._triageMustache.call(depth0, "version", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["ID"],data:data});
  if(stack1 || stack1 === 0) { data.buffer.push(stack1); }
  data.buffer.push("</h3>\n					<ul class=\"nav masthead-nav\">\n						<li><a class=\"button\" ");
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "loadModel3d", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
  data.buffer.push(">Load Model</a></li>\n						<li><a class=\"button\" ");
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "loadOPCLayout", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
  data.buffer.push(">Load OPC Layout</a></li>\n						<li><a href=\"#\">Options</a></li>\n						<li><a href=\"#\">About</a></li>\n					</ul>\n				</div>\n			</header>\n\n			<div class=\"inner cover\">\n				<div id=\"scene-container\">\n		\n				</div>\n	\n				<p class=\"lead\">Archway will display your OPC layout and a model. Get started:</p>\n				<p class=\"lead\">\n					<a ");
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "loadModel3d", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
  data.buffer.push(">Load Model</a> | \n					<a ");
  data.buffer.push(escapeExpression(helpers.action.call(depth0, "loadOPCLayout", {hash:{},hashTypes:{},hashContexts:{},contexts:[depth0],types:["STRING"],data:data})));
  data.buffer.push(">Load OPC Layout</a>\n				</p>\n			</div>\n\n			<footer class=\"mastfoot\">\n				<div class=\"inner\">\n					<!--\n					<p>Cover template for <a href=\"http://getbootstrap.com\">Bootstrap</a>, by <a href=\"https://twitter.com/mdo\">@mdo</a>.</p>\n					-->\n				</div>\n			</footer>\n\n\n		</div>\n	</div>\n");
  return buffer;
  
});

Ember.TEMPLATES["scene"] = Ember.Handlebars.template(function anonymous(Handlebars,depth0,helpers,partials,data) {
this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Ember.Handlebars.helpers); data = data || {};
  


  data.buffer.push("<div class=\"scene-view\"></div>");
  
});