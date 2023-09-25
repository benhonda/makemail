#!/usr/bin/env node
import { $, chalk, fs, path } from "zx";
import "dotenv/config";
import { Command } from "commander";
import browserSync from "browser-sync";
import { watch } from "chokidar";
import mjml2Html from "mjml";
import handlebars from "handlebars";
import { parse as parseHtml } from "node-html-parser";
import { compileRuntimeConfig, compileSettings } from "./helpers/commander.js";
import { welcomeMjml } from "./helpers/_welcome.js";
import _ from "lodash";
import { existsInS3, getS3Url, uploadToS3 } from "./helpers/s3.js";
$.verbose = false;
/**
 *
 * Default configuration settings
 *
 */
export const DEFAULT_LOCALE = "en";
export const ARGV_CONFIG = {
    verbose: { flag: "-v --verbose", description: "verbose output" },
    watch: { flag: "-w --watch", description: "watch for changes" },
    settings: { flag: "--settings <file>", description: "set settings file" },
    src: { flag: "-s --src <dir>", description: "set src dir" },
    input: { flag: "-i --input <files>", description: "comma separated list of input file globs" },
    output: { flag: "-o --output <dir>", description: "set output dir" },
    locales: { flag: "-l --locales <locales>", description: "comma separated list of locales" },
    deleteOutDir: { flag: "-D --delete-out-dir", description: "delete the output directory before compiling" },
    browserSync: { flag: "-b --browser-sync", description: "start browser-sync" },
    browserSyncOptions: { flag: "-B --browser-sync-options <options>", description: "browser-sync options" },
    noOpen: { flag: "--no-open", description: "don't open browser-sync" },
    port: { flag: "--port <port>", description: "browser-sync port" },
    startPath: { flag: "--start-path <startPath>", description: "browser-sync start path" },
    upload: { flag: "-u, --upload", description: "upload files and assets to s3 if not already uploaded" },
    forceUpload: { flag: "--force-upload", description: "force upload assets to s3 (even if they already exist)" },
    bucket: { flag: "--bucket <bucket>", description: "s3 bucket" },
    region: { flag: "--region <region>", description: "s3 region" },
    omitDefaultLocaleFromFileName: {
        flag: "--omit-default-locale",
        description: "omit the default locale from the file name",
    },
};
// TODO: switch this to be defaultSettings
export const _defaultSettings = {
    verbose: "dev",
    srcDir: "src",
    outDir: "dist",
    watch: "dev",
    locales: [DEFAULT_LOCALE],
    uploadFilesAndAssets: "prod",
    forceUploadFilesAndAssets: false,
    options: {
        deleteOutDir: "prod",
        omitDefaultLocaleFromFileName: true,
        viewInBrowserTag: "viewInBrowserLink",
    },
    browserSync: "dev",
    browserSyncOptions: {
        watch: true,
        startPath: "__.html",
    },
    // TODO:
    // maybe dev: {} and prod: {}?
    // then merge in compileSettings() so that they can be overwritten with opts
};
// THESE ARE MY TESTING SETTINGS
export const defaultSettings = {
    ..._defaultSettings,
    srcDir: "example/src",
    outDir: "example/dist",
    locales: [DEFAULT_LOCALE],
    // browserSync: {
    //   startPath: "__.html",
    //   open: true,
    //   watch: undefined,
    // },
};
/**
 *
 *
 *
 *
 */
const program = new Command();
program.name("makemail").description("CLI for makemail").version("0.0.1");
// adding options
for (const [__, value] of Object.entries(ARGV_CONFIG)) {
    program.option(value.flag, value.description, value.default);
    // program.addOption(new Option(value.flag, value.description));
    // console.log(value.flag, value.description);
}
/**
 *
 *
 *
 * 'dev' command
 *
 *
 *
 */
program
    .command("dev", { isDefault: true })
    .description("compile templates to html")
    .argument("[glob]", "comma separated list of globs", glob => glob.split(","))
    .action(async (glob) => {
    const options = program.opts();
    const settings = await compileSettings(options, "dev");
    if (glob && glob.length > 0) {
        // overwrite settings with options
        settings.inputFiles = glob;
    }
    await maybeDeleteOutDir(settings);
    await makeNecessaryDirs(settings);
    const runtime = await compileRuntimeConfig(settings, "dev");
    if (settings.watch) {
        // watch files (by default)
        watchFiles(settings, runtime);
    }
    else {
        // compile all files once
        await compileFiles(settings, runtime);
    }
    // compile the welcome page
    await compileWelcomePage(settings, runtime);
    // browser-sync (by default)
    if (settings.browserSync) {
        browserSync.init({
            server: settings.outDir,
            watch: settings.browserSyncOptions.watch,
            ...settings.browserSyncOptions,
            // TODO: options like --browser-sync "start --server example/dist"???
        });
    }
});
/**
 *
 *
 *
 * 'prod' command
 *
 *
 *
 */
