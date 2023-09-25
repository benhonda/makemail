# makemail

> This doc is a WIP. It's more here as a "what could be" for now...

#### To-do:

- [x] prettier/eslint config for consistency
- [ ] Test with not-exact image sizes
- [ ] Docker

#### Roadmap:

- [ ] prod/preview script
  - [x] upload html file to s3 + replace URLS in template
  - [x] upload assets to S3 + replace URLS in template
  - [ ] resize assets
  - [ ] with flag, upload html to EmailOnAcid/Litmus + return URL to test on all screens (pending API approval for testing)
  - [ ] stdout an `open` command to locate the final html file in Finder
- [x] parse yaml frontmatter in templates for handlebars/mjml config + context
- [ ] i18n config

## Installation

```bash
npm install makemail
```

## Usage

### CLI

```bash
makemail --email-lang mjml --templating-lang handlebars
```

```bash
$ makemail --help
Usage: makemail [options] [command]

CLI for makemail

Options:
  -V, --version                        output the version number
  -v --verbose                         verbose output
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
  --no-open                            don't open browser-sync
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
  -h, --help                           display help for command

Commands:
  dev [glob]                           compile templates to html
  prod [glob]                          compile templates to html, minify,
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

// The above was auto-generated by running `./repo.mjs run handlebars`
```
<!-- end:repo.mjs:helpers -->

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
npm run test            # runs: `echo "Error: no test specified" && exit 1`

# The above was auto-generated by running `./repo.mjs run`
```

## Misc.

Special shoutouts:

- Repo set up with help from [npm-ts-workspaces-example](https://github.com/Quramy/npm-ts-workspaces-example)
- CLI inspired by [this tutorial](https://dawchihliou.github.io/articles/writing-your-own-typescript-cli)




