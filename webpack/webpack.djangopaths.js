// Description: Django paths for webpack
const path = require('path');

const webpackConfigSubdirectory = __dirname
/**
 * Returns the output path for a given filename in the webpack directory.
 * @param {string} filename - The name of the file to output.
 * @returns {string} - The output path for the given filename.
 */
function outputToWebpackDir(filename){
    return path.join(webpackConfigSubdirectory, filename)
}

const projectRoot = path.dirname(webpackConfigSubdirectory)

const projectBaseDirectory = "movie_match"
// Django apps to bundle
const installed_apps = [
    "login_and_reg",
    "list_builder",
    "elimination_room",
]

const staticPath = (staticContainer) => path.join(projectRoot, staticContainer, 'static')
const templatesPath = (staticContainer) => path.join(projectRoot, staticContainer, 'templates')

const vendorStaticDirs = {
    css: path.join(staticPath(projectBaseDirectory), 'css', 'vendor'),
    js: path.join(staticPath(projectBaseDirectory), 'js', 'vendor'),
}

/**
 * Returns an array of all static directories for the Django project.
 * @returns {Array<string>} An array of strings representing the paths to all static directories.
 */
function getAllStaticDirectories() {
    const allStaticDirectories = installed_apps.map(staticPath);
    allStaticDirectories.push(staticPath(projectBaseDirectory));
    return allStaticDirectories;
}

/**
 * Returns an array of all template directories for the Django project.
 * @returns {Array} An array of strings representing the absolute paths to each template directory.
 */
function getAllTemplateDirectories() {
    const allTemplateDirectories = installed_apps.map(templatesPath);
    allTemplateDirectories.push(templatesPath(projectBaseDirectory));
    return allTemplateDirectories;
}

// Imports for shared js modules use the Django static URL, and must be mapped
// to the actual directory path for webpack.
const sharedJsDir = path.join(staticPath(projectBaseDirectory), 'js', 'shared')
const sharedJsUrl = '/static/js/shared'

module.exports = {
    webpackConfigSubdirectory,
    outputToWebpackDir,
    projectRoot,
    projectBaseDirectory,
    installed_apps,
    getAllStaticDirectories,
    getAllTemplateDirectories,
    vendorStaticDirs,
    sharedJsDir,
    sharedJsUrl,
};