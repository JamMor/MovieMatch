// webpack.config.js
const path = require('path');
const glob = require('glob');
const fs = require('fs');

/**
 * Returns an object containing the directory paths and file paths of all index.js files in the specified directory.
 * @param {string} relSrcDir - The relative path of the directory to search for index.js files.
 * @returns {Object} - An object containing the directory paths and file paths of all index.js files.
 */
function getIndexFiles(relSrcDir) {
    const indexMap = {};
    const indexFilePaths = glob.sync(
        `${relSrcDir}/**/index.js`,
        {
            posix: true,
            dotRelative: true,
            ignore: 'bundled_assets/**',
            windowsPathsNoEscape: true
        }
    );

    indexFilePaths.forEach((file) => {
        const dirPath = path.dirname(file).replace('./staticfiles/', '');
        indexMap[dirPath] = file;
    });
    return indexMap;
}

/**
 * Flattens nested entrypoints into bundles for each branch, returning a map of 
 * bundle names to an array of every ancestor index plus the shared JS.
 * @param {Object} entryPoints - An object containing entry points as key-value pairs.
 * @returns {Object} - A map of bundle names to an array of every ancestor index plus the shared JS.
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
        let parentKey = key;
        while (parentKey) {
            parentKey = parentKey.split('/').slice(0, -1).join('/');
            if (nodeMap.hasOwnProperty(parentKey)) {
                const parent = nodeMap[parentKey];
                node.parent = parent;
                parent.children.push(node);
                break;
            };
        };
    }

    const sharedJsNode = nodeMap['js'];

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
        if (leaf === sharedJsNode) {
            continue;
        }
        const ancestors = getAncestors(leaf);
        bundles[leaf.name] = ancestors.map(node => node.fullPath);
        bundles[leaf.name].push(sharedJsNode.fullPath);
    }
    
    return bundles;
}

/**
 * Returns a map of bundled entrypoints for extended Django templates where the
 * bundle name is the name of the ultimate template and the value is an array
 * of all the js entrypoints for each inherited template (including the overall 
 * shared JS) to be bundled together.
 *
 * @returns {Object} A map of Django entry points.
 */
function getDjangoJSEntryPoints(relSrcDir) {
    const indexMap = getIndexFiles(relSrcDir);
    const bundleMap = getBundleMap(indexMap);

    const bundleNames = Object.keys(bundleMap);
    const textNum = `${bundleNames.length} bundles.`
    const textNames = bundleNames.join('\n');
    const textContent = `NUM_BUNDLES="${textNum}"\nBUNDLE_PATHS="${textNames}"`;
    fs.writeFileSync('js_leaf_nodes.env', textContent);

    return bundleMap;
}

module.exports = { getDjangoJSEntryPoints };