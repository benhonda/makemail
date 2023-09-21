import { readFile } from "fs/promises";
import matter from "gray-matter";
import _ from "lodash";
import path from "path";
// const RESERVED_FILE_NAMES = ["_config"];
export async function parseFrontMatter(contents) {
    return matter(contents)?.data || {};
}
export async function parseFrontMatterFromFile(inputFile) {
    return matter(await readFile(inputFile, "utf8"))?.data || {};
}
export async function setLocalesInFrontmatterToConfig(config, file) {
    // set locales
    const fm = await parseFrontMatterFromFile(file);
    // set locales
    return _.isArray(fm.locales) ? fm.locales : config.locales;
}
export function parseLocaleFileName(config, file, locale) {
    const fileExtension = path.extname(file);
    const fileName = path.basename(file, fileExtension);
    // if file is the defaultFileName...
    if (file === config._defaultIndexFile) {
        return `${fileName}.html`;
    }
    // if config.ignoreDefaultLocale is true, then don't add the locale to the file name
    if (config.ignoreDefaultLocale && locale === config.locales[0]) {
        return `${fileName}.html`;
    }
    return `${fileName}_${locale}.html`;
}
//# sourceMappingURL=utils.js.map