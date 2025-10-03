"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/analyze.ts
var analyze_exports = {};
__export(analyze_exports, {
  analyzeProject: () => analyzeProject
});
module.exports = __toCommonJS(analyze_exports);
var import_promises = __toESM(require("fs/promises"));
var import_path = __toESM(require("path"));
var import_globby = require("globby");
var import_parser = require("@babel/parser");
var import_traverse = __toESM(require("@babel/traverse"));
function getPackageName(p) {
  if (!p) return null;
  if (p.startsWith(".") || p.startsWith("/") || p.startsWith("..")) return null;
  if (p.startsWith("@")) {
    const parts = p.split("/");
    return parts.length >= 2 ? parts.slice(0, 2).join("/") : p;
  }
  return p.split("/")[0];
}
function isDevFile(file) {
  const n = file.replace(/\\/g, "/");
  return /(^|\/)(test|spec|__tests__)(\/|$)/i.test(n) || /\.test\.|\.spec\./i.test(n) || /(^|\/)scripts(\/|$)/i.test(n) || /(^|\/)\.storybook(\/|$)/i.test(n);
}
async function analyzeProject(root = process.cwd(), opts = {}) {
  const pkgPath = import_path.default.join(root, "package.json");
  const pkgRaw = await import_promises.default.readFile(pkgPath, "utf8");
  const pkg = JSON.parse(pkgRaw);
  const dependencies = Object.keys(pkg.dependencies ?? {});
  const devDependencies = Object.keys(pkg.devDependencies ?? {});
  const declaredAll = /* @__PURE__ */ new Set([...dependencies, ...devDependencies]);
  const patterns = opts.patterns ?? ["**/*.{js,ts,jsx,tsx,mjs,cjs}"];
  const files = await (0, import_globby.globby)(patterns, {
    cwd: root,
    absolute: true,
    gitignore: true,
    ignore: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/bin/**",
      // ⬅ add this
      "**/coverage/**"
    ]
  });
  const used = /* @__PURE__ */ new Set();
  const fileToUsed = /* @__PURE__ */ new Map();
  for (const file of files) {
    let content;
    try {
      content = await import_promises.default.readFile(file, "utf8");
    } catch {
      continue;
    }
    let ast;
    try {
      ast = (0, import_parser.parse)(content, { sourceType: "unambiguous", plugins: ["typescript", "jsx", "dynamicImport"] });
    } catch {
      continue;
    }
    const localUsed = /* @__PURE__ */ new Set();
    (0, import_traverse.default)(ast, {
      ImportDeclaration({ node }) {
        const v = node.source && node.source.value;
        const pkgName = getPackageName(v);
        if (pkgName) {
          used.add(pkgName);
          localUsed.add(pkgName);
        }
      },
      CallExpression({ node }) {
        if (node.callee && node.callee.type === "Identifier" && node.callee.name === "require") {
          const arg = node.arguments && node.arguments[0];
          if (arg && arg.type === "StringLiteral") {
            const pkgName = getPackageName(arg.value);
            if (pkgName) {
              used.add(pkgName);
              localUsed.add(pkgName);
            }
          }
        }
        if (node.callee && node.callee.type === "Import") {
          const arg = node.arguments && node.arguments[0];
          if (arg && arg.type === "StringLiteral") {
            const pkgName = getPackageName(arg.value);
            if (pkgName) {
              used.add(pkgName);
              localUsed.add(pkgName);
            }
          }
        }
      }
    });
    fileToUsed.set(import_path.default.relative(root, file), localUsed);
  }
  const ghosts = dependencies.filter((d) => !used.has(d));
  const phantoms = [...used].filter((u) => !declaredAll.has(u));
  const devUsedInProd = /* @__PURE__ */ new Map();
  for (const [file, usedSet] of fileToUsed) {
    if (isDevFile(file)) continue;
    const usedDev = [...usedSet].filter((u) => devDependencies.includes(u));
    if (usedDev.length) devUsedInProd.set(file, usedDev);
  }
  return {
    ghosts,
    phantoms,
    devUsedInProd: Object.fromEntries(devUsedInProd)
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  analyzeProject
});
