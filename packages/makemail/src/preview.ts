import { $, argv, chalk, fs, glob, path, spinner, within } from "zx";
import { watch } from "chokidar";
import mjml2Html from "mjml";
import _ from "lodash";
import { CLIConfig } from "./@types/types.js";
import { writeFile } from "fs/promises";
import { uploadAndReplaceAssetsInFile, uploadToS3 } from "./helpers/s3.js";
import { parseFrontMatterFromFile, parseLocaleFileName, setLocalesInFrontmatterToConfig } from "./helpers/utils.js";
import { compileHandlebars } from "./helpers/handlebars.js";

async function compile(inputFile: string, config: CLIConfig) {
  const locales = await setLocalesInFrontmatterToConfig(config, inputFile);
  const urls = [];

  for (const locale of locales) {
    // once uploaded, the url will be...
    const hostedUrl = config.s3
      ? `https://${config.s3.bucket}.s3.${config.s3.region}.amazonaws.com/${parseLocaleFileName(
          config,
          inputFile,
          locale,
        )}`
      : "#";

    // compile the handlebars template
    config.handlebars = {
      options: {},
      context: {
        ...config.handlebars?.context,
        [config.emailUrlTagName]: hostedUrl,
        locale: locale,
      },
    };

    const templateOutput = await compileHandlebars(config, inputFile, locales);

    let withAssets = templateOutput;
    // go in and replace
    if (config.s3) {
      withAssets = await uploadAndReplaceAssetsInFile(config, inputFile, templateOutput);
    }

    // compile the mjml template
    const htmlOutput = await mjml2Html(withAssets, {
      keepComments: false,
    });

    // write the output file
    const outputFile = `${inputFile.replace(config.dirs.templates, config.dirs.output)}/${parseLocaleFileName(
      config,
      inputFile,
      locale,
    )}`;
    const parents = path.dirname(outputFile);

    // this makes any nested directories that don't exist
    await $`mkdir -p ${parents}`;
    await writeFile(outputFile, htmlOutput.html);

    // upload the file to s3
    if (config.s3) {
      const s3Url = await uploadToS3(path.basename(outputFile), outputFile, config.s3.bucket, config.s3.region);
      urls.push(s3Url);
    }

    // console.log(chalk.green(`${inputFile} -> ${outputFile} - file compiled successfully.`));
  }

  return urls;
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
    const urls = await spinner("Compiling...", async () => {
      return await compileFile(config, `${config.preview}`);
    });

    console.log(chalk.yellowBright("Compiled"));
    console.log(chalk.greenBright(`Preview at ${urls}`));

    /**
     * Setup browser-sync
     */
    if (config.browserSync) {
      console.log(chalk.yellow("Configuring browser-sync..."));
      // TODO: this may not always be in config.dirs.templates...
      const outputFile = `${config.preview.replace(config.dirs.templates, "")}/${parseLocaleFileName(
        config,
        config.preview,
        config.locales[0],
      )}`;

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
    return await compile(path, config);
  }
}
