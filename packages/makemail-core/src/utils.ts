import { readFile, writeFile } from "fs/promises";
import matter from "gray-matter";

export async function parseFrontMatter(contents: string) {
  return matter(contents)?.data || {};
}

export async function parseFrontMatterFromFile(inputFile: string) {
  return matter(await readFile(inputFile, "utf8"))?.data || {};
}
