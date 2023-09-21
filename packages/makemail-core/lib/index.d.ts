import { compileHandlebars } from "./handlebars.js";
import { uploadToS3 } from "./s3.js";
import { parseFrontMatter, parseFrontMatterFromFile } from "./utils.js";
export declare function awesome(): void;
export { compileHandlebars, parseFrontMatter, parseFrontMatterFromFile, uploadToS3 };
export * from "./@types/types.js";
