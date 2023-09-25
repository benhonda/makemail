import { YAML, chalk, fs, glob, path } from "zx";
import _ from "lodash";
import { DEFAULT_LOCALE, defaultSettings } from "../cli.js";
import matter from "gray-matter";
import { parseEnvBoolWithArgv } from "./utils.js";
import { S3Client } from "@aws-sdk/client-s3";
async function getSettingsFile(settings, globs) {
    if (!globs)
        return undefined;
    // get the first file that matches the glob
    const settingsFile = (await glob(globs, {
        ignoreFiles: ".makemailignore",
        ignore: [...(settings.ignoreFiles || [])],
    }))?.[0];
    // if the file exists, load it
    if (await fs.exists(settingsFile)) {
        // JSON
        if (path.extname(settingsFile) === ".json") {
            return JSON.parse(await fs.readFile(settingsFile, "utf8"));
        }
        // YAML
        if ([".yml", ".yaml"].includes(path.extname(settingsFile))) {
            return YAML.parse(await fs.readFile(settingsFile, "utf8"));
        }
        throw new Error(`Settings file must be JSON or YAML`);
    }
    return undefined;
}
export async function compileSettings(opts, env) {
    const definedSettings = async () => {
        // if options.settings, load settings from file and merge with default settings
        let settings = await getSettingsFile(defaultSettings, opts.settings);
        if (settings)
            return { ...defaultSettings, ...settings };
        // else, look for named makemail settings file in the root directory and merge with default settings
        settings = await getSettingsFile(defaultSettings, env === "prod" ? "makemail.prod.{json,yml,yaml}" : ["makemail.dev.{json,yml,yaml}", "makemail.{json,yml,yaml}"]);
        if (settings)
            return { ...defaultSettings, ...settings };
        // else, just use default settings
        return defaultSettings;
    };
    const userSettings = await definedSettings();
    const settings = {
        ...userSettings,
        // overwrite settings with command line options
        // or use the default settings (parsed to booleans) if the option is not defined
        options: {
            ...defaultSettings.options,
            deleteOutDir: parseEnvBoolWithArgv(userSettings.options?.deleteOutDir, opts.deleteOutDir, env),
            omitDefaultLocaleFromFileName: parseEnvBoolWithArgv(userSettings.options?.omitDefaultLocaleFromFileName, opts.omitDefaultLocaleFromFileName, env),
        },
        verbose: parseEnvBoolWithArgv(userSettings.verbose, opts.verbose, env),
        watch: parseEnvBoolWithArgv(userSettings.watch, opts.watch, env),
        browserSync: parseEnvBoolWithArgv(userSettings.browserSync, opts.browserSync, env),
        uploadFilesAndAssets: parseEnvBoolWithArgv(userSettings.uploadFilesAndAssets, opts.upload, env),
        forceUploadFilesAndAssets: parseEnvBoolWithArgv(userSettings.forceUploadFilesAndAssets, opts.forceUpload, env),
    };
    // browserSync settings
    if (settings.browserSync) {
        settings.browserSyncOptions = {
            ...(settings.browserSyncOptions || {}),
            ...(userSettings.browserSyncOptions || {}),
            port: opts.port || settings.browserSyncOptions?.port || 3000,
            open: !_.isUndefined(opts.noOpen) ? !opts.noOpen : settings.browserSyncOptions?.open || false,
            startPath: opts.startPath || settings.browserSyncOptions?.startPath || "/",
        };
    }
    // prep s3 settings
    if (settings.uploadFilesAndAssets || settings.forceUploadFilesAndAssets) {
        const bucket = opts.bucket || settings.s3?.bucket || process.env.AWS_DEFAULT_BUCKET;
        const region = opts.region || settings.s3?.region || process.env.AWS_DEFAULT_REGION;
        if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
            console.log(chalk.red("No AWS credentials found. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY."));
            return process.exit(1);
        }
        if (!bucket) {
            console.log(chalk.red("No S3 bucket found. Either set s3.bucket in settings or AWS_DEFAULT_BUCKET in your environment."));
            return process.exit(1);
        }
        if (!region) {
            console.log(chalk.red("No S3 region found. Either set s3.region in settings or AWS_DEFAULT_REGION in your environment."));
            return process.exit(1);
        }
        settings.s3 = {
            ...(settings.s3 || {}),
            bucket,
            region,
            client: new S3Client({ region }),
        };
    }
    return settings;
}
export async function compileRuntimeConfig(settings, env) {
    // get all files
    const runtime = {
        files: {},
        env,
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
        const outputType = ["html", "mjml"].includes(inputType) ? "html" : inputType;
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
                // if it's the first locale, use the original file name, else append the locale
                const outputPath = i === 0 && settings.options?.omitDefaultLocaleFromFileName
                    ? file.outputPath.replace(`.${inputType}`, `.${outputType}`)
                    : `${path.dirname(file.outputPath)}/${path.basename(file.outputPath, path.extname(file.outputPath))}_${locale}.${outputType}`;
                const handlebars = {
                    context: {
                        ...(settings.handlebars?.context || {}),
                        ...(frontmatter.handlebars?.context || {}),
                    },
                    options: {
                        ...(settings.handlebars?.options || {}),
                        ...(frontmatter.handlebars?.options || {}),
                    },
                };
                if (env === "prod") {
                    if (settings.s3) {
                        // add the s3 url to the handlebars context
                        handlebars.context[settings.options.viewInBrowserTag] = `https://${settings.s3.bucket}.s3.${settings.s3.region}.amazonaws.com/${path.basename(outputPath)}}`;
                    }
                    // TODO: maybe add other object storage providers
                }
                const fileSettings = {
                    outputPath,
                    locales,
                    locale,
                    handlebars,
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