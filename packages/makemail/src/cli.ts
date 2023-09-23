#!/usr/bin/env node

import { $, argv, chalk, fs, path, spinner, within } from "zx";
import "dotenv/config";
import { Argument, Command } from "commander";
import { RunTimeConfig, RunTimeFile, Settings } from "./@types/types.js";
import { compileRuntimeConfig, compileSettings } from "./helpers/commander.js";
import browserSync from "browser-sync";
import { watch } from "chokidar";
import mjml2Html from "mjml";
import handlebars from "handlebars";
import { welcomeMjml } from "./helpers/_welcome.js";
import _ from "lodash";

$.verbose = false;

/**
 *
 * Default configuration settings
 *
 */
export const DEFAULT_LOCALE = "en";

// TODO: switch this to be defaultSettings
export const _defaultSettings: Settings = {
  srcDir: "src",
  outDir: "dist",
  watch: undefined,
  locales: [DEFAULT_LOCALE],

  options: {
    deleteOutDir: true,
    omitDefaultLocaleFromFileName: true,
  },

  browserSync: undefined,
};

// THESE ARE MY TESTING SETTINGS
export const defaultSettings: Settings = {
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
program.option("-w, --watch", "watch for changes");
program.option("-S, --settings <file>", "set settings file");
program.option("-s, --src <dir>", "set src dir");
program.option("-i, --input <files>", "comma separated list of input file globs");
program.option("-o, --output <dir>", "set output dir");
// program.option("-b, --browser-sync <command>", "browser-sync command");

/**
 *
 * 'Compile' command
 *
 */
const compile = program
  .command("compile")
  .alias("c")
  .alias("build")
  .alias("b")
  .description("compile templates to html");

/**
 *
 * 'compile dev' command
 *
 */
compile
  .command("dev", { isDefault: true })
  .description("compile templates to html")
  .argument("[glob]", "comma separated list of globs", glob => glob.split(","))
  .action(async (glob: string[], options) => {
    const settings = await compileSettings(options, "dev");

    if (glob && glob.length > 0) {
      // overwrite settings with options
      settings.inputFiles = glob;
    }

    await maybeDeleteOutDir(settings);
    await makeNecessaryDirs(settings);

    const runtime = await compileRuntimeConfig(settings);
    runtime.env = "dev";

    if (settings.watch || _.isUndefined(settings.watch)) {
      // watch files (by default)
      watchFiles(settings, runtime);
    } else {
      // compile all files once
      await compileFiles(settings, runtime);
    }

    // compile the welcome page
    await compileWelcomePage(settings, runtime);

    // browser-sync (by default)
    if (settings.browserSync || _.isUndefined(settings.browserSync)) {
      // set default browser-sync options
      if (_.isUndefined(settings.browserSync?.watch)) {
        settings.browserSync = {
          watch: true,
          startPath: "__.html",
        };
      }
      browserSync.init({
        server: settings.outDir,
        watch: settings.browserSync?.watch || _.isUndefined(settings.browserSync?.watch), // watch for changes as long as the user hasn't specified not to
        ...(settings.browserSync || {}),
        // TODO: options like --browser-sync "start --server example/dist"???
      });
    }
  });

/**
 *
 * 'compile prod' command
 *
 */
compile
  .command("prod")
  .description("compile templates to html, minify, inline css, etc.")
  .argument("[glob]", "comma separated list of globs", glob => glob.split(","))
  .action(async (glob: string[], options) => {
    const settings = await compileSettings(options, "prod");

    if (glob && glob.length > 0) {
      // overwrite settings with options
      settings.inputFiles = glob;
    }

    await maybeDeleteOutDir(settings);
    await makeNecessaryDirs(settings);

    const runtime = await compileRuntimeConfig(settings);
    runtime.env = "prod";

    if (settings.watch) {
      // watch for changes only if the user has specified to
      watchFiles(settings, runtime);
    } else {
      // compile all files once
      await compileFiles(settings, runtime);
    }

    // browser-sync
    if (settings.browserSync) {
      // compile the welcome page if we're using browser-sync
      await compileWelcomePage(settings, runtime);

      browserSync.init({
        server: settings.outDir,
        watch: settings.browserSync.watch, // watch for changes only if the user has specified to
        ...settings.browserSync,
        // TODO: options like --browser-sync "start --server example/dist"
      });
    }
  });

/**
 *
 * run the program
 *
 */
await program.parseAsync(process.argv);

/**
 *
 * Functions
 *
 */

/**
 * Compile the welcome page
 *
 * @param settings
 * @param runtime
 */
async function compileWelcomePage(settings: Settings, runtime: RunTimeConfig) {
  const files = _.flatten(Object.values(runtime.files).map(files => files.map(file => `${file.outputPath}`)))
    .filter(file => path.extname(file) === ".html")
    .map(file => {
      // TODO: replace this with the actual browser-sync base?
      return file.replace(settings.outDir, "");
    });

  // setup the welcome page
  // create the welcome file
  const welcomeFileName = "__";
  const welcomeFile: RunTimeFile = {
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
  await $`mkdir -p ${path.dirname(welcomeFile.inputPath)}`;

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
function maybeDeleteOutDir(settings: Settings) {
  if (settings.options?.deleteOutDir) {
    $`rm -rf ${settings.outDir}`;
  }
}

/**
 * Make the necessary directories
 *
 * @param settings
 */
function makeNecessaryDirs(settings: Settings) {
  $`mkdir -p ${settings.srcDir}`;
  $`mkdir -p ${settings.outDir}`;
}

/**
 * Watch the files for changes
 *
 * @param settings
 * @param runtime
 */
async function watchFiles(settings: Settings, runtime: RunTimeConfig) {
  const watcher = watch(Object.keys(runtime.files), { ignoreInitial: true });

  watcher.on("ready", async () => {
    await compileFiles(settings, runtime);
  });

  watcher.on("add", async path => {
    const files = runtime.files[path];
    await compileFiles(settings, runtime, files);
  });

  watcher.on("change", async path => {
    const files = runtime.files[path];
    await compileFiles(settings, runtime, files);
  });
}

/**
 * Compile the files
 *  if files is undefined, then compile all files in runtime.files
 *
 * @param settings
 * @param runtime
 * @param files
 */
async function compileFiles(settings: Settings, runtime: RunTimeConfig, files?: RunTimeFile[]) {
  files = files || _.flatten(Object.values(runtime.files));
  // note: files is plural because there can be multiple output files
  for (const file of files) {
    // TODO: define supported input types
    if (["html", "mjml"].includes(file.inputType)) {
      // compile the handlebars template
      const templateOutput = await compileHandlebars(settings, file);

      // compile the mjml template
      const htmlOutput = await mjml2Html(templateOutput, {
        minify: runtime.env === "prod",
        keepComments: false,
      });

      // this makes any nested directories that don't exist
      await $`mkdir -p ${path.dirname(file.outputPath)}`;

      // write the output file
      await fs.writeFile(file.outputPath, htmlOutput.html);

      console.log(chalk.green(`${file.inputPath} -> ${file.outputPath} - file compiled successfully.`));
    } else {
      // just copy the file

      // this makes any nested directories that don't exist
      await $`mkdir -p ${path.dirname(file.outputPath)}`;

      // copy the file
      await $`cp ${file.inputPath} ${file.outputPath}`;
    }
  }
}

/**
 * Compile the handlebars template
 *
 * @param settings
 * @param file
 * @returns
 */
async function compileHandlebars(settings: Settings, file: RunTimeFile) {
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
