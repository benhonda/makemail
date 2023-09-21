import { compileHandlebars } from "./handlebars.js";
import { uploadToS3 } from "./s3.js";
import { parseFrontMatter, parseFrontMatterFromFile } from "./utils.js";

export function awesome() {
  console.log("I am awesome!");
}

// export functions
export { compileHandlebars, parseFrontMatter, parseFrontMatterFromFile, uploadToS3 };

// export types
export * from "./@types/types.js";
