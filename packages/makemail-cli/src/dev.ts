import { $, argv, chalk, fs, glob, path, within } from "zx";
import { watch } from "chokidar";
import mjml2Html from "mjml";
import { awesome, compileHandlebars } from "@makemail/core";
import { CLIConfig } from "./@types/types.js";
import { writeFile } from "fs/promises";

async function compile(inputFile: string, config: CLIConfig) {
  // if file is the defaultFileName, then attach files the necessary files config
  if (inputFile == `${config.dirs.templates}/${config._defaultIndexFile.replace(".html", ".mjml")}`) {
    const files = await glob(`${config.dirs.output}/**/*.html`);
    config.files = files.map(file => file.replace(`${config.dirs.output}/`, ""));
  }

  // compile the handlebars template
  const templateOutput = await compileHandlebars(
    inputFile,
    {
      files: config.files,
      ...config.handlebars?.context,
    },
    {
      ...config.handlebars?.options,
    },
  );

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
  await $`mkdir -p ${parents}`;
  await writeFile(outputFile, htmlOutput.html);

  console.log(chalk.green(`${inputFile} -> ${outputFile} - file compiled successfully.`));
}

export default async function (config: CLIConfig) {
  awesome();
  /**
   * Setup watch
   */

  if (config.watch.length > 0) {
    within(async function () {
      console.log(chalk.yellow("Configuring watch..."));
      for (const globPath of config.watch) {
        const watcher = watch(globPath, { ignoreInitial: true });

        watcher.on("ready", async () => {
          console.log("Initial scan complete. Ready for changes");

          const files = await glob(`${config.dirs.templates}/**/*.mjml`);

          // compile all files
          files.forEach(async file => {
            await compile(file, config);
          });
        });

        watcher.on("add", async path => {
          console.log(`File ${path} has been added`);

          await compile(path, config);
        });

        watcher.on("change", async path => {
          console.log(`File ${path} has been changed`);

          await compile(path, config);
        });
      }

      // const watcher = watch(`${config.dirs.in}/**/*.mjml`, {
      //   ignoreInitial: true,
      // });

      // const imageWatcher = watch(`${config.dirs.assets}/**/*.{jpg,jpeg,png,gif}`, {
      //   ignoreInitial: true,
      // });

      // imageWatcher.on("add", async (path) => {
      //   console.log(`File ${path} has been added`);
      //   await copyAssets(config);
      // });
    });
  } else {
    console.log(chalk.yellow("No watch configured."));

    // do everything once
  }

  /**
   * Setup browser-sync
   */
  if (config.browserSync) {
    console.log(chalk.yellow("Configuring browser-sync..."));
    // const { stdout } = await $`browser-sync start --server ${config.dirs.output}`;

    await $`./node_modules/.bin/browser-sync ${config.dirs.output} -w --startPath ${config._defaultIndexFile} ${
      config.browserSync.open ? "" : "--no-open"
    }`;
  }
}
