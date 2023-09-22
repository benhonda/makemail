#!/usr/bin/env node

import { $, argv, chalk, echo, path, question, sleep, spinner } from "zx";

const {
  y,
  _: [run, command, ...args],
} = argv;

if (run?.toLowerCase() === "run") {
  if (command === "help") {
    /**
     * help
     *
     * Create a README.md snippet for the command `makemail --help`
     */
    await help();
  } else if (command === "scripts") {
    /**
     * scripts
     *
     * Create a README.md snippet for all the dev scripts in package.json
     */
    await scripts();
  } else {
    if (command) {
      console.log(chalk.red(`Command \`${command}\` not found`));
    }

    const res = await ques(`Run all? [y/N] `);

    if (res.toLowerCase() === "y") {
      await spinner("Running help", async () => {
        // fake timers - f your ux
        await sleep(500);
        await help();
      });

      console.log(chalk.green("✔ Done help"));

      await spinner("Running scripts", async () => {
        await sleep(1000);
        await scripts();
      });

      console.log(chalk.green("✔ Done scripts"));
    }
  }
} else {
  console.log(chalk.red(`Unknown command: ${run}`));

  console.log(chalk.yellow(`Try:`));
  console.log(chalk.yellow(`  ./repo.mjs run <command>`));
}

/**
 * returns a string that tells you how a README.md snippet was generated
 */
async function tagline() {
  const findThisFile = (await $`find . -name "repo.*"`.quiet()).stdout.trim();
  const returnStr = `${findThisFile} ${run} ${command || ""} ${args.join(" ")}`;
  return `\n# The above was auto-generated by running \`${returnStr.trim()}\``;
}

async function findAndReplace(startStr, endStr, newContentAslist = []) {
  // add tagline
  newContentAslist.push(await tagline());

  const readMeAsList = (await $`cat README.md`.quiet()).stdout.split("\n");

  // replace the content between the lines: "$ makemail --help" and the following "```"
  const startIndex = readMeAsList.findIndex(line => line.includes(startStr));
  const endIndex = readMeAsList.findIndex((line, i) => i > startIndex && line.includes(endStr));

  readMeAsList.splice(startIndex + 1, endIndex - startIndex - 1, ...newContentAslist);

  await $`echo ${readMeAsList.join("\n")} > README.md`.quiet();

  console.log(chalk.green(`Updated README.md`));

  return readMeAsList;
}

async function help() {
  const output = (await $`makemail --help`).stdout.split("\n");
  const replace = await ques("Replace in README.md? [y/N] ");

  if (replace.toLowerCase() === "y") {
    await findAndReplace("$ makemail --help", "```", output);
  }
}

async function scripts() {
  const packageJson = (await $`cat package.json`.quiet()).stdout;
  const scriptsObj = JSON.parse(packageJson).scripts;
  // key table
  const keys = {
    compile: "Compile the source code",
    "compile:watch": "Compile the source code and watch for changes",
  };

  const output = Object.entries(scriptsObj).map(([cmd, value]) => {
    const description = keys[cmd] || `runs: \`${value}\``;
    // left-align the descriptions
    const padding = " ".repeat(20 - cmd.length - 1 - 4);
    return `npm run ${cmd} ${padding}# ${description}`;
  });

  console.log(output.join("\n"));

  const replace = await ques("Replace in README.md? [y/N] ");

  if (replace.toLowerCase() === "y") {
    await findAndReplace("# from package.json 'scripts'", "```", output);
  }
}

function ques(query, options = {}) {
  if (y) {
    return "y";
  }

  return question(query, options);
}
