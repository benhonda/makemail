import { $, chalk, glob, path } from "zx";
import { watch } from "chokidar";
import mjml2Html from "mjml";
import { compileHandlebars } from "@makemail/core";
import { writeFile } from "fs/promises";
async function compile(inputFile, config) {
    // if file is the defaultFileName, then attach files the necessary files config
    if (inputFile == `${config.dirs.templates}/${config._defaultIndexFile.replace(".html", ".mjml")}`) {
        const files = await glob(`${config.dirs.output}/**/*.html`);
        config.files = files.map(file => file.replace(`${config.dirs.output}/`, ""));
    }
    // compile the handlebars template
    const templateOutput = await compileHandlebars(inputFile, {
        files: config.files,
        ...config.handlebars?.context,
    }, {
        ...config.handlebars?.options,
    });
    // compile the mjml template
    const htmlOutput = await mjml2Html(templateOutput, {
        // minify: true,
        keepComments: false,
    });
    // write the output file
    const outputFile = inputFile.replace(config.dirs.templates, config.dirs.output).replace(".mjml", ".html");
    // const outputFilePath = await writeHTMLToFile(config, outputFile, htmlOutput.html);
    const parents = path.dirname(outputFile);
    // this makes any nested directories that don't exist
    await $ `mkdir -p ${parents}`;
    await writeFile(outputFile, htmlOutput.html);
    console.log(chalk.green(`${inputFile} -> ${outputFile} - file compiled successfully.`));
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
                files.forEach(async (path) => {
                    await compileFile(config, path);
                });
            });
            watcher.on("add", async (path) => {
                console.log(`File ${path} has been added`);
                // check if path is in assets
                await compileFile(config, path);
            });
            watcher.on("change", async (path) => {
                console.log(`File ${path} has been changed`);
                await compileFile(config, path);
            });
        }
        else {
            // READ
            // do everything once
            const files = await glob(globPath);
            // compile all files
            files.forEach(async (path) => {
                await compileFile(config, path);
            });
        }
    }
    /**
     * Setup browser-sync
     */
    if (config.browserSync) {
        console.log(chalk.yellow("Configuring browser-sync..."));
        // const { stdout } = await $`browser-sync start --server ${config.dirs.output}`;
        await $ `./node_modules/.bin/browser-sync ${config.dirs.output} -w --startPath ${config._defaultIndexFile} ${config.browserSync.open ? "" : "--no-open"}`;
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