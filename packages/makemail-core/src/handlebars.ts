// import matter from "gray-matter";
// import handlebars from "handlebars";

/**
 *
 * Handlebars
 *
 */

export async function compileHandlebars() {
  console.log("compileHandlebars");
  console.log("compileHandlebars");
  console.log("compileHandlebars");
  console.log("compileHandlebars");
  console.log("compileHandlebars");
}

// async function getContextFromFrontMatter(file: string) {
//   const frontMatter = matter(await getFileContents(file));
//   return frontMatter?.data?.context;
// }

// export async function compileHandlebars(inputFile: string) {
//   // get the file contents
//   const contents = await getFileContents(file);

//   // get front matter context
//   const frontMatterContext = (await getContextFromFrontMatter(file)) || {};
//   // merge the context from the front matter with the context passed in
//   Object.assign(context, frontMatterContext);

//   // register i18n helper
//   handlebars.registerHelper("t", function (...locales) {
//     for (const locale of locales) {
//       // the order is defined in the yaml front matter
//       // TODO: or the global context

//     }
//   });

//   const template = handlebars.compile(contents);

//   return template(context, options);
// }