program
    .command("prod")
    .description("compile templates to html, minify, inline css, etc.")
    .argument("[glob]", "comma separated list of globs", glob => glob.split(","))
    .action(async (glob) => {
    const options = program.opts();
    const settings = await compileSettings(options, "prod");
    if (glob && glob.length > 0) {
        // overwrite settings with options
        settings.inputFiles = glob;
    }
    await maybeDeleteOutDir(settings);
    await makeNecessaryDirs(settings);
    const runtime = await compileRuntimeConfig(settings, "prod");
    if (settings.watch) {
        // watch for changes only if the user has specified to
        watchFiles(settings, runtime);
    }
    else {
        // compile all files once
        const files = await compileFiles(settings, runtime);
        const pwd = (await $ `pwd`).stdout.trim();
        console.log("**********************************************");
        console.log("* The following files were compiled:");
        console.log("*");
        files.forEach(file => {
            if (file.outputType === "html" && file.outputPath) {
                console.log(`* ${file.outputPath}`.trim());
                console.log(`* - test in browser link: file://${pwd}/${file.outputPath}`);
                console.log(`*`);
            }
        });
        console.log("**********************************************");
    }
    // browser-sync
    if (settings.browserSync) {
        // compile the welcome page if we're using browser-sync
        await compileWelcomePage(settings, runtime);
        browserSync.init({
            server: settings.outDir,
            watch: settings.browserSyncOptions.watch,
            ...settings.browserSyncOptions,
            // TODO: options like --browser-sync "start --server example/dist"
        });
    }
});
/**
 *
 *
 *
 * run the program
 *
 *
 *
 */
await program.parseAsync(process.argv);
/**
 * ------------------------------------------------------------------------
 *
 *
 * Functions
 *
 *
 * ------------------------------------------------------------------------
 */
/**
 * Compile the files
 *  if files is undefined, then compile all files in runtime.files
 *
 * @param settings
 * @param runtime
 * @param files
 */
async function compileFiles(settings, runtime, files) {
    files = files || _.flatten(Object.values(runtime.files));
    // note: files is plural because there can be multiple output files
    for (const file of files) {
        // TODO: define supported input types
        if (["html", "mjml"].includes(file.inputType)) {
            // compile the handlebars template
            const templateOutput = await compileHandlebars(settings, file);
            // go in and replace assets
            let maybeWithAssets = templateOutput;
            if (settings.uploadFilesAndAssets) {
                try {
                    const root = parseHtml(templateOutput);
                    const imgSrcs = root
                        .querySelectorAll("mj-image")
                        .map(img => img.getAttribute("src"))
                        .filter(src => {
                        // check if the src is a local file
                        return src && !src.startsWith("http");
                    });
                    for (const src of imgSrcs) {
                        if (!src)
                            continue;
                        let s3Url;
                        // check if the file already exists in s3
                        if ((await existsInS3(settings, src)) && !settings.forceUploadFilesAndAssets) {
                            // if it does, then just get the s3 url and use that
                            s3Url = getS3Url(settings, src);
                            console.log(chalk.yellow(`* - ${s3Url} - file already exists in s3. Using that.`));
                        }
                        else {
                            // upload the file
                            const pathToAsset = path.resolve(path.dirname(file.inputPath), src);
                            s3Url = await uploadToS3(settings, pathToAsset);
                            if (!s3Url) {
                                continue;
                            }
                        }
                        // now replace the src with the S3 url
                        maybeWithAssets = maybeWithAssets.replaceAll(src, s3Url);
                    }
                }
                catch (error) {
                    console.log(chalk.red(`${file.outputPath} - assets failed to compile.`));
                    if (settings.verbose)
                        console.log(error);
                }
            }
            // compile the mjml template
            const htmlOutput = await mjml2Html(maybeWithAssets, {
                minify: runtime.env === "prod",
                keepComments: false,
            });
            // this makes any nested directories that don't exist
            await $ `mkdir -p ${path.dirname(file.outputPath)}`;
            // write the output file
            await fs.writeFile(file.outputPath, htmlOutput.html);
            // upload the file to s3
            if (settings.uploadFilesAndAssets) {
                const s3Url = await uploadToS3(settings, file.outputPath);
                if (s3Url) {
                    console.log(chalk.green(`* - ${s3Url} - file uploaded successfully.`));
                }
            }
            console.log(chalk.green(`* - ${file.outputPath} - file compiled successfully.`));
        }
        else {
            // just copy the file
            // this makes any nested directories that don't exist
            await $ `mkdir -p ${path.dirname(file.outputPath)}`;
            // copy the file
            await $ `cp ${file.inputPath} ${file.outputPath}`;
        }
    }
    return files;
}
/**
 * Compile the handlebars template
 *
 * @param settings
 * @param file
 * @returns
 */
async function compileHandlebars(settings, file) {
    // get the file contents
    const contents = await fs.readFile(file.inputPath, "utf8");
    try {
        // register i18n helper
        // description: used to output the correct text based on the locale
        // usage: {{t "hello" "hola" "bonjour"}}
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
    catch (error) {
        console.log(chalk.red(`${file.outputPath} - handlebars failed to compile.`));
        if (settings.verbose)
            console.log(error);
        return contents;
    }
}
/**
 * Compile the welcome page
 *
 * @param settings
 * @param runtime
 */
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
    await compileFiles(settings, runtime, [welcomeFile]);
}
/**
 * Delete the output directory if the user has specified to do so
 *
 * @param settings
 */
function maybeDeleteOutDir(settings) {
    if (settings.options?.deleteOutDir) {
        $ `rm -rf ${settings.outDir}`;
    }
}
/**
 * Make the necessary directories
 *
 * @param settings
 */
function makeNecessaryDirs(settings) {
    $ `mkdir -p ${settings.srcDir}`;
    $ `mkdir -p ${settings.outDir}`;
}
/**
 * Watch the files for changes
 *
 * @param settings
 * @param runtime
 */
async function watchFiles(settings, runtime) {
    const watcher = watch(Object.keys(runtime.files), { ignoreInitial: true });
    watcher.on("ready", async () => {
        await compileFiles(settings, runtime);
    });
    watcher.on("add", async (path) => {
        const files = runtime.files[path];
        await compileFiles(settings, runtime, files);
    });
    watcher.on("change", async (path) => {
        const files = runtime.files[path];
        await compileFiles(settings, runtime, files);
    });
}
//# sourceMappingURL=cli.js.map