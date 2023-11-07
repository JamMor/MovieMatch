const path = require('path');
const glob = require('glob');
const fs = require('fs');

/**
 * Returns an array of file paths that match the given file pattern.
 * @param {string} srcDir - The root directory to search for files.
 * @param {string | string[]} filePattern - The file pattern(s) to match.
 * @param {string} [ignoreStr] - A glob pattern of files to ignore.
 * @returns {string[]} - An array of file paths that match the given file pattern.
 * @throws {Error} - Throws an error if no file pattern is provided.
 */
function getFilePaths(srcDir, filePattern, ignoreStr = undefined) {
    if (!filePattern || !filePattern.length) {
        throw new Error("A file pattern is required.");
    }
    if (!Array.isArray(filePattern)) {
        filePattern = [filePattern];
    }
    const filePatternStr = filePattern.length > 1
        ? `{${filePattern.join(',')}}`
        : filePattern[0];

    const filePaths = glob.sync(
        `${srcDir}/**/${filePatternStr}`,
        {
            posix: true,
            dotRelative: true,
            ignore: ignoreStr,
        }
    );
    return filePaths
}

/**
 * Returns a map of file paths grouped by their directory path.
 * @param {string[]} filePaths - An array of file paths.
 * @returns {Object.<string, string[]>} - A map of file paths grouped by their directory path.
 */
function getFileMap(filePaths) {
    const fileMap = {};
    filePaths.forEach((filePath) => {
        let dirPath = path.dirname(filePath);
        // Only use everything after "static/"
        dirPath = dirPath.split('static/')[1];
        if (!fileMap.hasOwnProperty(dirPath)){
            fileMap[dirPath] = [];
        }
        fileMap[dirPath].push(filePath);
    });

    return fileMap;
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
         * @param {string} filePaths - The filepaths in the node.
         * @param {Node|null} parent - The parent node of the node.
         * @param {Node[]} children - The child nodes of the node.
         */
        constructor(name, filePaths, parent = null, children = []) {
            this.name = name
            this.filePaths = filePaths
            this.depth = name.split('/').length
            this.parent = parent
            this.children = children
        }
    }

    const nodeMap = {}
    Object.entries(entryPoints).forEach(([name, filePaths]) => {
        nodeMap[name] = new Node(name, filePaths);
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
     * @returns {Node[]} - An array of ancestor nodes for the given node, ordered 
     * from leaf to root.
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

    // Create a map with the leaf.name as the key and the value as an array of 
    // every ancestor filepath.
    const bundles = {};
    const leaves = getLeafNodes(nodeMap);
    for (const leaf of leaves) {
        const ancestors = getAncestors(leaf).reverse(); // Order from root to leaf
        bundles[leaf.name] = ancestors.flatMap(node => node.filePaths);
    }
    
    return bundles;
}

/**
 * Logs the bundle map to a file.
 * @param {Object} bundleMap - The bundle map object.
 */
function bundleMapLogger(bundleMap) {
    const outputFilePath = path.join(__dirname, 'webpack_bundles.txt');

    const bundleNames = Object.keys(bundleMap);
    const textEntries = [];
    textEntries.push(`Generated ${bundleNames.length} bundles.\n${"=".repeat(40)}`)
    bundleNames.forEach((bundle) => {
        textEntries.push(`"${bundle}"\n[ ${bundleMap[bundle].join(', ')} ]`)
    })
    const textContent = textEntries.join('\n\n');
    fs.writeFileSync(outputFilePath, textContent);
}

/**
 * Returns a map of bundled entrypoints from each source directory.
 * @param {string[]} srcDirs - An array of source directories.
 * @param {string | string[]} filePattern - The file pattern(s) to match.
 * @param {string} [ignoreStr] - A glob pattern of files to ignore.
 * @returns {Object} - A map of bundled entrypoints.
 */
function getDjangoEntrypointBundles (srcDirs, filePattern, ignoreStr = undefined) {    
    // Get the bundled entrypoints from each source directory
    const bundleMap = {};
    srcDirs.forEach(dir => {
        const filePaths = getFilePaths(dir, filePattern, ignoreStr);
        const fileMap = getFileMap(filePaths);
        const dirBundleMap = getBundleMap(fileMap);
        Object.assign(bundleMap, dirBundleMap);
    });

    bundleMapLogger(bundleMap);

    return bundleMap;
}

module.exports = { getDjangoEntrypointBundles, getFilePaths };