"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
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

// node_modules/commander/index.js
var require_commander = __commonJS({
  "node_modules/commander/index.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events").EventEmitter;
    var spawn = require("child_process").spawn;
    var path2 = require("path");
    var dirname = path2.dirname;
    var basename = path2.basename;
    var fs2 = require("fs");
    require("util").inherits(Command2, EventEmitter);
    exports2 = module2.exports = new Command2();
    exports2.Command = Command2;
    exports2.Option = Option;
    function Option(flags, description) {
      this.flags = flags;
      this.required = flags.indexOf("<") >= 0;
      this.optional = flags.indexOf("[") >= 0;
      this.mandatory = false;
      this.negate = flags.indexOf("-no-") !== -1;
      flags = flags.split(/[ ,|]+/);
      if (flags.length > 1 && !/^[[<]/.test(flags[1])) this.short = flags.shift();
      this.long = flags.shift();
      this.description = description || "";
    }
    Option.prototype.name = function() {
      return this.long.replace(/^--/, "");
    };
    Option.prototype.attributeName = function() {
      return camelcase(this.name().replace(/^no-/, ""));
    };
    Option.prototype.is = function(arg) {
      return this.short === arg || this.long === arg;
    };
    var CommanderError = class extends Error {
      /**
       * Constructs the CommanderError class
       * @param {Number} exitCode suggested exit code which could be used with process.exit
       * @param {String} code an id string representing the error
       * @param {String} message human-readable description of the error
       * @constructor
       */
      constructor(exitCode, code, message) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.code = code;
        this.exitCode = exitCode;
      }
    };
    exports2.CommanderError = CommanderError;
    function Command2(name) {
      this.commands = [];
      this.options = [];
      this._execs = /* @__PURE__ */ new Set();
      this._allowUnknownOption = false;
      this._args = [];
      this._name = name || "";
      this._optionValues = {};
      this._storeOptionsAsProperties = true;
      this._passCommandToAction = true;
      this._actionResults = [];
      this._helpFlags = "-h, --help";
      this._helpDescription = "output usage information";
      this._helpShortFlag = "-h";
      this._helpLongFlag = "--help";
    }
    Command2.prototype.command = function(nameAndArgs, actionOptsOrExecDesc, execOpts) {
      var desc = actionOptsOrExecDesc;
      var opts = execOpts;
      if (typeof desc === "object" && desc !== null) {
        opts = desc;
        desc = null;
      }
      opts = opts || {};
      var args = nameAndArgs.split(/ +/);
      var cmd = new Command2(args.shift());
      if (desc) {
        cmd.description(desc);
        this.executables = true;
        this._execs.add(cmd._name);
        if (opts.isDefault) this.defaultExecutable = cmd._name;
      }
      cmd._noHelp = !!opts.noHelp;
      cmd._helpFlags = this._helpFlags;
      cmd._helpDescription = this._helpDescription;
      cmd._helpShortFlag = this._helpShortFlag;
      cmd._helpLongFlag = this._helpLongFlag;
      cmd._exitCallback = this._exitCallback;
      cmd._storeOptionsAsProperties = this._storeOptionsAsProperties;
      cmd._passCommandToAction = this._passCommandToAction;
      cmd._executableFile = opts.executableFile;
      this.commands.push(cmd);
      cmd.parseExpectedArgs(args);
      cmd.parent = this;
      if (desc) return this;
      return cmd;
    };
    Command2.prototype.arguments = function(desc) {
      return this.parseExpectedArgs(desc.split(/ +/));
    };
    Command2.prototype.addImplicitHelpCommand = function() {
      this.command("help [cmd]", "display help for [cmd]");
    };
    Command2.prototype.parseExpectedArgs = function(args) {
      if (!args.length) return;
      var self = this;
      args.forEach(function(arg) {
        var argDetails = {
          required: false,
          name: "",
          variadic: false
        };
        switch (arg[0]) {
          case "<":
            argDetails.required = true;
            argDetails.name = arg.slice(1, -1);
            break;
          case "[":
            argDetails.name = arg.slice(1, -1);
            break;
        }
        if (argDetails.name.length > 3 && argDetails.name.slice(-3) === "...") {
          argDetails.variadic = true;
          argDetails.name = argDetails.name.slice(0, -3);
        }
        if (argDetails.name) {
          self._args.push(argDetails);
        }
      });
      return this;
    };
    Command2.prototype.exitOverride = function(fn) {
      if (fn) {
        this._exitCallback = fn;
      } else {
        this._exitCallback = function(err) {
          if (err.code !== "commander.executeSubCommandAsync") {
            throw err;
          } else {
          }
        };
      }
      return this;
    };
    Command2.prototype._exit = function(exitCode, code, message) {
      if (this._exitCallback) {
        this._exitCallback(new CommanderError(exitCode, code, message));
      }
      process.exit(exitCode);
    };
    Command2.prototype.action = function(fn) {
      var self = this;
      var listener = function(args, unknown) {
        args = args || [];
        unknown = unknown || [];
        var parsed = self.parseOptions(unknown);
        outputHelpIfRequested(self, parsed.unknown);
        self._checkForMissingMandatoryOptions();
        if (parsed.unknown.length > 0) {
          self.unknownOption(parsed.unknown[0]);
        }
        if (parsed.args.length) args = parsed.args.concat(args);
        self._args.forEach(function(arg, i) {
          if (arg.required && args[i] == null) {
            self.missingArgument(arg.name);
          } else if (arg.variadic) {
            if (i !== self._args.length - 1) {
              self.variadicArgNotLast(arg.name);
            }
            args[i] = args.splice(i);
          }
        });
        var expectedArgsCount = self._args.length;
        var actionArgs = args.slice(0, expectedArgsCount);
        if (self._passCommandToAction) {
          actionArgs[expectedArgsCount] = self;
        } else {
          actionArgs[expectedArgsCount] = self.opts();
        }
        if (args.length > expectedArgsCount) {
          actionArgs.push(args.slice(expectedArgsCount));
        }
        const actionResult = fn.apply(self, actionArgs);
        let rootCommand = self;
        while (rootCommand.parent) {
          rootCommand = rootCommand.parent;
        }
        rootCommand._actionResults.push(actionResult);
      };
      var parent = this.parent || this;
      var name = parent === this ? "*" : this._name;
      parent.on("command:" + name, listener);
      if (this._alias) parent.on("command:" + this._alias, listener);
      return this;
    };
    Command2.prototype._optionEx = function(config, flags, description, fn, defaultValue) {
      var self = this, option = new Option(flags, description), oname = option.name(), name = option.attributeName();
      option.mandatory = !!config.mandatory;
      if (typeof fn !== "function") {
        if (fn instanceof RegExp) {
          var regex = fn;
          fn = function(val, def) {
            var m = regex.exec(val);
            return m ? m[0] : def;
          };
        } else {
          defaultValue = fn;
          fn = null;
        }
      }
      if (option.negate || option.optional || option.required || typeof defaultValue === "boolean") {
        if (option.negate) {
          const positiveLongFlag = option.long.replace(/^--no-/, "--");
          defaultValue = self.optionFor(positiveLongFlag) ? self._getOptionValue(name) : true;
        }
        if (defaultValue !== void 0) {
          self._setOptionValue(name, defaultValue);
          option.defaultValue = defaultValue;
        }
      }
      this.options.push(option);
      this.on("option:" + oname, function(val) {
        if (val !== null && fn) {
          val = fn(val, self._getOptionValue(name) === void 0 ? defaultValue : self._getOptionValue(name));
        }
        if (typeof self._getOptionValue(name) === "boolean" || typeof self._getOptionValue(name) === "undefined") {
          if (val == null) {
            self._setOptionValue(name, option.negate ? false : defaultValue || true);
          } else {
            self._setOptionValue(name, val);
          }
        } else if (val !== null) {
          self._setOptionValue(name, option.negate ? false : val);
        }
      });
      return this;
    };
    Command2.prototype.option = function(flags, description, fn, defaultValue) {
      return this._optionEx({}, flags, description, fn, defaultValue);
    };
    Command2.prototype.requiredOption = function(flags, description, fn, defaultValue) {
      return this._optionEx({ mandatory: true }, flags, description, fn, defaultValue);
    };
    Command2.prototype.allowUnknownOption = function(arg) {
      this._allowUnknownOption = arguments.length === 0 || arg;
      return this;
    };
    Command2.prototype.storeOptionsAsProperties = function(value) {
      this._storeOptionsAsProperties = value === void 0 || value;
      if (this.options.length) {
        console.error("Commander usage error: call storeOptionsAsProperties before adding options");
      }
      return this;
    };
    Command2.prototype.passCommandToAction = function(value) {
      this._passCommandToAction = value === void 0 || value;
      return this;
    };
    Command2.prototype._setOptionValue = function(key, value) {
      if (this._storeOptionsAsProperties) {
        this[key] = value;
      } else {
        this._optionValues[key] = value;
      }
    };
    Command2.prototype._getOptionValue = function(key) {
      if (this._storeOptionsAsProperties) {
        return this[key];
      }
      return this._optionValues[key];
    };
    Command2.prototype.parse = function(argv) {
      if (this.executables) this.addImplicitHelpCommand();
      this.rawArgs = argv;
      this._name = this._name || basename(argv[1], ".js");
      if (this.executables && argv.length < 3 && !this.defaultExecutable) {
        argv.push(this._helpLongFlag);
      }
      var normalized = this.normalize(argv.slice(2));
      var parsed = this.parseOptions(normalized);
      var args = this.args = parsed.args;
      var result = this.parseArgs(this.args, parsed.unknown);
      if (args[0] === "help" && args.length === 1) this.help();
      if (args[0] === "help") {
        args[0] = args[1];
        args[1] = this._helpLongFlag;
      } else {
        this._checkForMissingMandatoryOptions();
      }
      var name = result.args[0];
      var subCommand = null;
      if (name) {
        subCommand = this.commands.find(function(command) {
          return command._name === name;
        });
      }
      if (!subCommand && name) {
        subCommand = this.commands.find(function(command) {
          return command.alias() === name;
        });
        if (subCommand) {
          name = subCommand._name;
          args[0] = name;
        }
      }
      if (!subCommand && this.defaultExecutable) {
        name = this.defaultExecutable;
        args.unshift(name);
        subCommand = this.commands.find(function(command) {
          return command._name === name;
        });
      }
      if (this._execs.has(name)) {
        return this.executeSubCommand(argv, args, parsed.unknown, subCommand ? subCommand._executableFile : void 0);
      }
      return result;
    };
    Command2.prototype.parseAsync = function(argv) {
      this.parse(argv);
      return Promise.all(this._actionResults);
    };
    Command2.prototype.executeSubCommand = function(argv, args, unknown, executableFile) {
      args = args.concat(unknown);
      if (!args.length) this.help();
      var isExplicitJS = false;
      var pm = argv[1];
      var bin = basename(pm, path2.extname(pm)) + "-" + args[0];
      if (executableFile != null) {
        bin = executableFile;
        var executableExt = path2.extname(executableFile);
        isExplicitJS = executableExt === ".js" || executableExt === ".ts" || executableExt === ".mjs";
      }
      var baseDir;
      var resolvedLink = fs2.realpathSync(pm);
      baseDir = dirname(resolvedLink);
      var localBin = path2.join(baseDir, bin);
      if (exists(localBin + ".js")) {
        bin = localBin + ".js";
        isExplicitJS = true;
      } else if (exists(localBin + ".ts")) {
        bin = localBin + ".ts";
        isExplicitJS = true;
      } else if (exists(localBin + ".mjs")) {
        bin = localBin + ".mjs";
        isExplicitJS = true;
      } else if (exists(localBin)) {
        bin = localBin;
      }
      args = args.slice(1);
      var proc;
      if (process.platform !== "win32") {
        if (isExplicitJS) {
          args.unshift(bin);
          args = incrementNodeInspectorPort(process.execArgv).concat(args);
          proc = spawn(process.argv[0], args, { stdio: "inherit" });
        } else {
          proc = spawn(bin, args, { stdio: "inherit" });
        }
      } else {
        args.unshift(bin);
        args = incrementNodeInspectorPort(process.execArgv).concat(args);
        proc = spawn(process.execPath, args, { stdio: "inherit" });
      }
      var signals = ["SIGUSR1", "SIGUSR2", "SIGTERM", "SIGINT", "SIGHUP"];
      signals.forEach(function(signal) {
        process.on(signal, function() {
          if (proc.killed === false && proc.exitCode === null) {
            proc.kill(signal);
          }
        });
      });
      const exitCallback = this._exitCallback;
      if (!exitCallback) {
        proc.on("close", process.exit.bind(process));
      } else {
        proc.on("close", () => {
          exitCallback(new CommanderError(process.exitCode || 0, "commander.executeSubCommandAsync", "(close)"));
        });
      }
      proc.on("error", function(err) {
        if (err.code === "ENOENT") {
          console.error("error: %s(1) does not exist, try --help", bin);
        } else if (err.code === "EACCES") {
          console.error("error: %s(1) not executable. try chmod or run with root", bin);
        }
        if (!exitCallback) {
          process.exit(1);
        } else {
          const wrappedError = new CommanderError(1, "commander.executeSubCommandAsync", "(error)");
          wrappedError.nestedError = err;
          exitCallback(wrappedError);
        }
      });
      this.runningCommand = proc;
    };
    Command2.prototype.normalize = function(args) {
      var ret = [], arg, lastOpt, index, short, opt;
      for (var i = 0, len = args.length; i < len; ++i) {
        arg = args[i];
        if (i > 0) {
          lastOpt = this.optionFor(args[i - 1]);
        }
        if (arg === "--") {
          ret = ret.concat(args.slice(i));
          break;
        } else if (lastOpt && lastOpt.required) {
          ret.push(arg);
        } else if (arg.length > 2 && arg[0] === "-" && arg[1] !== "-") {
          short = arg.slice(0, 2);
          opt = this.optionFor(short);
          if (opt && (opt.required || opt.optional)) {
            ret.push(short);
            ret.push(arg.slice(2));
          } else {
            arg.slice(1).split("").forEach(function(c) {
              ret.push("-" + c);
            });
          }
        } else if (/^--/.test(arg) && ~(index = arg.indexOf("="))) {
          ret.push(arg.slice(0, index), arg.slice(index + 1));
        } else {
          ret.push(arg);
        }
      }
      return ret;
    };
    Command2.prototype.parseArgs = function(args, unknown) {
      var name;
      if (args.length) {
        name = args[0];
        if (this.listeners("command:" + name).length) {
          this.emit("command:" + args.shift(), args, unknown);
        } else {
          this.emit("command:*", args, unknown);
        }
      } else {
        outputHelpIfRequested(this, unknown);
        if (unknown.length > 0 && !this.defaultExecutable) {
          this.unknownOption(unknown[0]);
        }
        if (this.commands.length === 0 && this._args.filter(function(a) {
          return a.required;
        }).length === 0) {
          this.emit("command:*");
        }
      }
      return this;
    };
    Command2.prototype.optionFor = function(arg) {
      for (var i = 0, len = this.options.length; i < len; ++i) {
        if (this.options[i].is(arg)) {
          return this.options[i];
        }
      }
    };
    Command2.prototype._checkForMissingMandatoryOptions = function() {
      for (var cmd = this; cmd; cmd = cmd.parent) {
        cmd.options.forEach((anOption) => {
          if (anOption.mandatory && cmd._getOptionValue(anOption.attributeName()) === void 0) {
            cmd.missingMandatoryOptionValue(anOption);
          }
        });
      }
    };
    Command2.prototype.parseOptions = function(argv) {
      var args = [], len = argv.length, literal, option, arg;
      var unknownOptions = [];
      for (var i = 0; i < len; ++i) {
        arg = argv[i];
        if (literal) {
          args.push(arg);
          continue;
        }
        if (arg === "--") {
          literal = true;
          continue;
        }
        option = this.optionFor(arg);
        if (option) {
          if (option.required) {
            arg = argv[++i];
            if (arg == null) return this.optionMissingArgument(option);
            this.emit("option:" + option.name(), arg);
          } else if (option.optional) {
            arg = argv[i + 1];
            if (arg == null || arg[0] === "-" && arg !== "-") {
              arg = null;
            } else {
              ++i;
            }
            this.emit("option:" + option.name(), arg);
          } else {
            this.emit("option:" + option.name());
          }
          continue;
        }
        if (arg.length > 1 && arg[0] === "-") {
          unknownOptions.push(arg);
          if (i + 1 < argv.length && (argv[i + 1][0] !== "-" || argv[i + 1] === "-")) {
            unknownOptions.push(argv[++i]);
          }
          continue;
        }
        args.push(arg);
      }
      return { args, unknown: unknownOptions };
    };
    Command2.prototype.opts = function() {
      if (this._storeOptionsAsProperties) {
        var result = {}, len = this.options.length;
        for (var i = 0; i < len; i++) {
          var key = this.options[i].attributeName();
          result[key] = key === this._versionOptionName ? this._version : this[key];
        }
        return result;
      }
      return this._optionValues;
    };
    Command2.prototype.missingArgument = function(name) {
      const message = `error: missing required argument '${name}'`;
      console.error(message);
      this._exit(1, "commander.missingArgument", message);
    };
    Command2.prototype.optionMissingArgument = function(option, flag) {
      let message;
      if (flag) {
        message = `error: option '${option.flags}' argument missing, got '${flag}'`;
      } else {
        message = `error: option '${option.flags}' argument missing`;
      }
      console.error(message);
      this._exit(1, "commander.optionMissingArgument", message);
    };
    Command2.prototype.missingMandatoryOptionValue = function(option) {
      const message = `error: required option '${option.flags}' not specified`;
      console.error(message);
      this._exit(1, "commander.missingMandatoryOptionValue", message);
    };
    Command2.prototype.unknownOption = function(flag) {
      if (this._allowUnknownOption) return;
      const message = `error: unknown option '${flag}'`;
      console.error(message);
      this._exit(1, "commander.unknownOption", message);
    };
    Command2.prototype.variadicArgNotLast = function(name) {
      const message = `error: variadic arguments must be last '${name}'`;
      console.error(message);
      this._exit(1, "commander.variadicArgNotLast", message);
    };
    Command2.prototype.version = function(str, flags, description) {
      if (arguments.length === 0) return this._version;
      this._version = str;
      flags = flags || "-V, --version";
      description = description || "output the version number";
      var versionOption = new Option(flags, description);
      this._versionOptionName = versionOption.long.substr(2) || "version";
      this.options.push(versionOption);
      var self = this;
      this.on("option:" + this._versionOptionName, function() {
        process.stdout.write(str + "\n");
        self._exit(0, "commander.version", str);
      });
      return this;
    };
    Command2.prototype.description = function(str, argsDescription) {
      if (arguments.length === 0) return this._description;
      this._description = str;
      this._argsDescription = argsDescription;
      return this;
    };
    Command2.prototype.alias = function(alias) {
      var command = this;
      if (this.commands.length !== 0) {
        command = this.commands[this.commands.length - 1];
      }
      if (arguments.length === 0) return command._alias;
      if (alias === command._name) throw new Error("Command alias can't be the same as its name");
      command._alias = alias;
      return this;
    };
    Command2.prototype.usage = function(str) {
      var args = this._args.map(function(arg) {
        return humanReadableArgName(arg);
      });
      var usage = "[options]" + (this.commands.length ? " [command]" : "") + (this._args.length ? " " + args.join(" ") : "");
      if (arguments.length === 0) return this._usage || usage;
      this._usage = str;
      return this;
    };
    Command2.prototype.name = function(str) {
      if (arguments.length === 0) return this._name;
      this._name = str;
      return this;
    };
    Command2.prototype.prepareCommands = function() {
      return this.commands.filter(function(cmd) {
        return !cmd._noHelp;
      }).map(function(cmd) {
        var args = cmd._args.map(function(arg) {
          return humanReadableArgName(arg);
        }).join(" ");
        return [
          cmd._name + (cmd._alias ? "|" + cmd._alias : "") + (cmd.options.length ? " [options]" : "") + (args ? " " + args : ""),
          cmd._description
        ];
      });
    };
    Command2.prototype.largestCommandLength = function() {
      var commands = this.prepareCommands();
      return commands.reduce(function(max, command) {
        return Math.max(max, command[0].length);
      }, 0);
    };
    Command2.prototype.largestOptionLength = function() {
      var options = [].slice.call(this.options);
      options.push({
        flags: this._helpFlags
      });
      return options.reduce(function(max, option) {
        return Math.max(max, option.flags.length);
      }, 0);
    };
    Command2.prototype.largestArgLength = function() {
      return this._args.reduce(function(max, arg) {
        return Math.max(max, arg.name.length);
      }, 0);
    };
    Command2.prototype.padWidth = function() {
      var width = this.largestOptionLength();
      if (this._argsDescription && this._args.length) {
        if (this.largestArgLength() > width) {
          width = this.largestArgLength();
        }
      }
      if (this.commands && this.commands.length) {
        if (this.largestCommandLength() > width) {
          width = this.largestCommandLength();
        }
      }
      return width;
    };
    Command2.prototype.optionHelp = function() {
      var width = this.padWidth();
      var columns = process.stdout.columns || 80;
      var descriptionWidth = columns - width - 4;
      return this.options.map(function(option) {
        const fullDesc = option.description + (!option.negate && option.defaultValue !== void 0 ? " (default: " + JSON.stringify(option.defaultValue) + ")" : "");
        return pad(option.flags, width) + "  " + optionalWrap(fullDesc, descriptionWidth, width + 2);
      }).concat([pad(this._helpFlags, width) + "  " + optionalWrap(this._helpDescription, descriptionWidth, width + 2)]).join("\n");
    };
    Command2.prototype.commandHelp = function() {
      if (!this.commands.length) return "";
      var commands = this.prepareCommands();
      var width = this.padWidth();
      var columns = process.stdout.columns || 80;
      var descriptionWidth = columns - width - 4;
      return [
        "Commands:",
        commands.map(function(cmd) {
          var desc = cmd[1] ? "  " + cmd[1] : "";
          return (desc ? pad(cmd[0], width) : cmd[0]) + optionalWrap(desc, descriptionWidth, width + 2);
        }).join("\n").replace(/^/gm, "  "),
        ""
      ].join("\n");
    };
    Command2.prototype.helpInformation = function() {
      var desc = [];
      if (this._description) {
        desc = [
          this._description,
          ""
        ];
        var argsDescription = this._argsDescription;
        if (argsDescription && this._args.length) {
          var width = this.padWidth();
          var columns = process.stdout.columns || 80;
          var descriptionWidth = columns - width - 5;
          desc.push("Arguments:");
          desc.push("");
          this._args.forEach(function(arg) {
            desc.push("  " + pad(arg.name, width) + "  " + wrap(argsDescription[arg.name], descriptionWidth, width + 4));
          });
          desc.push("");
        }
      }
      var cmdName = this._name;
      if (this._alias) {
        cmdName = cmdName + "|" + this._alias;
      }
      var parentCmdNames = "";
      for (var parentCmd = this.parent; parentCmd; parentCmd = parentCmd.parent) {
        parentCmdNames = parentCmd.name() + " " + parentCmdNames;
      }
      var usage = [
        "Usage: " + parentCmdNames + cmdName + " " + this.usage(),
        ""
      ];
      var cmds = [];
      var commandHelp = this.commandHelp();
      if (commandHelp) cmds = [commandHelp];
      var options = [
        "Options:",
        "" + this.optionHelp().replace(/^/gm, "  "),
        ""
      ];
      return usage.concat(desc).concat(options).concat(cmds).join("\n");
    };
    Command2.prototype.outputHelp = function(cb) {
      if (!cb) {
        cb = function(passthru) {
          return passthru;
        };
      }
      const cbOutput = cb(this.helpInformation());
      if (typeof cbOutput !== "string" && !Buffer.isBuffer(cbOutput)) {
        throw new Error("outputHelp callback must return a string or a Buffer");
      }
      process.stdout.write(cbOutput);
      this.emit(this._helpLongFlag);
    };
    Command2.prototype.helpOption = function(flags, description) {
      this._helpFlags = flags || this._helpFlags;
      this._helpDescription = description || this._helpDescription;
      var splitFlags = this._helpFlags.split(/[ ,|]+/);
      if (splitFlags.length > 1) this._helpShortFlag = splitFlags.shift();
      this._helpLongFlag = splitFlags.shift();
      return this;
    };
    Command2.prototype.help = function(cb) {
      this.outputHelp(cb);
      this._exit(process.exitCode || 0, "commander.help", "(outputHelp)");
    };
    function camelcase(flag) {
      return flag.split("-").reduce(function(str, word) {
        return str + word[0].toUpperCase() + word.slice(1);
      });
    }
    function pad(str, width) {
      var len = Math.max(0, width - str.length);
      return str + Array(len + 1).join(" ");
    }
    function wrap(str, width, indent) {
      var regex = new RegExp(".{1," + (width - 1) + "}([\\s\u200B]|$)|[^\\s\u200B]+?([\\s\u200B]|$)", "g");
      var lines = str.match(regex) || [];
      return lines.map(function(line, i) {
        if (line.slice(-1) === "\n") {
          line = line.slice(0, line.length - 1);
        }
        return (i > 0 && indent ? Array(indent + 1).join(" ") : "") + line.trimRight();
      }).join("\n");
    }
    function optionalWrap(str, width, indent) {
      if (str.match(/[\n]\s+/)) return str;
      const minWidth = 40;
      if (width < minWidth) return str;
      return wrap(str, width, indent);
    }
    function outputHelpIfRequested(cmd, options) {
      options = options || [];
      for (var i = 0; i < options.length; i++) {
        if (options[i] === cmd._helpLongFlag || options[i] === cmd._helpShortFlag) {
          cmd.outputHelp();
          cmd._exit(0, "commander.helpDisplayed", "(outputHelp)");
        }
      }
    }
    function humanReadableArgName(arg) {
      var nameOutput = arg.name + (arg.variadic === true ? "..." : "");
      return arg.required ? "<" + nameOutput + ">" : "[" + nameOutput + "]";
    }
    function exists(file) {
      try {
        if (fs2.statSync(file).isFile()) {
          return true;
        }
      } catch (e) {
        return false;
      }
    }
    function incrementNodeInspectorPort(args) {
      return args.map((arg) => {
        var result = arg;
        if (arg.indexOf("--inspect") === 0) {
          var debugOption;
          var debugHost = "127.0.0.1";
          var debugPort = "9229";
          var match;
          if ((match = arg.match(/^(--inspect(-brk)?)$/)) !== null) {
            debugOption = match[1];
          } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+)$/)) !== null) {
            debugOption = match[1];
            if (/^\d+$/.test(match[3])) {
              debugPort = match[3];
            } else {
              debugHost = match[3];
            }
          } else if ((match = arg.match(/^(--inspect(-brk|-port)?)=([^:]+):(\d+)$/)) !== null) {
            debugOption = match[1];
            debugHost = match[3];
            debugPort = match[4];
          }
          if (debugOption && debugPort !== "0") {
            result = `${debugOption}=${debugHost}:${parseInt(debugPort) + 1}`;
          }
        }
        return result;
      });
    }
  }
});

