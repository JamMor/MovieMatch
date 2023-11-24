
# Webpack

Commands to run configs are:
- ```npm run bundle-dev```
- ```npm run bundle-prod```
- ```npm run bundle-deploy```
- ```npm run bundle-purge```

This directory contains the Webpack configuration files for the Django project. It also contains a utility module for managing paths in a Django project, and a utility module for generating entry points for Webpack in a Django project.

### Files
#### Utilities:
- [webpack.djangoPaths.js](#webpackconfigutilsjs)
- [webpack.config.utils.js](#webpackconfigutilsjs)

#### Configs:
1. [webpack.config.js](#1-webpackconfigjs)
2. [webpack.dev.config.js](#2-webpackdevconfigjs)
3. [webpack.prod.config.js](#3-webpackprodconfigjs)
4. [webpack.deploy.config.js](#4-webpackdeployconfigjs)
5. [webpack.purge.config.js](#5-webpackpurgeconfigjs)
---

## ```webpack.djangopaths.js```
This file, `webpack.djangopaths.js`, is a utility module for a Webpack configuration in a Django project. It is designed to manage and organize the paths related to the Django project and its static and template files.

The utility provides several functions and constants to handle file paths and directories, making it easier to configure Webpack in a Django project.

### Key Functions and Constants
These constants should be set on a per project basis:
- `projectBaseDirectory`: This constant holds the base directory of the Django project (where settings, wsgi.py, asgi.py, etc. are typically found) that may contain project wide static files.

- `installed_apps`: This array holds the names of the Django apps to bundle.

- `vendorStaticDirs`: This object holds the paths to the vendor CSS and JS directories, assuming they exist in a 'vendor' directory within the static directory of the project base directory.

These functions and constants should not need changing given a similar project directory structure:
- `outputToWebpackDir(filename)`: This function takes a filename and returns the output path for the given filename in the webpack directory.

- `projectRoot`: This constant holds the root directory of the project.

- `staticPath(staticContainer)`: This function takes a static container name and returns the path to the static directory for that container.

- `templatesPath(staticContainer)`: This function takes a static container name and returns the path to the templates directory for that container.

- `getAllStaticDirectories()`: This function returns an array of all static directories for the Django project.

- `getAllTemplateDirectories()`: This function returns an array of all template directories for the Django project.

These constants are for mapping JS import statements that use the file's static url to their absolute path for importing and bundling. In this project this is only needed for this shared JS directory.
- `sharedJsDir` and `sharedJsUrl`: These constants hold the directory path and URL for shared JavaScript modules.

### Usage
This utility is used to set and manage paths in a single location for use in webpack configs.

Set the installed_apps array to any apps to be bundled, and the projectBaseDirectory if it contains any static files. The utility assumes that all static files and templates are in a 'static' and 'templates' directory within the app (or project base) directory like a typical Django project as outlined in their documentation.

## ```webpack.config.utils.js```
Given a Django project with many templates that extend one another and each potentially having their own JS and CSS files for their function, a rendered template should ideally bundle all of the JS and CSS files that it extends.

This utility file seeks to create a dependency tree of multiple entrypoints (as provided in the file patterns to search) and return arrays of which should be bundled together for each terminal template (leaf, or final child template).

### Key Functions
- ```getFilePaths(srcDir, filePattern, ignoreStr)```: This function returns an array of file paths that match a given file pattern within a specified source directory. It can also ignore files that match a certain pattern.

- ```getFileMap(filePaths)```: This function takes an array of file paths and returns a map of file paths grouped by their directory path.

- ```getBundleMap(entryPoints)```: This function takes an object containing entry points and returns a map where each terminal entry point is mapped to an array of every entry point in its branch.

- ```bundleMapLogger(bundleMap)```: This function logs the bundle map to a file named 'webpack_bundles.txt' in the same directory as this script file.

- ```getDjangoEntrypointBundles(srcDirs, filePattern, ignoreStr)```: This function takes an array of source directories and a file pattern, and returns a map of bundled entry points. It also logs the bundle map using the bundleMapLogger function.

### Usage
This utility can be used by a Webpack configuration file to dynamically generate entry points. It is particularly useful in Django projects where static files are organized in a standardized directory structure.

```getDjangoEntrypointBundles``` is the main function expected to be used. Typical use will be providing your JS and CSS entrypoints for each template. For example, if you have 
- an index.js file that imports and initializes all JS needed for each template, 
- CSS files of any name
- and a specific directory to exclude from the search (such as a vendor directory)
you could use the following:

```js
getDjangoEntrypointBundles(staticDirectories, ["index.js", "*.css"], '**/vendor/**')
```
The dependency tree will bundle sibling matches and any parent matches in the directory structure.

## Webpack Configs
### 1. ```webpack.config.js```
This is the base configuration file for Webpack in a Django project. It is designed to manage and organize the bundling of static files (JavaScript and CSS) in the Django project.

Bundles are output to the ```dist``` directory in the project root, along the same static directory structure as the final entrypoint. For example, given the original path, the bundle will be output to the following path:
```
\Project\app1\static\app1\js\app1\subfolder\index.js        # entrypoint
       \Project\dist\app1\js\app1\subfolder\main.bundle.js  # bundle
```

In this way, collectstatic will collect the bundles into the same directory as the final entrypoint.

JS bundles are named ```main.bundle.js```.
CSS bundles are named ```styles.bundle.css```.

#### Key Components

- `getDjangoEntrypointBundles`: This function from `webpack.config.utils.js` is used to dynamically generate entry points.
    ```js
    getDjangoEntrypointBundles(staticDirectories, ["index.js", "*.css"], '**/vendor/**')
    ```
    Here, it is set to find all ```index.js``` files as entrypoints, any ```.css``` file, and ignore any vendor files for either CSS or JS.
- `djangoPaths`: This module from `webpack.djangopaths.js` provides several functions and constants to handle file paths and directories in the Django project.

- `outputDirectory`: This constant holds the output directory for the bundled files and is set to **```dist```**.

- `MiniCssExtractPlugin`: This plugin is used to read CSS files and output them to a separate bundle. It can also be configured to extract CSS from JS files if needed.


#### Usage

This configuration file is used by Webpack to bundle the static files in the Django project. It generates separate JavaScript and CSS bundles for each entry point, and outputs them to the specified output directory.

To use this configuration, you can run the Webpack command in the project root directory. The configuration will automatically bundle all static files according to the specified rules and output them to the `dist` directory.
### 2. ```webpack.dev.config.js```
    npm run bundle-dev
This configuration file is used for development. It is exactly the same as the base configuration, except it adds the ```inline-source-map``` option to the devtool property to allow for easier debugging.

### 3. ```webpack.prod.config.js```
    npm run bundle-prod
This configuration file is used for production. It extends the base configuration, adding the ```source-map``` devtool, and using the ```TerserPlugin``` and the ```CSSMinimizerPlugin``` to minify JS and CSS.

### 4. ```webpack.deploy.config.js```
    npm run bundle-deploy
This configuration file is used for deployment. It extends the production configuration, only removing the source map from the devtool.

### 5. ```webpack.purge.config.js```
    npm run bundle-purge
This configuration file extends the development configuration, using the ```PurgeCSSPlugin``` to remove unused CSS from the bundle. It adds any vendor CSS to the extended entries to purge as well.

Rather than rely on the plugin to accurately remove unused CSS, it is rather intended to generate a ```purged-css.json``` file that displays all unused CSS, which can then be manually removed from the source files at the user's discretion.

Because the ```PurgeCSSPlugin``` seems to not be able to output the purged CSS to a file as it should, a custom plugin, **```PurgedCSSWriterPlugin```**, in ```purgecss.wrapperclass.js``` is used to wrap the ```PurgeCSSPlugin``` and write the purged CSS to a file.

