import { fs, glob, path } from "zx";
import _ from "lodash";
import { DEFAULT_LOCALE, defaultSettings } from "../cli.js";
import matter from "gray-matter";
const USER_SETTINGS_FILE = "makemail.{json,yml,yaml}";
export async function compileSettings(opts) {
    const definedSettings = async () => {
        // if options.settings, load settings from file and merge with default settings
        if (await fs.exists(opts.settings)) {
            const _settings = await glob(opts.settings);
            return {
                ...defaultSettings,
                ...JSON.parse(await fs.readFile(_settings[0], "utf8")),
            };
        }
        // else, look for makemail.{} in the root directory and merge with default settings
        const userSettingsFile = await glob(USER_SETTINGS_FILE);
        if (userSettingsFile.length > 0) {
            return {
                ...defaultSettings,
                ...JSON.parse(await fs.readFile(userSettingsFile[0], "utf8")),
            };
        }
        // else, just use default settings
        return defaultSettings;
    };
    const settings = await definedSettings();
    // overwrite settings with options
    // overwrite settings with options
    // if (opts.preview) {
    //   settings.preview = opts.preview;
    // }
    // if (opts.templates) {
    //   settings.dirs.templates = opts.templates;
    // }
    // if (opts.assets) {
    //   settings.dirs.assets = opts.assets;
    // }
    // if (opts.output) {
    //   settings.dirs.output = opts.output;
    // }
    // if (opts.watch) {
    //   settings.watch = opts.watch;
    // }
    // if (opts.browserSync) {
    //   settings.browserSync = {
    //     open: opts.browserSync === "no-open" ? false : true,
    //   };
    // }
    return settings;
}
export async function compileRuntimeConfig(settings) {
    // get all files
    const runtime = {
        files: {},
    };
    // list all the input files
    const inputFiles = [];
    // uses the inputFiles option if it exists, otherwise uses the srcDir
    const inputGlobList = _.isArray(settings.inputFiles) ? settings.inputFiles : [settings.inputFiles || settings.srcDir];
    inputFiles.push(...(await glob(inputGlobList, {
        ignoreFiles: ".makemailignore",
        ignore: [...(settings.ignoreFiles || []), "**/__.mjml"],
    })));
    // loop through the files and add them to the runtime config
    for (const inputFile of inputFiles) {
        // input type
        const inputType = path.extname(inputFile).replace(".", "");
        const outputType = "html";
        // get the output file path, which may not exist yet
        // REQUIRES that the input file is in the srcDir
        // TODO: this could have unwanted effects if file names match directories etc.
        const outputPath = inputFile.replace(settings.srcDir, settings.outDir);
        // create the file object
        const file = {
            inputPath: inputFile,
            outputPath: outputPath,
            inputType: inputType,
            outputType: outputType,
            locales: settings.locales,
            locale: DEFAULT_LOCALE,
        };
        // if the inputFile is a template...
        if (["html", "mjml"].includes(inputType)) {
            // load file-specific settings from frontmatter, else use settings from settings file
            const fileContents = await fs.readFile(inputFile, "utf8");
            const frontmatter = matter(fileContents)?.data || {};
            const locales = frontmatter.locales || settings.locales;
            // create a file for each locale
            // loop with index
            for (const [i, locale] of locales.entries()) {
                const fileSettings = {
                    // if it's the first file, use the original file name, else append the locale
                    outputPath: i === 0 && settings.options?.omitDefaultLocaleFromFileName
                        ? file.outputPath.replace(`.${inputType}`, `.${outputType}`)
                        : `${file.outputPath.replace(path.extname(file.outputPath), "")}_${locale}.${outputType}`,
                    locales,
                    locale,
                    handlebars: frontmatter.handlebars || settings.handlebars,
                };
                // new file object to avoid mutating the original and causing bugs
                const _file = {
                    ...file,
                    ...fileSettings,
                };
                // add the file to the runtime config
                if (runtime.files[inputFile]) {
                    runtime.files[inputFile].push(_file);
                }
                else {
                    runtime.files[inputFile] = [_file];
                }
            }
        }
        else {
            // if the inputFile is an asset...
            /**
             *
             * add the file to the runtime config
             *
             */
            if (runtime.files[inputFile]) {
                runtime.files[inputFile].push(file);
            }
            else {
                runtime.files[inputFile] = [file];
            }
        }
    }
    return runtime;
}
// in: example/src/templates/123.mjml
// out: dist
// compiled: dist/templates/123.mjml
// in: example/src/templates/123.mjml
// out: example/gain/fling/dist
// compiled: example/gain/fling/dist/templates/123.mjml
// in: example/bring/src/templates/123.mjml
// out: example/gain/fling/dist/
// compiled: example/gain/fling/dist/src/templates/123.mjml
// in: example/bring/src/assets/hello.jpg
// out: example/gain/fling/dist/
// compiled: example/gain/fling/dist/src/assets/hello.jpg
// so it compares the input and output:
//  from the input dir, removes the parts of the path that are the same
//  then adds the output dir
//# sourceMappingURL=commander.js.map