// ../../../../node_modules/escape-string-regexp/index.js
var require_escape_string_regexp = __commonJS({
  "../../../../node_modules/escape-string-regexp/index.js"(exports2, module2) {
    "use strict";
    var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
    module2.exports = function(str) {
      if (typeof str !== "string") {
        throw new TypeError("Expected a string");
      }
      return str.replace(matchOperatorsRe, "\\$&");
    };
  }
});

// ../../../../node_modules/color-name/index.js
var require_color_name = __commonJS({
  "../../../../node_modules/color-name/index.js"(exports2, module2) {
    "use strict";
    module2.exports = {
      "aliceblue": [240, 248, 255],
      "antiquewhite": [250, 235, 215],
      "aqua": [0, 255, 255],
      "aquamarine": [127, 255, 212],
      "azure": [240, 255, 255],
      "beige": [245, 245, 220],
      "bisque": [255, 228, 196],
      "black": [0, 0, 0],
      "blanchedalmond": [255, 235, 205],
      "blue": [0, 0, 255],
      "blueviolet": [138, 43, 226],
      "brown": [165, 42, 42],
      "burlywood": [222, 184, 135],
      "cadetblue": [95, 158, 160],
      "chartreuse": [127, 255, 0],
      "chocolate": [210, 105, 30],
      "coral": [255, 127, 80],
      "cornflowerblue": [100, 149, 237],
      "cornsilk": [255, 248, 220],
      "crimson": [220, 20, 60],
      "cyan": [0, 255, 255],
      "darkblue": [0, 0, 139],
      "darkcyan": [0, 139, 139],
      "darkgoldenrod": [184, 134, 11],
      "darkgray": [169, 169, 169],
      "darkgreen": [0, 100, 0],
      "darkgrey": [169, 169, 169],
      "darkkhaki": [189, 183, 107],
      "darkmagenta": [139, 0, 139],
      "darkolivegreen": [85, 107, 47],
      "darkorange": [255, 140, 0],
      "darkorchid": [153, 50, 204],
      "darkred": [139, 0, 0],
      "darksalmon": [233, 150, 122],
      "darkseagreen": [143, 188, 143],
      "darkslateblue": [72, 61, 139],
      "darkslategray": [47, 79, 79],
      "darkslategrey": [47, 79, 79],
      "darkturquoise": [0, 206, 209],
      "darkviolet": [148, 0, 211],
      "deeppink": [255, 20, 147],
      "deepskyblue": [0, 191, 255],
      "dimgray": [105, 105, 105],
      "dimgrey": [105, 105, 105],
      "dodgerblue": [30, 144, 255],
      "firebrick": [178, 34, 34],
      "floralwhite": [255, 250, 240],
      "forestgreen": [34, 139, 34],
      "fuchsia": [255, 0, 255],
      "gainsboro": [220, 220, 220],
      "ghostwhite": [248, 248, 255],
      "gold": [255, 215, 0],
      "goldenrod": [218, 165, 32],
      "gray": [128, 128, 128],
      "green": [0, 128, 0],
      "greenyellow": [173, 255, 47],
      "grey": [128, 128, 128],
      "honeydew": [240, 255, 240],
      "hotpink": [255, 105, 180],
      "indianred": [205, 92, 92],
      "indigo": [75, 0, 130],
      "ivory": [255, 255, 240],
      "khaki": [240, 230, 140],
      "lavender": [230, 230, 250],
      "lavenderblush": [255, 240, 245],
      "lawngreen": [124, 252, 0],
      "lemonchiffon": [255, 250, 205],
      "lightblue": [173, 216, 230],
      "lightcoral": [240, 128, 128],
      "lightcyan": [224, 255, 255],
      "lightgoldenrodyellow": [250, 250, 210],
      "lightgray": [211, 211, 211],
      "lightgreen": [144, 238, 144],
      "lightgrey": [211, 211, 211],
      "lightpink": [255, 182, 193],
      "lightsalmon": [255, 160, 122],
      "lightseagreen": [32, 178, 170],
      "lightskyblue": [135, 206, 250],
      "lightslategray": [119, 136, 153],
      "lightslategrey": [119, 136, 153],
      "lightsteelblue": [176, 196, 222],
      "lightyellow": [255, 255, 224],
      "lime": [0, 255, 0],
      "limegreen": [50, 205, 50],
      "linen": [250, 240, 230],
      "magenta": [255, 0, 255],
      "maroon": [128, 0, 0],
      "mediumaquamarine": [102, 205, 170],
      "mediumblue": [0, 0, 205],
      "mediumorchid": [186, 85, 211],
      "mediumpurple": [147, 112, 219],
      "mediumseagreen": [60, 179, 113],
      "mediumslateblue": [123, 104, 238],
      "mediumspringgreen": [0, 250, 154],
      "mediumturquoise": [72, 209, 204],
      "mediumvioletred": [199, 21, 133],
      "midnightblue": [25, 25, 112],
      "mintcream": [245, 255, 250],
      "mistyrose": [255, 228, 225],
      "moccasin": [255, 228, 181],
      "navajowhite": [255, 222, 173],
      "navy": [0, 0, 128],
      "oldlace": [253, 245, 230],
      "olive": [128, 128, 0],
      "olivedrab": [107, 142, 35],
      "orange": [255, 165, 0],
      "orangered": [255, 69, 0],
      "orchid": [218, 112, 214],
      "palegoldenrod": [238, 232, 170],
      "palegreen": [152, 251, 152],
      "paleturquoise": [175, 238, 238],
      "palevioletred": [219, 112, 147],
      "papayawhip": [255, 239, 213],
      "peachpuff": [255, 218, 185],
      "peru": [205, 133, 63],
      "pink": [255, 192, 203],
      "plum": [221, 160, 221],
      "powderblue": [176, 224, 230],
      "purple": [128, 0, 128],
      "rebeccapurple": [102, 51, 153],
      "red": [255, 0, 0],
      "rosybrown": [188, 143, 143],
      "royalblue": [65, 105, 225],
      "saddlebrown": [139, 69, 19],
      "salmon": [250, 128, 114],
      "sandybrown": [244, 164, 96],
      "seagreen": [46, 139, 87],
      "seashell": [255, 245, 238],
      "sienna": [160, 82, 45],
      "silver": [192, 192, 192],
      "skyblue": [135, 206, 235],
      "slateblue": [106, 90, 205],
      "slategray": [112, 128, 144],
      "slategrey": [112, 128, 144],
      "snow": [255, 250, 250],
      "springgreen": [0, 255, 127],
      "steelblue": [70, 130, 180],
      "tan": [210, 180, 140],
      "teal": [0, 128, 128],
      "thistle": [216, 191, 216],
      "tomato": [255, 99, 71],
      "turquoise": [64, 224, 208],
      "violet": [238, 130, 238],
      "wheat": [245, 222, 179],
      "white": [255, 255, 255],
      "whitesmoke": [245, 245, 245],
      "yellow": [255, 255, 0],
      "yellowgreen": [154, 205, 50]
    };
  }
});

