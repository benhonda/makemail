#!/usr/bin/env node

import { $, argv, chalk, fs, within } from "zx";
import { Command } from "commander";
import { Config } from "./@types/types.js";
import dev from "./dev.js";

const DEFAULT_CONFIG_NAME = "makemail.json";
const DEFAULT_CONFIG: Config = {
  _defaultIndexFile: "_config.html",
  dirs: {
    templates: "example/src/templates",
    assets: "example/src/assets",
    output: "example/dist",
  },
  watch: [],
  browserSync: {
    open: true,
  },
};

console.log("Hello from my-script👋");
console.log("Hello from my-script👋");
console.log("Hello from my-script👋");
console.log("Hello from my-script👋");
console.log("Hello from my-script👋");
console.log("Hello from my-script👋");

const program = new Command();

program.name("makemail").description("CLI for makemail").version("0.0.1");

program.option("-p, --preview", "preview email");
program.option("-d, --dev", "development mode");

program.option("-w, --watch [globs...]", "watch for changes");
program.option("-c, --config <file>", "config file");
program.option("-t, --templates <dir>", "overwrite dirs.templates");
program.option("-a, --assets <dir>", "overwrite dirs.assets");
program.option("-o, --output <dir>", "overwrite dirs.output");
program.option("-b, --browser-sync <command>", "browser-sync command");

await program.parse(process.argv);

const opts = program.opts();
const mode = opts.preview ? "preview" : "dev";

/**
 * Build config
 */
const config: Config = await within(async function () {
  console.log(chalk.yellow("Building config..."));

  const definedConfig: () => Promise<Config> = async () => {
    // if options.config, load config from file and merge with default config
    if (await fs.exists(opts.config)) {
      return {
        ...DEFAULT_CONFIG,
        ...JSON.parse(await fs.readFile(opts.config, "utf8")),
      };
    }

    // else, look for makemail.config.json in the root directory and merge with default config
    if (await fs.exists(DEFAULT_CONFIG_NAME)) {
      return {
        ...DEFAULT_CONFIG,
        ...JSON.parse(await fs.readFile(DEFAULT_CONFIG_NAME, "utf8")),
      };
    }

    // else, just use default config
    return DEFAULT_CONFIG;
  };

  const config = await definedConfig();

  // overwrite config with options
  if (opts.templates) {
    config.dirs.templates = opts.templates;
  }

  if (opts.assets) {
    config.dirs.assets = opts.assets;
  }

  if (opts.output) {
    config.dirs.output = opts.output;
  }

  if (opts.watch) {
    config.watch = opts.watch;
  }

  if (opts.browserSync) {
    config.browserSync = {
      open: opts.browserSync === "no-open" ? false : true,
    };
  }

  return config;
});

/**
 * make directories if they don't exist
 */
await Object.keys(config.dirs).forEach(key => {
  $`mkdir -p ${config.dirs[key as keyof Config["dirs"]]}`;
});

if (mode === "preview") {
  console.log("preview mode!");
} else {
  dev(config);
}
