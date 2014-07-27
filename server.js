var fs = Npm.require('fs'),
      path = Npm.require('path'),
      async = Npm.require('async'),
      UglifyJS = Npm.require('uglify-js'),
      watch = Npm.require('watch'),
      appPath = process.env.PWD,

      // Data Structure
      cordovaFiles = {
        core: {},
        plugin: {}
      },
      compiledFiles = {};

CordovaLoader = {

  /*
    Set up the package and determine if the assets need compiled
  */
  init: function () {
    _this = this;

		// handle relative Cordova Project Paths
		if (appPath && CordovaLoader._settings.cordovaProjectPath)
			CordovaLoader._settings.cordovaProjectPath = path.resolve(appPath, CordovaLoader._settings.cordovaProjectPath);

    Logger.addLogType('cordova', 'yellow');

    if (!CordovaLoader._settings.logging) {
      Logger.disableLog('cordova');
    }

    Logger.log('cordova', 'Starting Cordova Asset Compiler...');
    Logger.log('cordova', 'Enabled CordovaLoader._settings.platforms: ', CordovaLoader._settings.platforms.join(', '));
    
    if (CordovaLoader._settings.platforms.length) {

      CordovaLoader._settings.platforms.forEach(function (platform) {
        cordovaFiles.plugin[platform] = [];
        cordovaFiles.core[platform] = [];
      });

      if (process.env.NODE_ENV === "development" && CordovaLoader._settings.cordovaProjectPath) {
        Logger.log('cordova', 'Cordova Project Path:', CordovaLoader._settings.cordovaProjectPath);
        Logger.log('cordova', 'cordova-loader started in development mode');

        async.series([
          _this.addCoreFiles,
          _this.addPluginFiles,
          _this.packFiles,
          _this.serve
        ]);
			} else {
				Logger.log('cordova', 'cordova-loader started in production mode.');

				async.series([
					_this.loadPackedFiles,
					_this.serve
				]);
			}
    }
  },

  /*
    Watch the cordova plugins directory for changes and trigger a recompile
  */
  watch: function () {
    watch.watchTree(CordovaLoader._settings.cordovaProjectPath + '/plugins', {ignoreDotFiles: true}, function (f, curr, prev) {
      if (typeof f == "object" && prev === null && curr === null) {
        // Finished walking the tree
      } else {
        if (compiledFiles[CordovaLoader._settings.platforms[0]]) {
          console.log("recompile");
        }             
      }
    });

    Logger.log('cordova', 'Watching Cordova project plugin directory for changes..');
  },

  /*
    Serve the compiled files on /cordova.js
  */
  serve: function () {
    WebApp.connectHandlers.use(function(req, res, next) {
      var platform, response;

      if (req.url.split('/')[1] !== "cordova.js" || req.method !== "GET") {
        next();
        return;
      }

      if (/iPhone|iPad|iPod/i.test(req.headers["user-agent"])) {
        platform = "ios";
      } else if (/Android/i.test(req.headers["user-agent"])){
        platform = "android";
      } else if (/BlackBerry/i.test(req.headers["user-agent"])){
        platform = "blackberry";
      } else if (/IEMobile/i.test(req.headers["user-agent"])){
        platform = "windows";
      }

      if (_.indexOf(CordovaLoader._settings.platforms, platform) == -1) {
        response = "// Browser not supported";
      } else {
        response = compiledFiles[platform];
        Logger.log('cordova', 'Serving the cordova.js file to platform', platform);
      }

      res.statusCode = 200;
      res.setHeader("Content-Length", Buffer.byteLength(response, "utf8"));
      res.setHeader("Content-Type", "text/javascript");
      res.write(response);
      res.end();
    });
  },

  /*
    Load the previous version of the packed cordova files
  */
  loadPackedFiles: function (callback) {
    CordovaLoader._settings.platforms.forEach(function (platform) {
      var pack = [],
            concatFile = '';

      fs.readFile(appPath + '/private/cordova/' + platform + '.js', 'utf8', function (err, data) {
        if (err)
          Logger.log('error', 'error while reading file '+pluginJsFilePath);
        else {
          Logger.log('cordova', 'Loaded compiled file into memory', platform);
          compiledFiles[platform] = data;
        }
      });      
    });

    callback(null, 'done');
  },

  /*
    Concat and minify the platform specific bundles
  */
  packFiles: function (callback) {
    // console.log(cordovaFiles);

    CordovaLoader._settings.platforms.forEach(function (platform) {
      var pack = [],
            concatFile = '';

      pack = pack.concat(cordovaFiles.core[platform]);
      pack = pack.concat(cordovaFiles.plugin[platform]);

      compiledFiles[platform] = UglifyJS.minify(pack, {}).code;

      fs.mkdir(appPath + "/private",function(e){
        if(!e || (e && e.code === 'EEXIST')){
            
        } else {
            console.log(e);
        }
      });

      fs.mkdir(appPath + '/private/cordova',function(e){
        if(!e || (e && e.code === 'EEXIST')){
            
        } else {
            console.log(e);
        }
      });

      fs.writeFile(appPath + '/private/cordova/' + platform + '.js', compiledFiles[platform], function(err) {
          if(err) {
              console.log(err);
          } else {
              Logger.log('cordova', 'Saved packed Cordova file for production use.', '/private/cordova/' + platform + '.js');
          }
      }); 
    });

    callback(null, 'done');
  },


  /*
    Add the platform's core cordova files to the list to be packed
  */
  addCoreFiles: function (callback) {
    CordovaLoader._settings.platforms.forEach(function (platform) {

      var path = "";
      if (platform == "ios") {
        path = "/www/";
      } else if (platform == "android") {
        path = "/assets/www/"
      }

      location = CordovaLoader._settings.cordovaProjectPath + '/platforms/' + platform + path + 'cordova.js';
      cordovaFiles.core[platform].push(location);
      Logger.log('cordova', 'Adding ' + platform + ' Cordova file', location);

      location = CordovaLoader._settings.cordovaProjectPath + '/platforms/' + platform + path + 'cordova_plugins.js';
      cordovaFiles.core[platform].push(location);
      Logger.log('cordova', 'Adding ' + platform + ' Cordova file', location);
    });

    callback(null, 'done');
  },

  /*
    Add the platform's plugin cordova files to the list to be packed
  */
  addPluginFiles: function (callback) {

    async.each(CordovaLoader._settings.platforms, function (platform, callback) {

      var path = "";
      if (platform == "ios") {
        path = "/www/";
      } else if (platform == "android") {
        path = "/assets/www/"
      }

      var pluginJsFilePath = CordovaLoader._settings.cordovaProjectPath + '/platforms/' + platform + path + 'cordova_plugins.js';
      fs.readFile(pluginJsFilePath, 'utf8', function (err, data) {
        if (err)
          Logger.log('error', 'error while reading file '+pluginJsFilePath);
        plugins = data.substring(data.indexOf('module.exports'), data.indexOf('module.exports.meta')).replace('module.exports = ', '').replace(';', '');
        plugins = JSON.parse(plugins);

        plugins.forEach(function (plugin) {
          location = CordovaLoader._settings.cordovaProjectPath + '/platforms/' + platform + path + plugin.file;

          cordovaFiles.plugin[platform].push(location);
          Logger.log('cordova', 'Adding ' + platform + ' plugin file', location);
        });

        callback(null, 'done');

      });

    }, function () {
      callback(null, 'done');
    });

  },

	settings: function(settings){
		_.extend(_settings,settings);
	},

  _settings:{
  	cordovaProjectPath:null,
  	platforms:[],
  	logging:false
	}
}