// ../../../../node_modules/color-convert/conversions.js
var require_conversions = __commonJS({
  "../../../../node_modules/color-convert/conversions.js"(exports2, module2) {
    "use strict";
    var cssKeywords = require_color_name();
    var reverseKeywords = {};
    for (key in cssKeywords) {
      if (cssKeywords.hasOwnProperty(key)) {
        reverseKeywords[cssKeywords[key]] = key;
      }
    }
    var key;
    var convert = module2.exports = {
      rgb: { channels: 3, labels: "rgb" },
      hsl: { channels: 3, labels: "hsl" },
      hsv: { channels: 3, labels: "hsv" },
      hwb: { channels: 3, labels: "hwb" },
      cmyk: { channels: 4, labels: "cmyk" },
      xyz: { channels: 3, labels: "xyz" },
      lab: { channels: 3, labels: "lab" },
      lch: { channels: 3, labels: "lch" },
      hex: { channels: 1, labels: ["hex"] },
      keyword: { channels: 1, labels: ["keyword"] },
      ansi16: { channels: 1, labels: ["ansi16"] },
      ansi256: { channels: 1, labels: ["ansi256"] },
      hcg: { channels: 3, labels: ["h", "c", "g"] },
      apple: { channels: 3, labels: ["r16", "g16", "b16"] },
      gray: { channels: 1, labels: ["gray"] }
    };
    for (model in convert) {
      if (convert.hasOwnProperty(model)) {
        if (!("channels" in convert[model])) {
          throw new Error("missing channels property: " + model);
        }
        if (!("labels" in convert[model])) {
          throw new Error("missing channel labels property: " + model);
        }
        if (convert[model].labels.length !== convert[model].channels) {
          throw new Error("channel and label counts mismatch: " + model);
        }
        channels = convert[model].channels;
        labels = convert[model].labels;
        delete convert[model].channels;
        delete convert[model].labels;
        Object.defineProperty(convert[model], "channels", { value: channels });
        Object.defineProperty(convert[model], "labels", { value: labels });
      }
    }
    var channels;
    var labels;
    var model;
    convert.rgb.hsl = function(rgb) {
      var r = rgb[0] / 255;
      var g = rgb[1] / 255;
      var b = rgb[2] / 255;
      var min = Math.min(r, g, b);
      var max = Math.max(r, g, b);
      var delta = max - min;
      var h;
      var s;
      var l;
      if (max === min) {
        h = 0;
      } else if (r === max) {
        h = (g - b) / delta;
      } else if (g === max) {
        h = 2 + (b - r) / delta;
      } else if (b === max) {
        h = 4 + (r - g) / delta;
      }
      h = Math.min(h * 60, 360);
      if (h < 0) {
        h += 360;
      }
      l = (min + max) / 2;
      if (max === min) {
        s = 0;
      } else if (l <= 0.5) {
        s = delta / (max + min);
      } else {
        s = delta / (2 - max - min);
      }
      return [h, s * 100, l * 100];
    };
    convert.rgb.hsv = function(rgb) {
      var rdif;
      var gdif;
      var bdif;
      var h;
      var s;
      var r = rgb[0] / 255;
      var g = rgb[1] / 255;
      var b = rgb[2] / 255;
      var v = Math.max(r, g, b);
      var diff = v - Math.min(r, g, b);
      var diffc = function(c) {
        return (v - c) / 6 / diff + 1 / 2;
      };
      if (diff === 0) {
        h = s = 0;
      } else {
        s = diff / v;
        rdif = diffc(r);
        gdif = diffc(g);
        bdif = diffc(b);
        if (r === v) {
          h = bdif - gdif;
        } else if (g === v) {
          h = 1 / 3 + rdif - bdif;
        } else if (b === v) {
          h = 2 / 3 + gdif - rdif;
        }
        if (h < 0) {
          h += 1;
        } else if (h > 1) {
          h -= 1;
        }
      }
      return [
        h * 360,
        s * 100,
        v * 100
      ];
    };
    convert.rgb.hwb = function(rgb) {
      var r = rgb[0];
      var g = rgb[1];
      var b = rgb[2];
      var h = convert.rgb.hsl(rgb)[0];
      var w = 1 / 255 * Math.min(r, Math.min(g, b));
      b = 1 - 1 / 255 * Math.max(r, Math.max(g, b));
      return [h, w * 100, b * 100];
    };
    convert.rgb.cmyk = function(rgb) {
      var r = rgb[0] / 255;
      var g = rgb[1] / 255;
      var b = rgb[2] / 255;
      var c;
      var m;
      var y;
      var k;
      k = Math.min(1 - r, 1 - g, 1 - b);
      c = (1 - r - k) / (1 - k) || 0;
      m = (1 - g - k) / (1 - k) || 0;
      y = (1 - b - k) / (1 - k) || 0;
      return [c * 100, m * 100, y * 100, k * 100];
    };
    function comparativeDistance(x, y) {
      return Math.pow(x[0] - y[0], 2) + Math.pow(x[1] - y[1], 2) + Math.pow(x[2] - y[2], 2);
    }
    convert.rgb.keyword = function(rgb) {
      var reversed = reverseKeywords[rgb];
      if (reversed) {
        return reversed;
      }
      var currentClosestDistance = Infinity;
      var currentClosestKeyword;
      for (var keyword in cssKeywords) {
        if (cssKeywords.hasOwnProperty(keyword)) {
          var value = cssKeywords[keyword];
          var distance = comparativeDistance(rgb, value);
          if (distance < currentClosestDistance) {
            currentClosestDistance = distance;
            currentClosestKeyword = keyword;
          }
        }
      }
      return currentClosestKeyword;
    };
    convert.keyword.rgb = function(keyword) {
      return cssKeywords[keyword];
    };
    convert.rgb.xyz = function(rgb) {
      var r = rgb[0] / 255;
      var g = rgb[1] / 255;
      var b = rgb[2] / 255;
      r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
      g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
      b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
      var x = r * 0.4124 + g * 0.3576 + b * 0.1805;
      var y = r * 0.2126 + g * 0.7152 + b * 0.0722;
      var z = r * 0.0193 + g * 0.1192 + b * 0.9505;
      return [x * 100, y * 100, z * 100];
    };
    convert.rgb.lab = function(rgb) {
      var xyz = convert.rgb.xyz(rgb);
      var x = xyz[0];
      var y = xyz[1];
      var z = xyz[2];
      var l;
      var a;
      var b;
      x /= 95.047;
      y /= 100;
      z /= 108.883;
      x = x > 8856e-6 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
      y = y > 8856e-6 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
      z = z > 8856e-6 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;
      l = 116 * y - 16;
      a = 500 * (x - y);
      b = 200 * (y - z);
      return [l, a, b];
    };
    convert.hsl.rgb = function(hsl) {
      var h = hsl[0] / 360;
      var s = hsl[1] / 100;
      var l = hsl[2] / 100;
      var t1;
      var t2;
      var t3;
      var rgb;
      var val;
      if (s === 0) {
        val = l * 255;
        return [val, val, val];
      }
      if (l < 0.5) {
        t2 = l * (1 + s);
      } else {
        t2 = l + s - l * s;
      }
      t1 = 2 * l - t2;
      rgb = [0, 0, 0];
      for (var i = 0; i < 3; i++) {
        t3 = h + 1 / 3 * -(i - 1);
        if (t3 < 0) {
          t3++;
        }
        if (t3 > 1) {
          t3--;
        }
        if (6 * t3 < 1) {
          val = t1 + (t2 - t1) * 6 * t3;
        } else if (2 * t3 < 1) {
          val = t2;
        } else if (3 * t3 < 2) {
          val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
        } else {
          val = t1;
        }
        rgb[i] = val * 255;
      }
      return rgb;
    };
    convert.hsl.hsv = function(hsl) {
      var h = hsl[0];
      var s = hsl[1] / 100;
      var l = hsl[2] / 100;
      var smin = s;
      var lmin = Math.max(l, 0.01);
      var sv;
      var v;
      l *= 2;
      s *= l <= 1 ? l : 2 - l;
      smin *= lmin <= 1 ? lmin : 2 - lmin;
      v = (l + s) / 2;
      sv = l === 0 ? 2 * smin / (lmin + smin) : 2 * s / (l + s);
      return [h, sv * 100, v * 100];
    };
    convert.hsv.rgb = function(hsv) {
      var h = hsv[0] / 60;
      var s = hsv[1] / 100;
      var v = hsv[2] / 100;
      var hi = Math.floor(h) % 6;
      var f = h - Math.floor(h);
      var p = 255 * v * (1 - s);
      var q = 255 * v * (1 - s * f);
      var t = 255 * v * (1 - s * (1 - f));
      v *= 255;
      switch (hi) {
        case 0:
          return [v, t, p];
        case 1:
          return [q, v, p];
        case 2:
          return [p, v, t];
        case 3:
          return [p, q, v];
        case 4:
          return [t, p, v];
        case 5:
          return [v, p, q];
      }
    };
    convert.hsv.hsl = function(hsv) {
      var h = hsv[0];
      var s = hsv[1] / 100;
      var v = hsv[2] / 100;
      var vmin = Math.max(v, 0.01);
      var lmin;
      var sl;
      var l;
      l = (2 - s) * v;
      lmin = (2 - s) * vmin;
      sl = s * vmin;
      sl /= lmin <= 1 ? lmin : 2 - lmin;
      sl = sl || 0;
      l /= 2;
      return [h, sl * 100, l * 100];
    };
    convert.hwb.rgb = function(hwb) {
      var h = hwb[0] / 360;
      var wh = hwb[1] / 100;
      var bl = hwb[2] / 100;
      var ratio = wh + bl;
      var i;
      var v;
      var f;
      var n;
      if (ratio > 1) {
        wh /= ratio;
        bl /= ratio;
      }
      i = Math.floor(6 * h);
      v = 1 - bl;
      f = 6 * h - i;
      if ((i & 1) !== 0) {
        f = 1 - f;
      }
      n = wh + f * (v - wh);
      var r;
      var g;
      var b;
      switch (i) {
        default:
        case 6:
        case 0:
          r = v;
          g = n;
          b = wh;
          break;
        case 1:
          r = n;
          g = v;
          b = wh;
          break;
        case 2:
          r = wh;
          g = v;
          b = n;
          break;
        case 3:
          r = wh;
          g = n;
          b = v;
          break;
        case 4:
          r = n;
          g = wh;
          b = v;
          break;
        case 5:
          r = v;
          g = wh;
          b = n;
          break;
      }
      return [r * 255, g * 255, b * 255];
    };
    convert.cmyk.rgb = function(cmyk) {
      var c = cmyk[0] / 100;
      var m = cmyk[1] / 100;
      var y = cmyk[2] / 100;
      var k = cmyk[3] / 100;
      var r;
      var g;
      var b;
      r = 1 - Math.min(1, c * (1 - k) + k);
      g = 1 - Math.min(1, m * (1 - k) + k);
      b = 1 - Math.min(1, y * (1 - k) + k);
      return [r * 255, g * 255, b * 255];
    };
    convert.xyz.rgb = function(xyz) {
      var x = xyz[0] / 100;
      var y = xyz[1] / 100;
      var z = xyz[2] / 100;
      var r;
      var g;
      var b;
      r = x * 3.2406 + y * -1.5372 + z * -0.4986;
      g = x * -0.9689 + y * 1.8758 + z * 0.0415;
      b = x * 0.0557 + y * -0.204 + z * 1.057;
      r = r > 31308e-7 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : r * 12.92;
      g = g > 31308e-7 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : g * 12.92;
      b = b > 31308e-7 ? 1.055 * Math.pow(b, 1 / 2.4) - 0.055 : b * 12.92;
      r = Math.min(Math.max(0, r), 1);
      g = Math.min(Math.max(0, g), 1);
      b = Math.min(Math.max(0, b), 1);
      return [r * 255, g * 255, b * 255];
    };
    convert.xyz.lab = function(xyz) {
      var x = xyz[0];
      var y = xyz[1];
      var z = xyz[2];
      var l;
      var a;
      var b;
      x /= 95.047;
      y /= 100;
      z /= 108.883;
      x = x > 8856e-6 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
      y = y > 8856e-6 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
      z = z > 8856e-6 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;
      l = 116 * y - 16;
      a = 500 * (x - y);
      b = 200 * (y - z);
      return [l, a, b];
    };
    convert.lab.xyz = function(lab) {
      var l = lab[0];
      var a = lab[1];
      var b = lab[2];
      var x;
      var y;
      var z;
      y = (l + 16) / 116;
      x = a / 500 + y;
      z = y - b / 200;
      var y2 = Math.pow(y, 3);
      var x2 = Math.pow(x, 3);
      var z2 = Math.pow(z, 3);
      y = y2 > 8856e-6 ? y2 : (y - 16 / 116) / 7.787;
      x = x2 > 8856e-6 ? x2 : (x - 16 / 116) / 7.787;
      z = z2 > 8856e-6 ? z2 : (z - 16 / 116) / 7.787;
      x *= 95.047;
      y *= 100;
      z *= 108.883;
      return [x, y, z];
    };
    convert.lab.lch = function(lab) {
      var l = lab[0];
      var a = lab[1];
      var b = lab[2];
      var hr;
      var h;
      var c;
      hr = Math.atan2(b, a);
      h = hr * 360 / 2 / Math.PI;
      if (h < 0) {
        h += 360;
      }
      c = Math.sqrt(a * a + b * b);
      return [l, c, h];
    };
    convert.lch.lab = function(lch) {
      var l = lch[0];
      var c = lch[1];
      var h = lch[2];
      var a;
      var b;
      var hr;
      hr = h / 360 * 2 * Math.PI;
      a = c * Math.cos(hr);
      b = c * Math.sin(hr);
      return [l, a, b];
    };
    convert.rgb.ansi16 = function(args) {
      var r = args[0];
      var g = args[1];
      var b = args[2];
      var value = 1 in arguments ? arguments[1] : convert.rgb.hsv(args)[2];
      value = Math.round(value / 50);
      if (value === 0) {
        return 30;
      }
      var ansi = 30 + (Math.round(b / 255) << 2 | Math.round(g / 255) << 1 | Math.round(r / 255));
      if (value === 2) {
        ansi += 60;
      }
      return ansi;
    };
    convert.hsv.ansi16 = function(args) {
      return convert.rgb.ansi16(convert.hsv.rgb(args), args[2]);
    };
    convert.rgb.ansi256 = function(args) {
      var r = args[0];
      var g = args[1];
      var b = args[2];
      if (r === g && g === b) {
        if (r < 8) {
          return 16;
        }
        if (r > 248) {
          return 231;
        }
        return Math.round((r - 8) / 247 * 24) + 232;
      }
      var ansi = 16 + 36 * Math.round(r / 255 * 5) + 6 * Math.round(g / 255 * 5) + Math.round(b / 255 * 5);
      return ansi;
    };
    convert.ansi16.rgb = function(args) {
      var color = args % 10;
      if (color === 0 || color === 7) {
        if (args > 50) {
          color += 3.5;
        }
        color = color / 10.5 * 255;
        return [color, color, color];
      }
      var mult = (~~(args > 50) + 1) * 0.5;
      var r = (color & 1) * mult * 255;
      var g = (color >> 1 & 1) * mult * 255;
      var b = (color >> 2 & 1) * mult * 255;
      return [r, g, b];
    };
    convert.ansi256.rgb = function(args) {
      if (args >= 232) {
        var c = (args - 232) * 10 + 8;
        return [c, c, c];
      }
      args -= 16;
      var rem;
      var r = Math.floor(args / 36) / 5 * 255;
      var g = Math.floor((rem = args % 36) / 6) / 5 * 255;
      var b = rem % 6 / 5 * 255;
      return [r, g, b];
    };
    convert.rgb.hex = function(args) {
      var integer = ((Math.round(args[0]) & 255) << 16) + ((Math.round(args[1]) & 255) << 8) + (Math.round(args[2]) & 255);
      var string = integer.toString(16).toUpperCase();
      return "000000".substring(string.length) + string;
    };
    convert.hex.rgb = function(args) {
      var match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i);
      if (!match) {
        return [0, 0, 0];
      }
      var colorString = match[0];
      if (match[0].length === 3) {
        colorString = colorString.split("").map(function(char) {
          return char + char;
        }).join("");
      }
      var integer = parseInt(colorString, 16);
      var r = integer >> 16 & 255;
      var g = integer >> 8 & 255;
      var b = integer & 255;
      return [r, g, b];
    };
    convert.rgb.hcg = function(rgb) {
      var r = rgb[0] / 255;
      var g = rgb[1] / 255;
      var b = rgb[2] / 255;
      var max = Math.max(Math.max(r, g), b);
      var min = Math.min(Math.min(r, g), b);
      var chroma = max - min;
      var grayscale;
      var hue;
      if (chroma < 1) {
        grayscale = min / (1 - chroma);
      } else {
        grayscale = 0;
      }
      if (chroma <= 0) {
        hue = 0;
      } else if (max === r) {
        hue = (g - b) / chroma % 6;
      } else if (max === g) {
        hue = 2 + (b - r) / chroma;
      } else {
        hue = 4 + (r - g) / chroma + 4;
      }
      hue /= 6;
      hue %= 1;
      return [hue * 360, chroma * 100, grayscale * 100];
    };
    convert.hsl.hcg = function(hsl) {
      var s = hsl[1] / 100;
      var l = hsl[2] / 100;
      var c = 1;
      var f = 0;
      if (l < 0.5) {
        c = 2 * s * l;
      } else {
        c = 2 * s * (1 - l);
      }
      if (c < 1) {
        f = (l - 0.5 * c) / (1 - c);
      }
      return [hsl[0], c * 100, f * 100];
    };
    convert.hsv.hcg = function(hsv) {
      var s = hsv[1] / 100;
      var v = hsv[2] / 100;
      var c = s * v;
      var f = 0;
      if (c < 1) {
        f = (v - c) / (1 - c);
      }
      return [hsv[0], c * 100, f * 100];
    };
    convert.hcg.rgb = function(hcg) {
      var h = hcg[0] / 360;
      var c = hcg[1] / 100;
      var g = hcg[2] / 100;
      if (c === 0) {
        return [g * 255, g * 255, g * 255];
      }
      var pure = [0, 0, 0];
      var hi = h % 1 * 6;
      var v = hi % 1;
      var w = 1 - v;
      var mg = 0;
      switch (Math.floor(hi)) {
        case 0:
          pure[0] = 1;
          pure[1] = v;
          pure[2] = 0;
          break;
        case 1:
          pure[0] = w;
          pure[1] = 1;
          pure[2] = 0;
          break;
        case 2:
          pure[0] = 0;
          pure[1] = 1;
          pure[2] = v;
          break;
        case 3:
          pure[0] = 0;
          pure[1] = w;
          pure[2] = 1;
          break;
        case 4:
          pure[0] = v;
          pure[1] = 0;
          pure[2] = 1;
          break;
        default:
          pure[0] = 1;
          pure[1] = 0;
          pure[2] = w;
      }
      mg = (1 - c) * g;
      return [
        (c * pure[0] + mg) * 255,
        (c * pure[1] + mg) * 255,
        (c * pure[2] + mg) * 255
      ];
    };
    convert.hcg.hsv = function(hcg) {
      var c = hcg[1] / 100;
      var g = hcg[2] / 100;
      var v = c + g * (1 - c);
      var f = 0;
      if (v > 0) {
        f = c / v;
      }
      return [hcg[0], f * 100, v * 100];
    };
    convert.hcg.hsl = function(hcg) {
      var c = hcg[1] / 100;
      var g = hcg[2] / 100;
      var l = g * (1 - c) + 0.5 * c;
      var s = 0;
      if (l > 0 && l < 0.5) {
        s = c / (2 * l);
      } else if (l >= 0.5 && l < 1) {
        s = c / (2 * (1 - l));
      }
      return [hcg[0], s * 100, l * 100];
    };
    convert.hcg.hwb = function(hcg) {
      var c = hcg[1] / 100;
      var g = hcg[2] / 100;
      var v = c + g * (1 - c);
      return [hcg[0], (v - c) * 100, (1 - v) * 100];
    };
    convert.hwb.hcg = function(hwb) {
      var w = hwb[1] / 100;
      var b = hwb[2] / 100;
      var v = 1 - b;
      var c = v - w;
      var g = 0;
      if (c < 1) {
        g = (v - c) / (1 - c);
      }
      return [hwb[0], c * 100, g * 100];
    };
    convert.apple.rgb = function(apple) {
      return [apple[0] / 65535 * 255, apple[1] / 65535 * 255, apple[2] / 65535 * 255];
    };
    convert.rgb.apple = function(rgb) {
      return [rgb[0] / 255 * 65535, rgb[1] / 255 * 65535, rgb[2] / 255 * 65535];
    };
    convert.gray.rgb = function(args) {
      return [args[0] / 100 * 255, args[0] / 100 * 255, args[0] / 100 * 255];
    };
    convert.gray.hsl = convert.gray.hsv = function(args) {
      return [0, 0, args[0]];
    };
    convert.gray.hwb = function(gray) {
      return [0, 100, gray[0]];
    };
    convert.gray.cmyk = function(gray) {
      return [0, 0, 0, gray[0]];
    };
    convert.gray.lab = function(gray) {
      return [gray[0], 0, 0];
    };
    convert.gray.hex = function(gray) {
      var val = Math.round(gray[0] / 100 * 255) & 255;
      var integer = (val << 16) + (val << 8) + val;
      var string = integer.toString(16).toUpperCase();
      return "000000".substring(string.length) + string;
    };
    convert.rgb.gray = function(rgb) {
      var val = (rgb[0] + rgb[1] + rgb[2]) / 3;
      return [val / 255 * 100];
    };
  }
});

