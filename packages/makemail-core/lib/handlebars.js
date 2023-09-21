import { readFile } from "fs/promises";
import { parseFrontMatter } from "./utils.js";
import handlebars from "handlebars";
/**
 *
 * Handlebars
 *
 */
export async function compileHandlebars(inputFile, context = { locales: ["en"], locale: "en" }, options = {}) {
    // get the file contents
    const contents = await readFile(inputFile, "utf8");
    // get front matter context
    const frontMatterContext = await parseFrontMatter(contents);
    // merge the context from the front matter with the context passed in
    Object.assign(context, frontMatterContext.context);
    // register i18n helper
    handlebars.registerHelper("t", function (...text) {
        // find with text index is the locale
        const indexOfLocale = context.locales.indexOf(context.locale);
        // find the locale from context in locales
        // const loc = locales.find(locale => context.locale == locale);
        if (indexOfLocale > -1 && text[indexOfLocale]) {
            return text[indexOfLocale];
        }
        return text[0];
    });
    //  compile the template
    const template = handlebars.compile(contents);
    return template(context, options);
}
//# sourceMappingURL=handlebars.js.map