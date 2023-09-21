#!/usr/bin/env node
import { $, chalk, fs, within } from "zx";
import "dotenv/config";
import { Command } from "commander";
import dev from "./dev.js";
import preview from "./preview.js";
$.verbose = false;
const DEFAULT_CONFIG_NAME = "makemail.json";
const DEFAULT_CONFIG = {
    locales: ["en"],
    ignoreDefaultLocale: true,
    defaultFileName: "index.html",
    emailUrlTagName: "_emailUrl",
    _defaultIndexFile: "example/src/templates/index.mjml",
    dirs: {
        templates: "example/src/templates",
        assets: "example/src/assets",
        output: "example/dist",
    },
    read: ["example/src/templates/**/*.mjml", "assets"],
    watch: ["example/src/templates/**/*.mjml", "assets"],
    // browserSync: {
    //   open: false,
    // },
    files: [],
    s3: {
        bucket: "mjml-preview",
        region: "ca-central-1",
    },
    overwriteOutputDir: true,
};
const program = new Command();
program.name("makemail").description("CLI for makemail").version("0.0.1");
program.option("-p, --preview <file>", "preview email");
program.option("-d, --dev", "development mode");
program.option("-w, --watch [globs...]", "watch for changes");
program.option("-c, --config <file>", "config file");
program.option("-t, --templates <dir>", "overwrite dirs.templates");
program.option("-a, --assets <dir>", "overwrite dirs.assets");
program.option("-o, --output <dir>", "overwrite dirs.output");
program.option("-b, --browser-sync <command>", "browser-sync command");
await program.parse(process.argv);
const opts = program.opts();
let mode = "dev";
/**
 * Build config
 */
const config = await within(async function () {
    const definedConfig = async () => {
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
    if (opts.preview) {
        config.preview = opts.preview;
        mode = "preview";
    }
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
 * delete output directory?
 */
if (config.overwriteOutputDir) {
    await $ `rm -rf ${config.dirs.output}`;
}
/**
 * make directories if they don't exist
 */
for (const key of Object.keys(config.dirs)) {
    await $ `mkdir -p ${config.dirs[key]}`;
}
if (mode === "preview") {
    console.log(chalk.yellow(`Previewing ${config.preview}`));
    preview(config);
}
else {
    console.log(chalk.yellow("Starting dev..."));
    dev(config);
}
//# sourceMappingURL=cli.js.map