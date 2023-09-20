# makemail

## Introduction

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

- CLI created from [this tutorial](https://dawchihliou.github.io/articles/writing-your-own-typescript-cli)