import { readFile } from "fs/promises";
import matter from "gray-matter";
export async function parseFrontMatter(contents) {
    return matter(contents)?.data || {};
}
export async function parseFrontMatterFromFile(inputFile) {
    return matter(await readFile(inputFile, "utf8"))?.data || {};
}
//# sourceMappingURL=utils.js.map