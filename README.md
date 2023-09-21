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

### Node.js

```typescript
import { compileMjml } from 'makemail';

const html = compileMjml(`<mjml></mjml>`, options)

...
```

# Misc.

Special shoutouts:

- Repo set up with help from [npm-ts-workspaces-example](https://github.com/Quramy/npm-ts-workspaces-example)
- CLI inspired by [this tutorial](https://dawchihliou.github.io/articles/writing-your-own-typescript-cli)
