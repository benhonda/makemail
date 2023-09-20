import { $, chalk, within } from "zx";
import { watch } from "chokidar";
import { awesome } from "@makemail/core";
export default async function (config) {
    awesome();
    /**
     * Setup watch
     */
    if (config.watch.length > 0) {
        within(async function () {
            console.log(chalk.yellow("Configuring watch..."));
            for (const glob of config.watch) {
                const watcher = watch(glob, { ignoreInitial: true });
                watcher.on("ready", async () => {
                    console.log("Initial scan complete. Ready for changes");
                });
                watcher.on("add", path => {
                    console.log(`File ${path} has been added`);
                });
                watcher.on("change", async (path) => {
                    console.log(`File ${path} has been changed`);
                });
            }
            // const watcher = watch(`${config.dirs.in}/**/*.mjml`, {
            //   ignoreInitial: true,
            // });
            // const imageWatcher = watch(`${config.dirs.assets}/**/*.{jpg,jpeg,png,gif}`, {
            //   ignoreInitial: true,
            // });
            // watcher.on("ready", async () => {
            //   console.log("Initial scan complete. Ready for changes");
            //   const { stdout } = await $`find ${config.dirs.in} -type f -name "*.mjml"`;
            //   const files = stdout.split("\n").filter((file) => file !== "");
            //   // copy assets
            //   await copyAssets(config);
            //   // compile all files
            //   files.forEach(async (file) => {
            //     await compileFile(config, file);
            //   });
            // });
            // watcher.on("add", (path) => {
            //   console.log(`File ${path} has been added`);
            // });
            // watcher.on("change", async (path) => {
            //   console.log(`File ${path} has been changed`);
            //   await compileFile(config, path);
            // });
            // imageWatcher.on("add", async (path) => {
            //   console.log(`File ${path} has been added`);
            //   await copyAssets(config);
            // });
        });
    }
    else {
        console.log(chalk.yellow("No watch configured."));
        // do everything once
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
//# sourceMappingURL=dev.js.map