// ../../../../node_modules/color-convert/route.js
var require_route = __commonJS({
  "../../../../node_modules/color-convert/route.js"(exports2, module2) {
    "use strict";
    var conversions = require_conversions();
    function buildGraph() {
      var graph = {};
      var models = Object.keys(conversions);
      for (var len = models.length, i = 0; i < len; i++) {
        graph[models[i]] = {
          // http://jsperf.com/1-vs-infinity
          // micro-opt, but this is simple.
          distance: -1,
          parent: null
        };
      }
      return graph;
    }
    function deriveBFS(fromModel) {
      var graph = buildGraph();
      var queue = [fromModel];
      graph[fromModel].distance = 0;
      while (queue.length) {
        var current = queue.pop();
        var adjacents = Object.keys(conversions[current]);
        for (var len = adjacents.length, i = 0; i < len; i++) {
          var adjacent = adjacents[i];
          var node = graph[adjacent];
          if (node.distance === -1) {
            node.distance = graph[current].distance + 1;
            node.parent = current;
            queue.unshift(adjacent);
          }
        }
      }
      return graph;
    }
    function link(from, to) {
      return function(args) {
        return to(from(args));
      };
    }
    function wrapConversion(toModel, graph) {
      var path2 = [graph[toModel].parent, toModel];
      var fn = conversions[graph[toModel].parent][toModel];
      var cur = graph[toModel].parent;
      while (graph[cur].parent) {
        path2.unshift(graph[cur].parent);
        fn = link(conversions[graph[cur].parent][cur], fn);
        cur = graph[cur].parent;
      }
      fn.conversion = path2;
      return fn;
    }
    module2.exports = function(fromModel) {
      var graph = deriveBFS(fromModel);
      var conversion = {};
      var models = Object.keys(graph);
      for (var len = models.length, i = 0; i < len; i++) {
        var toModel = models[i];
        var node = graph[toModel];
        if (node.parent === null) {
          continue;
        }
        conversion[toModel] = wrapConversion(toModel, graph);
      }
      return conversion;
    };
  }
});

