import { compileHandlebars } from "./handlebars.js";
import { parseFrontMatter } from "./utils.js";

export function awesome() {
  console.log("I am awesome!");
}

// export functions
export { compileHandlebars, parseFrontMatter };

// export types
export * from "./@types/types.js";
