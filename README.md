Cordova Asset Compiler & Loader
================

## Introduction

Cordova Loader's goal is to make using Meteor with Cordova as easy as using Meteor itself. The compiler interprets the provided Cordova project directory and compiles the assets into minified, platform-specific JavaScript which is stored in memory. When the client loads, it automatically pulls in the platform-specific cordova code for that device. The Cordova API can be used from Meteor the same as it is from vanilla JS apps. Enjoy!

![demo](http://cl.ly/image/29231q3f0N46/Image%202014-06-30%20at%2010.40.07%20AM.png)

This package aims to solve the shortcomings of the other meteor + cordova packages. 

*Note: Currently only tested with iOS. Will test the other platforms asap.*


## Installation / Setup

##### Requirements
* Xcode: 5.1.1
* [Cordova: 3.5](http://cordova.apache.org/)

================

##### Package Installation
````
mrt add cordova-loader
````
*Note: I would also suggest adding the [appcache-extra](http://github.com/andrewreedy/meteor-appcache-extra) package. It will cache the cordova/platform file after it is loaded once and gives you a way to handle appcache reloads with better UX.*

================

##### GETTING STARTED (iOS)
#### Step 1: Create a Cordova project in your meteor project (so where you run mrt you run this)
````
cordova create .project_name
````
*Note: Start the name of your project with a dot (".") so that meteor ignores it


#### Step 2: Modify config.xml
Open .project_name/config.xml and adjust settings to what you want them to be. This is where you change the apps name, description, etc. You absolutely must have this:
````
cordova create .project_name
````
	<content src="" />
	<access origin="*" />
````

#### Step 3: Add platforms and build
````
cd .project_name
cordova platform add ios
cordova build
````


#### Step 4: Point the app to your server
Go to /.project_name/platforms/ios/Project.xcodeproject and open it in xcode
In xcode, open: CordovaLib.xcodeproj/Classes/Cleaver/CDVViewController.m

Around line 210, modify self.wwwFolderName to point to your server and self.startPage to an empty string like this:
````
	//For local testing on a mac
    self.wwwFolderName = @"http://mycomputername.local:3000";
    self.startPage = delegate.startPage;
    if (self.startPage == nil) {
        self.startPage = @"";
    }
````

#### Step 5: Set up meteor and initialize the loader. SERVER SIDE
````
CordovaLoader.settings = {
		cordovaProjectPath: ".project_name",
		platforms: ["ios"],
		logging: true
}

CordovaLoader.init()
````
*Note: cordovaProjectPath can be relative or absolute. A relative path starts without a slash (ex: "folder/inside/meteor"), an absolute path starts with a slash (ex: "/folder/outside/meteor")




*Note: the compiler will only run once due to live reload loop. If you want to rerun the compiler after adding a plugin just delete any of the public/cordova/ files.*

================

#### Comparison of Meteor + Cordova methods/packages
* [Meteor + Cordova Methods](https://github.com/andrewreedy/meteor-cordova-loader/wiki/Meteor---Cordova-Methods) - Pros / Cons to the different packages / ways of combining meteor with Cordova.

#### Cordova Setup Guide
* [Cordova Setup Guide](https://github.com/andrewreedy/meteor-cordova-loader/wiki/Cordova-Setup) - Instructions on how to setup the basic Cordova project needed to get started. (coming soon).

#### Recommended Cordova Plugins
* [Cordova Plugin Guide](https://github.com/andrewreedy/meteor-cordova-loader/wiki/Cordova-Plugins) - Plugins necessary to make the Meteor app feel native. Also, an overview of optional plugins like setting up push notificaitons and geolocation.

#### Platform Setup Guides
* [iOS Setup Guide](https://github.com/andrewreedy/meteor-cordova-loader/wiki/iOS-Setup) - Detailed walkthrough of steps to setup the iOS Cordova project.
* [Android Setup Guide](https://github.com/andrewreedy/meteor-cordova-loader/wiki/Anroid-Setup) - Detailed walkthrough of steps to setup Android Cordova project. (coming soon).

#### Facebook Native SDK
* [accounts-facebook-cordova](https://github.com/andrewreedy/meteor-accounts-facebook-cordova) - Works with the cordova plugin to use facebook single sign on when it exists otherwise use standar oauth package.

#### Famo.us Integration
* [celestial](https://github.com/andrewreedy/meteor-celestial) - Package to make using Famo.us with Meteor easier.

#### Example Apps
* [Meteor Cordova Todo](https://github.com/andrewreedy/meteor-cordova-todo) - Just started working on this. This will eventually be a working app as an example.

================

If you want more features than this provides, file an issue. Feature requests/contributions are welcome.