// ../../../../node_modules/color-convert/index.js
var require_color_convert = __commonJS({
  "../../../../node_modules/color-convert/index.js"(exports2, module2) {
    "use strict";
    var conversions = require_conversions();
    var route = require_route();
    var convert = {};
    var models = Object.keys(conversions);
    function wrapRaw(fn) {
      var wrappedFn = function(args) {
        if (args === void 0 || args === null) {
          return args;
        }
        if (arguments.length > 1) {
          args = Array.prototype.slice.call(arguments);
        }
        return fn(args);
      };
      if ("conversion" in fn) {
        wrappedFn.conversion = fn.conversion;
      }
      return wrappedFn;
    }
    function wrapRounded(fn) {
      var wrappedFn = function(args) {
        if (args === void 0 || args === null) {
          return args;
        }
        if (arguments.length > 1) {
          args = Array.prototype.slice.call(arguments);
        }
        var result = fn(args);
        if (typeof result === "object") {
          for (var len = result.length, i = 0; i < len; i++) {
            result[i] = Math.round(result[i]);
          }
        }
        return result;
      };
      if ("conversion" in fn) {
        wrappedFn.conversion = fn.conversion;
      }
      return wrappedFn;
    }
    models.forEach(function(fromModel) {
      convert[fromModel] = {};
      Object.defineProperty(convert[fromModel], "channels", { value: conversions[fromModel].channels });
      Object.defineProperty(convert[fromModel], "labels", { value: conversions[fromModel].labels });
      var routes = route(fromModel);
      var routeModels = Object.keys(routes);
      routeModels.forEach(function(toModel) {
        var fn = routes[toModel];
        convert[fromModel][toModel] = wrapRounded(fn);
        convert[fromModel][toModel].raw = wrapRaw(fn);
      });
    });
    module2.exports = convert;
  }
});

