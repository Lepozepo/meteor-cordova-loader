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
		if (appPath && CordovaLoader.settings.cordovaProjectPath)
			CordovaLoader.settings.cordovaProjectPath = path.resolve(appPath, CordovaLoader.settings.cordovaProjectPath);

    Logger.addLogType('cordova', 'yellow');

    if (!CordovaLoader.settings.logging) {
      Logger.disableLog('cordova');
    }

    Logger.log('cordova', 'Starting Cordova Asset Compiler...');
    Logger.log('cordova', 'Enabled CordovaLoader.settings.platforms: ', CordovaLoader.settings.platforms.join(', '));
    
    if (CordovaLoader.settings.platforms.length) {

      CordovaLoader.settings.platforms.forEach(function (platform) {
        cordovaFiles.plugin[platform] = [];
        cordovaFiles.core[platform] = [];
      });

      if (process.env.NODE_ENV == "development" && CordovaLoader.settings.cordovaProjectPath) {
        Logger.log('cordova', 'Cordova Project Path:', CordovaLoader.settings.cordovaProjectPath);
        Logger.log('cordova', 'cordova-loader started in development mode');

        async.series([
          _this.addCoreFiles,
          _this.addPluginFiles,
          _this.packFiles
        ]);
			}
    }
  },

  /*
    Watch the cordova plugins directory for changes and trigger a recompile
  */
  watch: function () {
    watch.watchTree(CordovaLoader.settings.cordovaProjectPath + '/plugins', {ignoreDotFiles: true}, function (f, curr, prev) {
      if (typeof f == "object" && prev === null && curr === null) {
        // Finished walking the tree
      } else {
        if (compiledFiles[CordovaLoader.settings.platforms[0]]) {
          console.log("recompile");
        }             
      }
    });

    Logger.log('cordova', 'Watching Cordova project plugin directory for changes..');
  },

  /*
    Concat and minify the platform specific bundles
  */
  packFiles: function (callback) {
    // console.log(cordovaFiles);

    CordovaLoader.settings.platforms.forEach(function (platform) {
      var pack = [],
            concatFile = '';

      pack = pack.concat(cordovaFiles.core[platform]);
      pack = pack.concat(cordovaFiles.plugin[platform]);

      compiledFiles[platform] = UglifyJS.minify(pack, {}).code;

      fs.mkdir(appPath + CordovaLoader.settings.compiledFilesPath,function(e){
        if(!e || (e && e.code === 'EEXIST')){
            
        } else {
            console.log(e);
        }
      });

      fs.mkdir(appPath + CordovaLoader.settings.compiledFilesPath + '/cordova',function(e){
        if(!e || (e && e.code === 'EEXIST')){
            
        } else {
            console.log(e);
        }
      });

      fs.writeFile(appPath + CordovaLoader.settings.compiledFilesPath + '/cordova/' + platform + '.js', compiledFiles[platform], function(err) {
          if(err) {
              console.log(err);
          } else {
              Logger.log('cordova', 'Saved packed Cordova file for production use.', CordovaLoader.settings.compiledFilesPath + '/cordova/' + platform + '.js');
          }
      }); 
    });

    callback(null, 'done');
  },


  /*
    Add the platform's core cordova files to the list to be packed
  */
  addCoreFiles: function (callback) {
    CordovaLoader.settings.platforms.forEach(function (platform) {

      var path = "";
      if (platform == "ios") {
        path = "/www/";
      } else if (platform == "android") {
        path = "/assets/www/"
      }

      location = CordovaLoader.settings.cordovaProjectPath + '/platforms/' + platform + path + 'cordova.js';
      cordovaFiles.core[platform].push(location);
      Logger.log('cordova', 'Adding ' + platform + ' Cordova file', location);

      location = CordovaLoader.settings.cordovaProjectPath + '/platforms/' + platform + path + 'cordova_plugins.js';
      cordovaFiles.core[platform].push(location);
      Logger.log('cordova', 'Adding ' + platform + ' Cordova file', location);
    });

    callback(null, 'done');
  },

  /*
    Add the platform's plugin cordova files to the list to be packed
  */
  addPluginFiles: function (callback) {

    async.each(CordovaLoader.settings.platforms, function (platform, callback) {

      var path = "";
      if (platform == "ios") {
        path = "/www/";
      } else if (platform == "android") {
        path = "/assets/www/"
      }

      var pluginJsFilePath = CordovaLoader.settings.cordovaProjectPath + '/platforms/' + platform + path + 'cordova_plugins.js';
      fs.readFile(pluginJsFilePath, 'utf8', function (err, data) {
        if (err)
          Logger.log('error', 'error while reading file '+pluginJsFilePath);
        plugins = data.substring(data.indexOf('module.exports'), data.indexOf('module.exports.meta')).replace('module.exports = ', '').replace(';', '');
        plugins = JSON.parse(plugins);

        plugins.forEach(function (plugin) {
          location = CordovaLoader.settings.cordovaProjectPath + '/platforms/' + platform + path + plugin.file;

          cordovaFiles.plugin[platform].push(location);
          Logger.log('cordova', 'Adding ' + platform + ' plugin file', location);
        });

        callback(null, 'done');

      });

    }, function () {
      callback(null, 'done');
    });

  },

  settings:{
  	cordovaProjectPath:null,
  	platforms:[],
  	logging:false,
  	compiledFilesPath:"/client"
	}
}

