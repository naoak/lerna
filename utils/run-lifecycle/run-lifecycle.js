"use strict";

const log = require("npmlog");
const npmLifecycle = require("npm-lifecycle");
const npmConf = require("@lerna/npm-conf");

module.exports = runLifecycle;
module.exports.createRunner = createRunner;

function runLifecycle(pkg, stage, opts) {
  log.silly("run-lifecycle", stage, pkg.name);

  const config = {};
  const dir = pkg.location;

  // https://github.com/isaacs/proto-list/blob/27764cd/proto-list.js#L29
  for (const key of opts.keys) {
    const val = opts.get(key);

    if (val != null) {
      config[key] = val;
    }
  }

  // env.npm_config_prefix should be the package directory
  config.prefix = dir;

  // TODO: remove pkg._id when npm-lifecycle no longer relies on it
  pkg._id = `${pkg.name}@${pkg.version}`; // eslint-disable-line

  return npmLifecycle(pkg, stage, dir, {
    config,
    dir,
    failOk: false,
    log,
    unsafePerm: true,
  });
}

function createRunner(commandOptions) {
  const cfg = npmConf(commandOptions);

  return (pkg, stage) => {
    if (pkg.scripts && pkg.scripts[stage]) {
      return runLifecycle(pkg, stage, cfg).catch(err => {
        log.error("lifecycle", `error running ${stage} in ${pkg.name}\n`, err.stack || err);
      });
    }

    return Promise.resolve();
  };
}
