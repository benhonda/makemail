import { $, chalk, glob, path } from "zx";
import { watch } from "chokidar";
import mjml2Html from "mjml";
import { writeFile } from "fs/promises";
import { compileHandlebars } from "./helpers/handlebars.js";
import { parseLocaleFileName, setLocalesInFrontmatterToConfig } from "./helpers/utils.js";
async function compile(inputFile, config) {
    const locales = await setLocalesInFrontmatterToConfig(config, inputFile);
    for (const locale of locales) {
        console.log(chalk.yellow(`Compiling ${inputFile} (${locale})...`));
        // if file is the defaultFileName, then attach files the necessary files config
        if (inputFile == config._defaultIndexFile) {
            const files = await glob(`${config.dirs.output}/**/*.html`);
            config.files = files.map(file => file.replace(`${config.dirs.output}/`, ""));
        }
        config.handlebars = {
            options: {},
            context: {
                ...config.handlebars?.context,
                files: config.files,
                locale: locale,
            },
        };
        // compile the handlebars template
        const templateOutput = await compileHandlebars(config, inputFile, locales);
        // compile the mjml template
        const htmlOutput = await mjml2Html(templateOutput, {
            // minify: true,
            keepComments: false,
        });
        // write the output file
        const parents = path.dirname(inputFile.replace(config.dirs.templates, config.dirs.output));
        const outputFile = `${parents}/${parseLocaleFileName(config, inputFile, locale)}`;
        // const parents = path.dirname(outputFile);
        // this makes any nested directories that don't exist
        await $ `mkdir -p ${parents}`;
        await writeFile(outputFile, htmlOutput.html);
        console.log(chalk.green(`${inputFile} -> ${outputFile} - file compiled successfully.`));
    }
}
async function compileAsset(file, config) {
    console.log(chalk.yellow("Copying assets..."));
    // get the last path segment from config.dirs.assets
    const assetRootDir = path.basename(config.dirs.assets); // usually 'assets'
    // get everything after the assets directory (including the assets directory)
    const assetPath = file.replace(config.dirs.assets, assetRootDir);
    // create the output directory
    const outputFile = `${config.dirs.output}/${assetPath}`;
    // this makes any nested directories that don't exist
    await $ `mkdir -p ${path.dirname(outputFile)}`;
    // copy the file
    await $ `cp  ${file} ${outputFile}`;
}
export default async function (config) {
    /**
     * Setup
     */
    await watchOrRead(config);
    /**
     * Setup browser-sync
     */
    if (config.browserSync) {
        console.log(chalk.yellow("Configuring browser-sync..."));
        // const { stdout } = await $`browser-sync start --server ${config.dirs.output}`;
        await $ `./node_modules/.bin/browser-sync ${config.dirs.output} -w --startPath ${parseLocaleFileName(config, config._defaultIndexFile, "en")} ${config.browserSync.open ? "" : "--no-open"}`;
    }
}
async function watchOrRead(config) {
    const isWatch = config.watch.length > 0;
    const isRead = config.read.length > 0;
    const defaultGlobPaths = [`${config.dirs.templates}/**/*.mjml`, `${config.dirs.assets}/**/*`];
    const globPaths = isWatch ? config.watch : isRead ? config.read : defaultGlobPaths;
    for (let globPath of globPaths) {
        globPath = await getGlobPath(config, globPath);
        if (isWatch) {
            // WATCH
            const watcher = watch(globPath, { ignoreInitial: true });
            watcher.on("ready", async () => {
                console.log("Initial scan complete. Ready for changes");
                const files = await glob(globPath);
                // compile all files
                for (const file of files) {
                    await compileFile(config, file);
                }
                // compile the config
                await compile(config._defaultIndexFile, config);
            });
            watcher.on("add", async (path) => {
                console.log(`File ${path} has been added`);
                // check if path is in assets
                await compileFile(config, path);
                // compile the config
                await compile(config._defaultIndexFile, config);
            });
            watcher.on("change", async (path) => {
                console.log(`File ${path} has been changed`);
                await compileFile(config, path);
                // compile the config
                await compile(config._defaultIndexFile, config);
            });
        }
        else {
            // READ
            // do everything once
            const files = await glob(globPath);
            // compile all files
            for (const file of files) {
                await compileFile(config, file);
            }
            // compile the config
            await compile(config._defaultIndexFile, config);
        }
    }
}
async function compileFile(config, path) {
    // check if path is in assets
    if (path.startsWith(config.dirs.assets)) {
        // copy assets
        await compileAsset(path, config);
    }
    else {
        await compile(path, config);
    }
}
async function getGlobPath(config, globPath) {
    // if globPath is a key in config.dirs, then replace it with the value
    if (Object.keys(config.dirs).includes(globPath)) {
        return `${config.dirs[globPath]}/**/*`;
    }
    return globPath;
}
//# sourceMappingURL=dev.js.map