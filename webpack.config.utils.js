// webpack.config.js
const path = require('path');
const glob = require('glob');
const fs = require('fs');

/**
 * Returns an object mapping the static directory paths to the file paths of every 
 * index.js file in the specified directory.
 * @param {string} srcDir - The path of the directory to search for index.js files.
 * @returns {Object} - An object mapping the directory paths to file paths of all index.js files.
 */
function getIndexFiles(srcDir) {
    const indexMap = {};
    const indexFilePaths = glob.sync(
        `${srcDir}/**/index.js`,
        {
            posix: true,
            dotRelative: true,
        }
    );

    const staticRoot = "/static"
    indexFilePaths.forEach((filePath) => {
        let dirPath = path.dirname(filePath);
        // Remove the static root from the path
        let subDirIndex = dirPath.indexOf(staticRoot);
        if (subDirIndex != -1) {
            dirPath = dirPath.slice(subDirIndex + staticRoot.length);
        }
        indexMap[dirPath] = filePath;
    });

    return indexMap;
}

/**
 * Flattens nested entrypoints into bundles for each branch, mapping the name of the
 * terminal entrypoint to an array of every entrypoint in the branch.
 * @param {Object} entryPoints - An object containing entry points as key-value pairs.
 * @returns {Object} - An object mapping the name of the terminal entrypoint to an array of every entrypoint in the branch.
 */
function getBundleMap(entryPoints) {
    /**
     * Represents a node in the dependency tree.
     */
    class Node {
        /**
         * Creates a new Node instance.
         * @param {string} name - The name of the node.
         * @param {string} fullPath - The full path of the node.
         * @param {Node|null} parent - The parent node of the node.
         * @param {Node[]} children - The child nodes of the node.
         */
        constructor(name, fullPath, parent = null, children = []) {
            this.name = name
            this.fullPath = fullPath
            this.depth = name.split('/').length
            this.parent = parent
            this.children = children
        }
    }

    const nodeMap = {}
    Object.entries(entryPoints).forEach(([name, fullPath]) => {
        nodeMap[name] = new Node(name, fullPath);
    })

    for (const key of Object.keys(nodeMap)) {
        const node = nodeMap[key];
        const pathRoot = path.parse(key).root;
        
        function isRoot(path){
            return path == pathRoot || path == "." || path == "/" || path == "";
        }
        
        let dirPath = key;
        let i = 0;
        while (!isRoot(dirPath) && i < 100) {
            dirPath = path.dirname(dirPath);
            // If a parent node is found from the path...
            if (nodeMap.hasOwnProperty(dirPath)) {
                const parentNode = nodeMap[dirPath];
                node.parent = parentNode;
                parentNode.children.push(node);
                break;
            };

            i++
            if (i >= 100){console.error(`Infinite loop detected on ${key}`)}
        };
    }

    /**
     * Returns an array of leaf nodes in the node map.
     * @param {Object} nodeMap - The node map to search for leaf nodes.
     * @returns {Node[]} - An array of leaf nodes in the node map.
     */
    function getLeafNodes(nodeMap) {
        const leafNodes = [];
        for (const node of Object.values(nodeMap)) {
            if (node.children.length === 0) {
                leafNodes.push(node);
            }
        }
        return leafNodes;
    }

    /**
     * Returns an array of root nodes in the node map.
     * @param {Object} nodeMap - The node map to search for root nodes.
     * @returns {Node[]} - An array of root nodes in the node map.
     */
    function getRootNodes(nodeMap) {
        const rootNodes = [];
        for (const node of Object.values(nodeMap)) {
            if (node.parent === null) {
                rootNodes.push(node);
            }
        }
        return rootNodes;
    }

    /**
     * Returns an array of ancestor nodes for the given node.
     * @param {Node} node - The node to get ancestors for.
     * @returns {Node[]} - An array of ancestor nodes for the given node.
     */
    function getAncestors(node) {
        const ancestors = [];
        let currentNode = node;
        while (currentNode) {
            ancestors.push(currentNode);
            currentNode = currentNode.parent;
        }
        return ancestors;
    }

    /**
     * Prints the names of the nodes in the given list to the console.
     * @param {Node[]} nodeList - The list of nodes to print names for.
     */
    function printNames(nodeList) {
        console.log(nodeList.map(node => node.name).join(', '));
    }

    // Create a map with the leaf.name as the key and the value as an array of every ancestor index
    // plus the shared JS (which is therefore not its own bundle)
    const bundles = {};
    const leaves = getLeafNodes(nodeMap);
    for (const leaf of leaves) {
        const ancestors = getAncestors(leaf);
        bundles[leaf.name] = ancestors.map(node => node.fullPath);
    }
    
    return bundles;
}

/**
 * Given a source directory, creates a tree of index.js files, assuming that each
 * node must be bundled with it's parents to have the complete code. Returns a map
 * for each leaf node index.js with an array of all the parent index.js it is to 
 * be bundled with.
 * @returns {Object} A map of Django entry points.
 */
function getFlattenedJSEntryPoints(relSrcDir) {
    const indexMap = getIndexFiles(relSrcDir);
    const bundleMap = getBundleMap(indexMap);

    const bundleNames = Object.keys(bundleMap);
    const textNum = `${bundleNames.length} bundles.`
    const textNames = bundleNames.join('\n');
    const textContent = `NUM_BUNDLES="${textNum}"\nBUNDLE_PATHS="${textNames}"`;
    fs.writeFileSync('js_leaf_nodes.env', textContent);

    return bundleMap;
}

/**
 * Logs the bundle map to a file and console.
 * @param {Object} bundleMap - The bundle map object.
 */
function bundleMapLogger(bundleMap) {
    const outputFilename = 'js_leaf_nodes.txt';

    const bundleNames = Object.keys(bundleMap);
    const textEntries = [];
    textEntries.push(`Generated ${bundleNames.length} bundles.\n${"=".repeat(40)}`)
    bundleNames.forEach((bundle) => {
        textEntries.push(`"${bundle}"\n[ ${bundleMap[bundle].join(', ')} ]`)
    })
    const textContent = textEntries.join('\n\n');
    fs.writeFileSync(outputFilename, textContent);
}

/**
 * Returns a map of entrypoints for Django bundles.
 * @param {string[]} appDirs - An array of django app static JS directories.
 * @param {string[]} commonDirs - An array of directories containing common JS across all apps.
 * @returns {Object} - A map of entrypoints for JS bundles.
 */
function getDjangoEntrypointBundles (appDirs, commonDirs) {
    const commonIndexMap = {};
    commonDirs.forEach(dir => {
        Object.assign(commonIndexMap, getIndexFiles(dir));
    })
    const commonPaths = Object.values(commonIndexMap);
    
    // Get the bundled entrypoints from each app and add common entrypoint paths
    const bundleMap = {};
    appDirs.forEach(dir => {
        const appIndexMap = getIndexFiles(dir);
        const appBundleMap = getBundleMap(appIndexMap);
        Object.entries(appBundleMap).forEach(([key, value]) => {
            appBundleMap[key].push(...commonPaths);
        })
        Object.assign(bundleMap, appBundleMap);
    });

    bundleMapLogger(bundleMap);

    return bundleMap;
}

module.exports = { getDjangoEntrypointBundles };