import { readFile } from "fs/promises";
import { parseFrontMatter } from "./utils.js";
import handlebars from "handlebars";
import { Config } from "./@types/types.js";

/**
 *
 * Handlebars
 *
 */

export async function compileHandlebars(inputFile: string, context = {}, options = {}) {
  // get the file contents
  const contents = await readFile(inputFile, "utf8");

  // get front matter context
  const frontMatterContext = await parseFrontMatter(contents);

  // merge the context from the front matter with the context passed in
  Object.assign(context, frontMatterContext.context);

  // register i18n helper
  handlebars.registerHelper("t", function (...locales) {
    for (const locale of locales) {
      // the order is defined in the yaml front matter
      // TODO: or the global context
    }
  });

  //  compile the template
  const template = handlebars.compile(contents);

  return template(context, options);
}
