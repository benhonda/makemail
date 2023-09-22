#!/usr/bin/env node
import { $, chalk, fs, path } from "zx";
import "dotenv/config";
import { Command } from "commander";
import { compileRuntimeConfig, compileSettings } from "./helpers/commander.js";
import browserSync from "browser-sync";
import { watch } from "chokidar";
import mjml2Html from "mjml";
import handlebars from "handlebars";
import { welcomeMjml } from "./helpers/_welcome.js";
import _ from "lodash";
/**
 *
 * Default configuration settings
 *
 */
export const DEFAULT_LOCALE = "en";
// TODO: switch this to be defaultSettings
export const _defaultSettings = {
    srcDir: "src",
    outDir: "dist",
    watch: true,
    locales: [DEFAULT_LOCALE],
    options: {
        deleteOutDir: true,
        omitDefaultLocaleFromFileName: true,
    },
    browserSync: {
        startPath: "__.html",
        open: true,
        watch: true,
    },
};
// THESE ARE MY TESTING SETTINGS
export const defaultSettings = {
    ..._defaultSettings,
    srcDir: "example/src",
    outDir: "example/dist",
    watch: true,
    locales: [DEFAULT_LOCALE],
};
/**
 *
 *
 *
 *
 */
$.verbose = false;
const program = new Command();
program.name("makemail").description("CLI for makemail").version("0.0.1");
program.option("-p, --preview <file>", "preview email");
program.option("-d, --dev", "development mode");
program.option("-w, --watch [glob]", "watch for changes");
program.option("-c, --config <file>", "config file");
program.option("-t, --templates <dir>", "overwrite dirs.templates");
program.option("-a, --assets <dir>", "overwrite dirs.assets");
program.option("-o, --output <dir>", "overwrite dirs.output");
program.option("-b, --browser-sync <command>", "browser-sync command");
program
    .command("compile")
    .description("compile templates to html")
    .argument("[glob]", "comma separated list of globs", glob => glob.split(","))
    .action(async (glob, options) => {
    // options
    const settings = await compileSettings(options);
    if (glob && glob.length > 0) {
        // overwrite settings with options
        settings.inputFiles = glob;
    }
    await maybeDeleteOutDir(settings);
    await makeNecessaryDirs(settings);
    const runtime = await compileRuntimeConfig(settings);
    if (settings.watch) {
        // watch for changes
        watchFiles(settings, runtime);
    }
    else {
        // compile all files
        for (const inputFilePath of Object.keys(runtime.files)) {
            const files = runtime.files[inputFilePath];
            await compileFiles(settings, files);
        }
    }
    // compile the welcome page
    await compileWelcomePage(settings, runtime);
    // browser-sync
    if (settings.browserSync) {
        browserSync.init({
            server: settings.outDir,
            ...settings.browserSync,
            // TODO: options like --browser-sync "start --server example/dist"
        });
    }
});
await program.parseAsync(process.argv);
async function compileWelcomePage(settings, runtime) {
    const files = _.flatten(Object.values(runtime.files).map(files => files.map(file => `${file.outputPath}`)))
        .filter(file => path.extname(file) === ".html")
        .map(file => {
        // TODO: replace this with the actual browser-sync base?
        return file.replace(settings.outDir, "");
    });
    // setup the welcome page
    // create the welcome file
    const welcomeFileName = "__";
    const welcomeFile = {
        inputPath: `${settings.srcDir}/${welcomeFileName}.mjml`,
        inputType: "mjml",
        outputPath: `${settings.outDir}/${welcomeFileName}.html`,
        outputType: "html",
        locale: DEFAULT_LOCALE,
        handlebars: {
            context: {
                files,
                locales: settings.locales,
            },
        },
    };
    // TODO: it would be nice if we didn't have to copy this to the user's srcDir
    // this makes any nested directories that don't exist
    await $ `mkdir -p ${path.dirname(welcomeFile.inputPath)}`;
    // create the file and write it
    await fs.writeFile(welcomeFile.inputPath, welcomeMjml);
    // compile the welcome file
    await compileFiles(settings, [welcomeFile]);
}
function maybeDeleteOutDir(settings) {
    if (settings.options?.deleteOutDir) {
        $ `rm -rf ${settings.outDir}`;
    }
}
function makeNecessaryDirs(settings) {
    $ `mkdir -p ${settings.srcDir}`;
    $ `mkdir -p ${settings.outDir}`;
}
async function watchFiles(settings, runtime) {
    const watcher = watch(Object.keys(runtime.files), { ignoreInitial: true });
    watcher.on("ready", async () => {
        for (const inputFilePath of Object.keys(runtime.files)) {
            const files = runtime.files[inputFilePath];
            await compileFiles(settings, files);
        }
    });
    watcher.on("add", async (path) => {
        const files = runtime.files[path];
        await compileFiles(settings, files);
    });
    watcher.on("change", async (path) => {
        const files = runtime.files[path];
        await compileFiles(settings, files);
    });
}
async function compileFiles(settings, files) {
    // files is plural because there can be multiple output files
    for (const file of files) {
        // TODO: define supported input types
        if (["html", "mjml"].includes(file.inputType)) {
            // compile the handlebars template
            const templateOutput = await compileHandlebars(settings, file);
            // compile the mjml template
            const htmlOutput = await mjml2Html(templateOutput, {
                // minify: true,
                keepComments: false,
            });
            // this makes any nested directories that don't exist
            await $ `mkdir -p ${path.dirname(file.outputPath)}`;
            // write the output file
            await fs.writeFile(file.outputPath, htmlOutput.html);
            console.log(chalk.green(`${file.inputPath} -> ${file.outputPath} - file compiled successfully.`));
        }
        else {
            // just copy the file
            // this makes any nested directories that don't exist
            await $ `mkdir -p ${path.dirname(file.outputPath)}`;
            // copy the file
            await $ `cp ${file.inputPath} ${file.outputPath}`;
        }
    }
}
async function compileHandlebars(settings, file) {
    // get the file contents
    const contents = await fs.readFile(file.inputPath, "utf8");
    // register i18n helper
    handlebars.registerHelper("t", function (...text) {
        if (!text) {
            return "";
        }
        // find with text index is the locale
        const indexOfLocale = (file.locale && file.locales?.indexOf(file.locale)) || -1;
        if (indexOfLocale > -1 && text[indexOfLocale]) {
            return text[indexOfLocale];
        }
        return text[0];
    });
    //  compile the template
    const template = handlebars.compile(contents);
    return template(file.handlebars?.context || {}, file.handlebars?.options || {});
}
//# sourceMappingURL=cli.js.map