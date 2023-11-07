const fs = require('fs');
const { PurgeCSSPlugin } = require("purgecss-webpack-plugin");

class PurgeCSSWriterPlugin {
  constructor({ output = './purged-css.json', ...purgeCSSPluginOpts }) {
    this.output = output;
    this.rejected = purgeCSSPluginOpts.rejected;
    this.purgeCSSPlugin = new PurgeCSSPlugin(purgeCSSPluginOpts);
  }

  apply(compiler, ...args) {
    this.purgeCSSPlugin.apply(compiler, ...args);
    if (!this.rejected) {
      return;
    }
    compiler.hooks.done.tapPromise('PurgeCSSWriterPlugin', () => {
      // Write rejected css to output path
      return new Promise((res, rej) => {
        fs.writeFile(
          this.output,
          JSON.stringify(this.purgeCSSPlugin.purgedStats, null, 4),
          (err, data) => (err ? rej(err) : res(data)),
        );
      });
    });
  }
}

module.exports = PurgeCSSWriterPlugin;