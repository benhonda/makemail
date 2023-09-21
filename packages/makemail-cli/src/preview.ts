import { $, argv, chalk, fs, glob, path, within } from "zx";
import { watch } from "chokidar";
import mjml2Html from "mjml";
import _ from "lodash";
import { awesome, compileHandlebars, parseFrontMatterFromFile, uploadToS3 } from "@makemail/core";
import { CLIConfig } from "./@types/types.js";
import { writeFile } from "fs/promises";
import { uploadAndReplaceAssetsInFile } from "./helpers/s3.js";

async function compile(inputFile: string, config: CLIConfig) {
  let locales = config.locales || ["en"];
  const fm = await parseFrontMatterFromFile(inputFile);

  if (fm.locales && _.isArray(fm.locales)) {
    locales = fm.locales;
  }

  for (const locale of locales) {
    // once uploaded, the url will be...
    const hostedUrl = config.s3
      ? `https://${config.s3.bucket}.s3.${config.s3.region}.amazonaws.com/${path
          .basename(inputFile)
          .replace(".mjml", "")}_${locale}.html`
      : "#";

    // compile the handlebars template
    const templateOutput = await compileHandlebars(
      inputFile,
      {
        files: config.files,
        [config.emailUrlTagName]: hostedUrl,
        locales,
        locale,
        ...config.handlebars?.context,
      },
      { ...config.handlebars?.options },
    );

    let withAssets = templateOutput;
    // go in and replace
    if (config.s3) {
      withAssets = await uploadAndReplaceAssetsInFile(config, inputFile, templateOutput);
    }

    // compile the mjml template
    const htmlOutput = await mjml2Html(withAssets, {
      minify: true,
      keepComments: false,
    });

    // write the output file
    const outputFile = `${inputFile
      .replace(config.dirs.templates, config.dirs.output)
      .replace(".mjml", "")}_${locale}.html`;
    const parents = path.dirname(outputFile);

    // this makes any nested directories that don't exist
    await $`mkdir -p ${parents}`;
    await writeFile(outputFile, htmlOutput.html);

    // upload the file to s3
    if (config.s3) {
      const s3Url = await uploadToS3(path.basename(outputFile), outputFile, config.s3.bucket, config.s3.region);

      console.log("s3Url", s3Url);
    }

    console.log(chalk.green(`${inputFile} -> ${outputFile} - file compiled successfully.`));
  }
}

async function compileAsset(file: string, config: CLIConfig) {
  console.log(chalk.yellow("Copying assets..."));
  // get the last path segment from config.dirs.assets
  const assetRootDir = path.basename(config.dirs.assets); // usually 'assets'
  // create the output directory
  const outputDir = `${config.dirs.output}/${assetRootDir}`;

  // this makes any nested directories that don't exist
  await $`mkdir -p ${outputDir}`;

  // copy the file
  await $`cp  ${file} ${outputDir}/${path.basename(file)}`;
}

export default async function (config: CLIConfig) {
  if (config.preview) {
    compileFile(config, config.preview);

    /**
     * Setup browser-sync
     */
    if (config.browserSync) {
      console.log(chalk.yellow("Configuring browser-sync..."));
      // TODO: this may not always be in config.dirs.templates...
      const outputFile = config.preview.replace(config.dirs.templates, "").replace(".mjml", ".html");

      await $`./node_modules/.bin/browser-sync ${config.dirs.output} -w --startPath ${outputFile} ${
        config.browserSync.open ? "" : "--no-open"
      }`;
    }
  }
}

async function compileFile(config: CLIConfig, path: string) {
  // check if path is in assets
  if (path.startsWith(config.dirs.assets)) {
    // copy assets
    await compileAsset(path, config);
  } else {
    await compile(path, config);
  }
}
