import { chalk, path } from "zx";
import { CLIConfig } from "../@types/types.js";
import { parse as parseHtml } from "node-html-parser";
import { uploadToS3 } from "@makemail/core";

export async function uploadAndReplaceAssetsInFile(config: CLIConfig, file: string, html: string) {
  // handle assets
  try {
    const { region, bucket } = getAwsConfig(config);

    const root = parseHtml(html);

    const imgSrcs = root
      .querySelectorAll("mj-image")
      .map(img => img.getAttribute("src"))
      .filter(src => {
        // check if the src is a local file
        return src && !src.startsWith("http");
      });

    // const client = new S3Client();

    // TODO: maybe create a bucket
    // const command = new CreateBucketCommand({
    //   Bucket: "mjml-preview",
    //   // ACL: "public-read",
    //   // ObjectOwnership: "BucketOwnerPreferred",
    // });
    // const response = await client.send(command);

    // delete the public access block
    // const deletePublicAccessBlockCommand = new DeletePublicAccessBlockCommand({
    //   Bucket: "mjml-preview",
    // });
    // const deletePublicAccessBlockResponse = await client.send(deletePublicAccessBlockCommand);

    for (const src of imgSrcs) {
      if (!src) continue;

      let assetFile = "";

      try {
        assetFile = path.resolve(path.dirname(file), src);
        const assetFileName = path.basename(assetFile);

        // upload the file
        const s3Url = await uploadToS3(assetFileName, assetFile, bucket, region);

        // now replace the src with the S3 url
        html = html.replaceAll(src, s3Url);
      } catch (error) {
        console.log(chalk.red(`${file} - Failed to upload ${assetFile}.`));
        console.log(error);
      }
    }
  } catch (error) {
    console.log(chalk.red(`${file} - assets failed to compile.`));
    console.log(error);
  }

  return html;
}

function getAwsConfig(config: CLIConfig) {
  const { bucket, region } = config.s3 || {};

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error("No AWS credentials found. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.");
  }

  if (!bucket) {
    throw new Error("No S3 bucket found. Set config.s3.bucket.");
  }

  if (!region && !process.env.AWS_DEFAULT_REGION) {
    throw new Error("No S3 region found. Either set config.s3.region or AWS_DEFAULT_REGION.");
  }

  return {
    bucket,
    region: region || process.env.AWS_DEFAULT_REGION,
  };
}
