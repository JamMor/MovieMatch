/**
 * Escapes special characters in a string to their corresponding HTML entities.
 * @param {string} str - The string to escape.
 * @returns {string} The escaped string.
 */
function escapeHtml(str) {
    const charMap = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": "&#039;",
    };
    return str.replace(/[&<>"']/g, function (char) {
        return charMap[char];
    });
}

/**
 * Replaces HTML entities in a string with their corresponding characters.
 * @param {string} str - The string to unescape.
 * @returns {string} - The unescaped string.
 */
function unescapeHtml(str) {
    const charMap = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        "&#039;": "'",
    };
    return str.replace(/(&amp;|&lt;|&gt;|&quot;|&#039;)/g, function (char) {
        return charMap[char];
    });
}

export { escapeHtml, unescapeHtml };