// ../../../../node_modules/ansi-styles/index.js
var require_ansi_styles = __commonJS({
  "../../../../node_modules/ansi-styles/index.js"(exports2, module2) {
    "use strict";
    var colorConvert = require_color_convert();
    var wrapAnsi16 = (fn, offset) => function() {
      const code = fn.apply(colorConvert, arguments);
      return `\x1B[${code + offset}m`;
    };
    var wrapAnsi256 = (fn, offset) => function() {
      const code = fn.apply(colorConvert, arguments);
      return `\x1B[${38 + offset};5;${code}m`;
    };
    var wrapAnsi16m = (fn, offset) => function() {
      const rgb = fn.apply(colorConvert, arguments);
      return `\x1B[${38 + offset};2;${rgb[0]};${rgb[1]};${rgb[2]}m`;
    };
    function assembleStyles() {
      const codes = /* @__PURE__ */ new Map();
      const styles = {
        modifier: {
          reset: [0, 0],
          // 21 isn't widely supported and 22 does the same thing
          bold: [1, 22],
          dim: [2, 22],
          italic: [3, 23],
          underline: [4, 24],
          inverse: [7, 27],
          hidden: [8, 28],
          strikethrough: [9, 29]
        },
        color: {
          black: [30, 39],
          red: [31, 39],
          green: [32, 39],
          yellow: [33, 39],
          blue: [34, 39],
          magenta: [35, 39],
          cyan: [36, 39],
          white: [37, 39],
          gray: [90, 39],
          // Bright color
          redBright: [91, 39],
          greenBright: [92, 39],
          yellowBright: [93, 39],
          blueBright: [94, 39],
          magentaBright: [95, 39],
          cyanBright: [96, 39],
          whiteBright: [97, 39]
        },
        bgColor: {
          bgBlack: [40, 49],
          bgRed: [41, 49],
          bgGreen: [42, 49],
          bgYellow: [43, 49],
          bgBlue: [44, 49],
          bgMagenta: [45, 49],
          bgCyan: [46, 49],
          bgWhite: [47, 49],
          // Bright color
          bgBlackBright: [100, 49],
          bgRedBright: [101, 49],
          bgGreenBright: [102, 49],
          bgYellowBright: [103, 49],
          bgBlueBright: [104, 49],
          bgMagentaBright: [105, 49],
          bgCyanBright: [106, 49],
          bgWhiteBright: [107, 49]
        }
      };
      styles.color.grey = styles.color.gray;
      for (const groupName of Object.keys(styles)) {
        const group = styles[groupName];
        for (const styleName of Object.keys(group)) {
          const style = group[styleName];
          styles[styleName] = {
            open: `\x1B[${style[0]}m`,
            close: `\x1B[${style[1]}m`
          };
          group[styleName] = styles[styleName];
          codes.set(style[0], style[1]);
        }
        Object.defineProperty(styles, groupName, {
          value: group,
          enumerable: false
        });
        Object.defineProperty(styles, "codes", {
          value: codes,
          enumerable: false
        });
      }
      const ansi2ansi = (n) => n;
      const rgb2rgb = (r, g, b) => [r, g, b];
      styles.color.close = "\x1B[39m";
      styles.bgColor.close = "\x1B[49m";
      styles.color.ansi = {
        ansi: wrapAnsi16(ansi2ansi, 0)
      };
      styles.color.ansi256 = {
        ansi256: wrapAnsi256(ansi2ansi, 0)
      };
      styles.color.ansi16m = {
        rgb: wrapAnsi16m(rgb2rgb, 0)
      };
      styles.bgColor.ansi = {
        ansi: wrapAnsi16(ansi2ansi, 10)
      };
      styles.bgColor.ansi256 = {
        ansi256: wrapAnsi256(ansi2ansi, 10)
      };
      styles.bgColor.ansi16m = {
        rgb: wrapAnsi16m(rgb2rgb, 10)
      };
      for (let key of Object.keys(colorConvert)) {
        if (typeof colorConvert[key] !== "object") {
          continue;
        }
        const suite = colorConvert[key];
        if (key === "ansi16") {
          key = "ansi";
        }
        if ("ansi16" in suite) {
          styles.color.ansi[key] = wrapAnsi16(suite.ansi16, 0);
          styles.bgColor.ansi[key] = wrapAnsi16(suite.ansi16, 10);
        }
        if ("ansi256" in suite) {
          styles.color.ansi256[key] = wrapAnsi256(suite.ansi256, 0);
          styles.bgColor.ansi256[key] = wrapAnsi256(suite.ansi256, 10);
        }
        if ("rgb" in suite) {
          styles.color.ansi16m[key] = wrapAnsi16m(suite.rgb, 0);
          styles.bgColor.ansi16m[key] = wrapAnsi16m(suite.rgb, 10);
        }
      }
      return styles;
    }
    Object.defineProperty(module2, "exports", {
      enumerable: true,
      get: assembleStyles
    });
  }
});

