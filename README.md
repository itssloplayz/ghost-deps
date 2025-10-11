# 🕵️‍♂️ ghost-deps

**Find and track ghost dependencies hiding in your Node.js projects.**
Ever had a package installed that you *don’t actually use* — or an import that *isn’t listed in your package.json*?
`ghost-deps` helps you clean that up.

---

## 🚀 What It Does

`ghost-deps` scans your project files and compares all imports/require calls with your `package.json` dependencies.

It then reports:

* 📦 **Unused dependencies** – listed in `package.json` but never imported
* 👻 **Ghost dependencies** – imported in your code but missing from `package.json`
* 🧹 **Summary report** – quick overview of what to remove or install

---

## 📦 Installation

You can install it globally or locally:

```bash
npm install -g ghost-deps
```

or in a project:

```bash
npm install --save-dev ghost-deps
```

Then you can run:

```bash
ghost-deps --path .
```

---

## 🧭 Usage

```bash
ghost-deps [options]
```

### Options:

| Flag       | Description                             | Default           |
| ---------- | --------------------------------------- | ----------------- |
| `--path`   | Path to your project root               | `.`               |
| `--ignore` | Comma-separated list of globs to ignore | `node_modules/**` |
| `--json`   | Output report as JSON                   | `false`           |
| `-o, --output <file>`   | Save the output to a file                   | `stdout`           |

### Example:

```bash
ghost-deps --path ./my-app
```

Output:

```
🔍 Scanning ./my-app

Unused dependencies:
- chalk
- lodash

Ghost dependencies:
- express (imported in src/server.ts)
```

---

## 🧠 Why Use It?

* Keep your `package.json` tidy
* Reduce unnecessary install size
* Avoid runtime errors from missing deps
* Great for large repos and CI checks

---

## 🛠️ Development

Clone the repo and build from source:

```bash
git clone https://github.com/yourusername/ghost-deps.git
cd ghost-deps
npm install
npm run build
```

Run locally:

```bash
node bin/ghost-deps.js --path .
```

---

## 🧩 Tech Stack

* [TypeScript](https://www.typescriptlang.org/)
* [tsup](https://github.com/egoist/tsup)
* [Babel Parser](https://babel.dev/docs/babel-parser)
* [globby](https://github.com/sindresorhus/globby)

---

## 📄 License

MIT © [majcek210](https://github.com/majcek210)
