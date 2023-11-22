import { $, chalk, fetch, fs, path } from "zx";
import { PutObjectCommand } from "@aws-sdk/client-s3";
export function getS3Url(settings, filePath) {
    return `https://${settings.s3?.bucket}.s3.${settings.s3?.region}.amazonaws.com/${settings.s3?.path}${path.basename(filePath)}`;
}
export async function uploadToS3(settings, filePath) {
    try {
        const getContentType = await $ `file --mime-type ${filePath} | cut -d' ' -f2`;
        const contentType = getContentType.stdout.trim();
        const readFile = await fs.readFile(filePath);
        const command = new PutObjectCommand({
            Bucket: settings.s3?.bucket,
            Key: `${settings.s3?.path}${path.basename(filePath)}`,
            Body: readFile,
            ContentType: contentType,
            // ACL: "public-read",
        });
        await settings.s3?.client?.send(command);
        return getS3Url(settings, filePath);
    }
    catch (error) {
        console.log(chalk.red(`Failed to upload ${filePath}.`));
        if (settings.verbose)
            console.log(error);
    }
    return undefined;
}
export async function existsInS3(settings, filePath) {
    try {
        // check if s3Url exists (simplest way to check if file exists)
        const resp = await fetch(getS3Url(settings, filePath));
        return resp.status > 199 && resp.status < 300;
    }
    catch (error) {
        return false;
    }
}
//# sourceMappingURL=s3.js.map