# makemail

> This doc is a WIP. It's more here as a "what could be" for now...

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