// ../../../../node_modules/has-flag/index.js
var require_has_flag = __commonJS({
  "../../../../node_modules/has-flag/index.js"(exports2, module2) {
    "use strict";
    module2.exports = (flag, argv) => {
      argv = argv || process.argv;
      const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
      const pos = argv.indexOf(prefix + flag);
      const terminatorPos = argv.indexOf("--");
      return pos !== -1 && (terminatorPos === -1 ? true : pos < terminatorPos);
    };
  }
});

// ../../../../node_modules/supports-color/index.js
var require_supports_color = __commonJS({
  "../../../../node_modules/supports-color/index.js"(exports2, module2) {
    "use strict";
    var os = require("os");
    var hasFlag = require_has_flag();
    var env = process.env;
    var forceColor;
    if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false")) {
      forceColor = false;
    } else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) {
      forceColor = true;
    }
    if ("FORCE_COLOR" in env) {
      forceColor = env.FORCE_COLOR.length === 0 || parseInt(env.FORCE_COLOR, 10) !== 0;
    }
    function translateLevel(level) {
      if (level === 0) {
        return false;
      }
      return {
        level,
        hasBasic: true,
        has256: level >= 2,
        has16m: level >= 3
      };
    }
    function supportsColor(stream) {
      if (forceColor === false) {
        return 0;
      }
      if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
        return 3;
      }
      if (hasFlag("color=256")) {
        return 2;
      }
      if (stream && !stream.isTTY && forceColor !== true) {
        return 0;
      }
      const min = forceColor ? 1 : 0;
      if (process.platform === "win32") {
        const osRelease = os.release().split(".");
        if (Number(process.versions.node.split(".")[0]) >= 8 && Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
          return Number(osRelease[2]) >= 14931 ? 3 : 2;
        }
        return 1;
      }
      if ("CI" in env) {
        if (["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI"].some((sign) => sign in env) || env.CI_NAME === "codeship") {
          return 1;
        }
        return min;
      }
      if ("TEAMCITY_VERSION" in env) {
        return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
      }
      if (env.COLORTERM === "truecolor") {
        return 3;
      }
      if ("TERM_PROGRAM" in env) {
        const version = parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
        switch (env.TERM_PROGRAM) {
          case "iTerm.app":
            return version >= 3 ? 3 : 2;
          case "Apple_Terminal":
            return 2;
        }
      }
      if (/-256(color)?$/i.test(env.TERM)) {
        return 2;
      }
      if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
        return 1;
      }
      if ("COLORTERM" in env) {
        return 1;
      }
      if (env.TERM === "dumb") {
        return min;
      }
      return min;
    }
    function getSupportLevel(stream) {
      const level = supportsColor(stream);
      return translateLevel(level);
    }
    module2.exports = {
      supportsColor: getSupportLevel,
      stdout: getSupportLevel(process.stdout),
      stderr: getSupportLevel(process.stderr)
    };
  }
});

