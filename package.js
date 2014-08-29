Package.describe({
    summary: 'Cordova asset compiler and loader',
    name:"lepozepo:cordova_loader",
    version:"1.0.0",
    git:"https://github.com/Lepozepo/meteor-cordova-loader"
});

Npm.depends({
  'async': '0.9.0',
  'uglify-js': '2.4.14',
  'watch': '0.10.0',
  "mkdirp": "0.5.0",
  "glob": "4.0.4"
});

Package.on_use(function (api) {
    api.use([
      'log@1.0.0',
      'webapp@1.0.0'
    ], 'server');

    api.add_files('server.js', 'server');

    api.add_files('client.js', 'client');

		//Export CordovaLoader
		api.export && api.export("CordovaLoader","server");
});