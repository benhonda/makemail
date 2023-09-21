#! ./node_modules/.bin/ts-node-esm
import { $, fs } from "zx";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
export async function uploadToS3(filename, filepath, bucket, region) {
    const client = new S3Client({ region: region || process.env.AWS_DEFAULT_REGION });
    const getContentType = await $ `file --mime-type ${filepath} | cut -d' ' -f2`;
    const contentType = getContentType.stdout.trim();
    const command = new PutObjectCommand({
        Bucket: bucket,
        Key: filename,
        Body: fs.readFileSync(filepath),
        ContentType: contentType,
        // ACL: "public-read",
    });
    client.send(command);
    return `https://${bucket}.s3.${region}.amazonaws.com/${filename}`;
}
//# sourceMappingURL=s3.js.map