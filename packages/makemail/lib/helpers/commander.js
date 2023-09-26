import dotenv from "dotenv";
import { YAML, chalk, fs, glob, path } from "zx";
import _ from "lodash";
import { DEFAULT_LOCALE, defaultSettings } from "../cli.js";
import matter from "gray-matter";
import { parseEnvBoolWithArgv } from "./utils.js";
import { S3Client } from "@aws-sdk/client-s3";
async function discoverEnvFiles(settings, globs) {
    // if no globs, return undefined
    if (!globs)
        return undefined;
    // get the first file that matches the glob
    const files = await glob(globs, {
        ignoreFiles: ".makemailignore",
        ignore: [...(settings.ignoreFiles || [])],
    });
    if (files.length === 0)
        return undefined;
    if (files.length > 1) {
        console.log(chalk.red(`Multiple env files found: ${files.join(", ")}. Please specify one using --env-path or set your workspace with \`makemail dev <workspace>.\``));
        return process.exit(1);
    }
    const file = files[0];
    // if the file exists, load it
    if (await fs.exists(file)) {
        return file;
    }
    return undefined;
}
async function getSettingsFile(settings, globs) {
    // if no globs, return undefined
    if (!globs)
        return undefined;
    // get the first file that matches the glob
    const settingsFiles = await glob(globs, {
        ignoreFiles: ".makemailignore",
        ignore: [...(settings.ignoreFiles || [])],
    });
    if (settingsFiles.length === 0)
        return undefined;
    if (settingsFiles.length > 1) {
        console.log(chalk.red(`Multiple settings files found: ${settingsFiles.join(", ")}. Please specify one using --settings or set your workspace with makemail dev <workspace>.`));
        return process.exit(1);
    }
    const settingsFile = settingsFiles[0];
    // if the file exists, load it
    if (await fs.exists(settingsFile)) {
        // JSON
        if (path.extname(settingsFile) === ".json") {
            return {
                data: JSON.parse(await fs.readFile(settingsFile, "utf8")),
                file: settingsFile,
            };
        }
        // YAML
        if ([".yml", ".yaml"].includes(path.extname(settingsFile))) {
            return {
                data: YAML.parse(await fs.readFile(settingsFile, "utf8")),
                file: settingsFile,
            };
        }
        // else, exit with error
        console.log(chalk.red(`Settings file must be JSON or YAML`));
        return process.exit(1);
    }
    return undefined;
}
export async function compileSettings(opts, env, workspace = "**") {
    // strip trailing slash
    workspace = workspace.replace(/\/$/, "");
    // verify workspace is a directory if it is not "**"
    if (workspace !== "**" && !(await fs.stat(workspace)).isDirectory()) {
        console.log(chalk.red(`Workspace ${workspace} is not a directory. If you were trying to specify a file, use the -f flag.`));
        return process.exit(1);
    }
    let envPath = await discoverEnvFiles(defaultSettings, opts.envPath);
    if (!envPath) {
        envPath = await discoverEnvFiles(defaultSettings, `${workspace}/.env`);
    }
    if (envPath) {
        console.log(chalk.yellow(`Using env file: ${envPath}`));
        dotenv.config({
            path: path.resolve(envPath),
        });
    }
    else {
        console.log(chalk.yellow(`No .env file found.`));
    }
    const definedSettings = async () => {
        // if options.settings, load settings from file and merge with default settings
        let settings = await getSettingsFile(defaultSettings, opts.settings);
        if (settings) {
            console.log(chalk.yellow(`Using settings file: ${settings.file}`));
            return { ...defaultSettings, ...settings.data };
        }
        // else, look for named makemail settings file in the root directory and merge with default settings
        settings = await getSettingsFile(defaultSettings, env === "prod" ? `${workspace}/makemail.prod.{json,yml,yaml}` : `${workspace}/makemail.dev.{json,yml,yaml}`);
        if (!settings) {
            // fallback
            settings = await getSettingsFile(defaultSettings, `${workspace}/makemail.{json,yml,yaml}`);
        }
        if (settings) {
            console.log(chalk.yellow(`Using settings file: ${settings.file}`));
            return { ...defaultSettings, ...settings.data };
        }
        // else, exit with error
        console.log(chalk.red("No settings file found. Create a makemail.yml file or run `makemail init`."));
        return process.exit(1);
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
        inputFiles: opts.files || userSettings.inputFiles,
        srcDir: path.resolve(userSettings.baseDir, userSettings.srcDir),
        outDir: path.resolve(userSettings.baseDir, userSettings.outDir),
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
        console.log("Preparing to upload files and assets to S3...");
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
        ignore: [...(settings.ignoreFiles || []), "**/__.mjml", "**/makemail.*"],
    })));
    // loop through the files and add them to the runtime config
    for (const inputFile of inputFiles) {
        // input type
        const inputType = path.extname(inputFile).replace(".", "");
        const outputType = ["html", "mjml"].includes(inputType) ? "html" : inputType;
        // get the output file path, which may not exist yet
        // REQUIRES that the input file is in the srcDir
        const inputFileAfterSrcDir = path.relative(settings.srcDir, inputFile);
        if (inputFileAfterSrcDir.startsWith("..")) {
            console.log(chalk.yellow(`Input file ${inputFile} is not in the src directory ${settings.srcDir}. This may cause unexpected behavior.`));
        }
        const outputPath = path.resolve(settings.outDir, inputFileAfterSrcDir);
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
export async function recompileFrontMatterForFile(runtime, file) {
    // load the file
    const fileContents = await fs.readFile(file.inputPath, "utf8");
    // parse the frontmatter
    const frontmatter = matter(fileContents);
    // if frontmatter exists, add it to the file object
    if (frontmatter.data) {
        runtime.files[file.inputPath]?.forEach(f => {
            f.handlebars = {
                ...f.handlebars,
                context: {
                    ...(f.handlebars?.context || {}),
                    ...(frontmatter.data.handlebars?.context || {}),
                },
                options: {
                    ...(f.handlebars?.options || {}),
                    ...(frontmatter.data.handlebars?.options || {}),
                },
            };
        });
    }
}
//# sourceMappingURL=commander.js.map