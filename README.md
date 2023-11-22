# makemail

> makemail currently only supports building template with [mjml](https://github.com/mjmlio/mjml) and [handlebars](https://github.com/handlebars-lang/handlebars.js). Check out the [examples section](#examples) for more info.

## Installation

```bash
npm install makemail
```

## Usage

### CLI

Create a `makemail.yml` config file

```bash
makemail init
```

Run on root dir

```bash
makemail dev
```

Run a specific folder - good for separating workspaces with different `makemail.yml` configs.

```bash
makemail dev my-folder/
```

Or tell makemail where to look for input files

```bash
makemail dev -f my-other-folder/src
```

Compile all files for production

```bash
makemail prod
```

Compile a specific file for production

```bash
makemail prod -f my-folder/index.mjml
```

All options

```bash
$ makemail --help
Usage: makemail [options] [command]

CLI for makemail

Options:
  -V, --version                        output the version number
  -v --verbose                         verbose output
  -f --files <files>                   comma separated list of globs
  -w --watch                           watch for changes
  --settings <file>                    set settings file
  -s --src <dir>                       set src dir
  -i --input <files>                   comma separated list of input file globs
  -o --output <dir>                    set output dir
  -l --locales <locales>               comma separated list of locales
  -D --delete-out-dir                  delete the output directory before
                                       compiling
  -b --browser-sync                    start browser-sync
  -B --browser-sync-options <options>  browser-sync options
  --no-open                            do not open browser-sync window on start
  --port <port>                        browser-sync port
  --start-path <startPath>             browser-sync start path
  -u, --upload                         upload files and assets to s3 if not
                                       already uploaded
  --force-upload                       force upload assets to s3 (even if they
                                       already exist)
  --bucket <bucket>                    s3 bucket
  --region <region>                    s3 region
  --omit-default-locale                omit the default locale from the file
                                       name
  --env-path <path>                    path to .env file
  -h, --help                           display help for command

Commands:
  init                                 step-by-step setup a new project
  dev [workspace]                      compile templates to html
  prod [workspace]                     compile templates to html, minify,
                                       inline css, etc.
  help [command]                       display help for command


# The above was auto-generated by running `./repo.mjs run`
```

### Handlebars

Available helpers:

<!-- start:repo.mjs:helpers -->

```typescript
`t`
 description: used to output the correct text based on the locale
 usage: {{t "hello" "hola" "bonjour"}}

// The above was auto-generated by running `./repo.mjs run`
```

<!-- end:repo.mjs:helpers -->

### Examples

Check out the example project in [example/](https://github.com/benhonda/makemail/tree/main/example)

## Developing

From root...

```bash
npm install
```

Then run one of these:

```bash
# from package.json 'scripts'
npm run compile         # Compile the source code
npm run compile:watch   # Compile the source code and watch for changes
npm run test            # Run the tests (todo)
npm run prepare         # runs: `husky install`

# The above was auto-generated by running `./repo.mjs run`
```

### Repo.mjs

There are bunch of scripts in here that aid in developing docs and doing other chores. It is called in a pre-commit hook.

## Misc.

Special shoutouts:

- Repo set up with help from [npm-ts-workspaces-example](https://github.com/Quramy/npm-ts-workspaces-example)
- CLI inspired by [this tutorial](https://dawchihliou.github.io/articles/writing-your-own-typescript-cli)

#### To-do:

- [x] prettier/eslint config for consistency
- [ ] Test with not-exact image sizes
- [ ] Docker
- [ ] Use workspace name to create bucket
- [ ] .env file should be discoverable even when workspace is set in cli args
- [ ] BUG: `const getContentType = await $file --mime-type ${filePath} | cut -d' ' -f2` doesn't work if there are spaces in the file path

#### Roadmap:

- [x] parse yaml frontmatter in templates for handlebars/mjml config + context
- [x] i18n config
- [ ] prod/preview script
  - [x] upload html file to s3 + replace URLS in template
  - [x] upload assets to S3 + replace URLS in template
  - [ ] resize assets
  - [ ] with flag, upload html to EmailOnAcid/Litmus + return URL to test on all screens (pending API approval for testing)