// ../../../../node_modules/chalk/templates.js
var require_templates = __commonJS({
  "../../../../node_modules/chalk/templates.js"(exports2, module2) {
    "use strict";
    var TEMPLATE_REGEX = /(?:\\(u[a-f\d]{4}|x[a-f\d]{2}|.))|(?:\{(~)?(\w+(?:\([^)]*\))?(?:\.\w+(?:\([^)]*\))?)*)(?:[ \t]|(?=\r?\n)))|(\})|((?:.|[\r\n\f])+?)/gi;
    var STYLE_REGEX = /(?:^|\.)(\w+)(?:\(([^)]*)\))?/g;
    var STRING_REGEX = /^(['"])((?:\\.|(?!\1)[^\\])*)\1$/;
    var ESCAPE_REGEX = /\\(u[a-f\d]{4}|x[a-f\d]{2}|.)|([^\\])/gi;
    var ESCAPES = /* @__PURE__ */ new Map([
      ["n", "\n"],
      ["r", "\r"],
      ["t", "	"],
      ["b", "\b"],
      ["f", "\f"],
      ["v", "\v"],
      ["0", "\0"],
      ["\\", "\\"],
      ["e", "\x1B"],
      ["a", "\x07"]
    ]);
    function unescape(c) {
      if (c[0] === "u" && c.length === 5 || c[0] === "x" && c.length === 3) {
        return String.fromCharCode(parseInt(c.slice(1), 16));
      }
      return ESCAPES.get(c) || c;
    }
    function parseArguments(name, args) {
      const results = [];
      const chunks = args.trim().split(/\s*,\s*/g);
      let matches;
      for (const chunk of chunks) {
        if (!isNaN(chunk)) {
          results.push(Number(chunk));
        } else if (matches = chunk.match(STRING_REGEX)) {
          results.push(matches[2].replace(ESCAPE_REGEX, (m, escape, chr) => escape ? unescape(escape) : chr));
        } else {
          throw new Error(`Invalid Chalk template style argument: ${chunk} (in style '${name}')`);
        }
      }
      return results;
    }
    function parseStyle(style) {
      STYLE_REGEX.lastIndex = 0;
      const results = [];
      let matches;
      while ((matches = STYLE_REGEX.exec(style)) !== null) {
        const name = matches[1];
        if (matches[2]) {
          const args = parseArguments(name, matches[2]);
          results.push([name].concat(args));
        } else {
          results.push([name]);
        }
      }
      return results;
    }
    function buildStyle(chalk2, styles) {
      const enabled = {};
      for (const layer of styles) {
        for (const style of layer.styles) {
          enabled[style[0]] = layer.inverse ? null : style.slice(1);
        }
      }
      let current = chalk2;
      for (const styleName of Object.keys(enabled)) {
        if (Array.isArray(enabled[styleName])) {
          if (!(styleName in current)) {
            throw new Error(`Unknown Chalk style: ${styleName}`);
          }
          if (enabled[styleName].length > 0) {
            current = current[styleName].apply(current, enabled[styleName]);
          } else {
            current = current[styleName];
          }
        }
      }
      return current;
    }
    module2.exports = (chalk2, tmp) => {
      const styles = [];
      const chunks = [];
      let chunk = [];
      tmp.replace(TEMPLATE_REGEX, (m, escapeChar, inverse, style, close, chr) => {
        if (escapeChar) {
          chunk.push(unescape(escapeChar));
        } else if (style) {
          const str = chunk.join("");
          chunk = [];
          chunks.push(styles.length === 0 ? str : buildStyle(chalk2, styles)(str));
          styles.push({ inverse, styles: parseStyle(style) });
        } else if (close) {
          if (styles.length === 0) {
            throw new Error("Found extraneous } in Chalk template literal");
          }
          chunks.push(buildStyle(chalk2, styles)(chunk.join("")));
          chunk = [];
          styles.pop();
        } else {
          chunk.push(chr);
        }
      });
      chunks.push(chunk.join(""));
      if (styles.length > 0) {
        const errMsg = `Chalk template literal is missing ${styles.length} closing bracket${styles.length === 1 ? "" : "s"} (\`}\`)`;
        throw new Error(errMsg);
      }
      return chunks.join("");
    };
  }
});

// ../../../../node_modules/chalk/index.js
var require_chalk = __commonJS({
  "../../../../node_modules/chalk/index.js"(exports2, module2) {
    "use strict";
    var escapeStringRegexp = require_escape_string_regexp();
    var ansiStyles = require_ansi_styles();
    var stdoutColor = require_supports_color().stdout;
    var template = require_templates();
    var isSimpleWindowsTerm = process.platform === "win32" && !(process.env.TERM || "").toLowerCase().startsWith("xterm");
    var levelMapping = ["ansi", "ansi", "ansi256", "ansi16m"];
    var skipModels = /* @__PURE__ */ new Set(["gray"]);
    var styles = /* @__PURE__ */ Object.create(null);
    function applyOptions(obj, options) {
      options = options || {};
      const scLevel = stdoutColor ? stdoutColor.level : 0;
      obj.level = options.level === void 0 ? scLevel : options.level;
      obj.enabled = "enabled" in options ? options.enabled : obj.level > 0;
    }
    function Chalk(options) {
      if (!this || !(this instanceof Chalk) || this.template) {
        const chalk2 = {};
        applyOptions(chalk2, options);
        chalk2.template = function() {
          const args = [].slice.call(arguments);
          return chalkTag.apply(null, [chalk2.template].concat(args));
        };
        Object.setPrototypeOf(chalk2, Chalk.prototype);
        Object.setPrototypeOf(chalk2.template, chalk2);
        chalk2.template.constructor = Chalk;
        return chalk2.template;
      }
      applyOptions(this, options);
    }
    if (isSimpleWindowsTerm) {
      ansiStyles.blue.open = "\x1B[94m";
    }
    for (const key of Object.keys(ansiStyles)) {
      ansiStyles[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles[key].close), "g");
      styles[key] = {
        get() {
          const codes = ansiStyles[key];
          return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, key);
        }
      };
    }
    styles.visible = {
      get() {
        return build.call(this, this._styles || [], true, "visible");
      }
    };
    ansiStyles.color.closeRe = new RegExp(escapeStringRegexp(ansiStyles.color.close), "g");
    for (const model of Object.keys(ansiStyles.color.ansi)) {
      if (skipModels.has(model)) {
        continue;
      }
      styles[model] = {
        get() {
          const level = this.level;
          return function() {
            const open = ansiStyles.color[levelMapping[level]][model].apply(null, arguments);
            const codes = {
              open,
              close: ansiStyles.color.close,
              closeRe: ansiStyles.color.closeRe
            };
            return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, model);
          };
        }
      };
    }
    ansiStyles.bgColor.closeRe = new RegExp(escapeStringRegexp(ansiStyles.bgColor.close), "g");
    for (const model of Object.keys(ansiStyles.bgColor.ansi)) {
      if (skipModels.has(model)) {
        continue;
      }
      const bgModel = "bg" + model[0].toUpperCase() + model.slice(1);
      styles[bgModel] = {
        get() {
          const level = this.level;
          return function() {
            const open = ansiStyles.bgColor[levelMapping[level]][model].apply(null, arguments);
            const codes = {
              open,
              close: ansiStyles.bgColor.close,
              closeRe: ansiStyles.bgColor.closeRe
            };
            return build.call(this, this._styles ? this._styles.concat(codes) : [codes], this._empty, model);
          };
        }
      };
    }
    var proto = Object.defineProperties(() => {
    }, styles);
    function build(_styles, _empty, key) {
      const builder = function() {
        return applyStyle.apply(builder, arguments);
      };
      builder._styles = _styles;
      builder._empty = _empty;
      const self = this;
      Object.defineProperty(builder, "level", {
        enumerable: true,
        get() {
          return self.level;
        },
        set(level) {
          self.level = level;
        }
      });
      Object.defineProperty(builder, "enabled", {
        enumerable: true,
        get() {
          return self.enabled;
        },
        set(enabled) {
          self.enabled = enabled;
        }
      });
      builder.hasGrey = this.hasGrey || key === "gray" || key === "grey";
      builder.__proto__ = proto;
      return builder;
    }
    function applyStyle() {
      const args = arguments;
      const argsLen = args.length;
      let str = String(arguments[0]);
      if (argsLen === 0) {
        return "";
      }
      if (argsLen > 1) {
        for (let a = 1; a < argsLen; a++) {
          str += " " + args[a];
        }
      }
      if (!this.enabled || this.level <= 0 || !str) {
        return this._empty ? "" : str;
      }
      const originalDim = ansiStyles.dim.open;
      if (isSimpleWindowsTerm && this.hasGrey) {
        ansiStyles.dim.open = "";
      }
      for (const code of this._styles.slice().reverse()) {
        str = code.open + str.replace(code.closeRe, code.open) + code.close;
        str = str.replace(/\r?\n/g, `${code.close}$&${code.open}`);
      }
      ansiStyles.dim.open = originalDim;
      return str;
    }
    function chalkTag(chalk2, strings) {
      if (!Array.isArray(strings)) {
        return [].slice.call(arguments, 1).join(" ");
      }
      const args = [].slice.call(arguments, 2);
      const parts = [strings.raw[0]];
      for (let i = 1; i < strings.length; i++) {
        parts.push(String(args[i - 1]).replace(/[{}\\]/g, "\\$&"));
        parts.push(String(strings.raw[i]));
      }
      return template(chalk2, parts.join(""));
    }
    Object.defineProperties(Chalk.prototype, styles);
    module2.exports = Chalk();
    module2.exports.supportsColor = stdoutColor;
    module2.exports.default = module2.exports;
  }
});

// src/cli.ts
var import_commander = __toESM(require_commander());
var import_chalk = __toESM(require_chalk());

// src/analyze.ts
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

// src/cli.ts
var program = new import_commander.Command();
program.name("ghost-deps").description("detect declared-but-unused and used-but-undeclared dependencies");
program.option("-p, --path <path>");
program.option("--json", "output JSON");
program.action(async () => {
  const opts = program.opts();
  const root = opts.path ?? process.cwd();
  const res = await analyzeProject(root);
  if (opts.json) {
    console.log(JSON.stringify(res, null, 2));
    return;
  }
  console.log(import_chalk.default.bold("\u{1F47B} Ghost dependencies (declared but unused):"));
  if (res.ghosts.length === 0) console.log(import_chalk.default.dim("none"));
  else res.ghosts.forEach((d) => console.log("-", d));
  console.log();
  console.log(import_chalk.default.bold("\u{1F9DF} Phantoms (used but not declared):"));
  if (res.phantoms.length === 0) console.log(import_chalk.default.dim("none"));
  else res.phantoms.forEach((p) => console.log("-", p));
  console.log();
  console.log(import_chalk.default.bold("\u{1FAA6} Dev deps used in production files:"));
  if (Object.keys(res.devUsedInProd).length === 0) console.log(import_chalk.default.dim("none"));
  else {
    for (const file of Object.keys(res.devUsedInProd)) {
      console.log("-", file, "\u2192", res.devUsedInProd[file].join(", "));
    }
  }
});
program.parseAsync(process.argv);
