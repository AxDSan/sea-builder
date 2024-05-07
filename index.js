#!/usr/bin/env node

// Copyright (c) 2024 AxDSan (https://www.github.com/AxDSan). All rights reserved.
// Use of this source code is governed by MIT license that can be found in the
// LICENSE file.

const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const rcedit = require("rcedit");
const postject = require("postject");
const commander = require("commander");
const JsConfuser = require("js-confuser");
const semver = require("semver");

// Use dynamic import for ESM modules
Promise.all([import("chalk"), import("figlet"), import("log4js")])
  .then(([{ default: chalk }, { default: figlet }, { default: log4js }]) => {
    const showSplash = () => {
      console.log(
        figlet.textSync("SEA-Builder", {
          font: "slant",
          horizontalLayout: "default",
          verticalLayout: "default",
        })
      );
      console.log(
        chalk.bold.cyan("SEA-Builder") +
          " - Build a Single Executable Application (SEA) from a Node.js project"
      );
      console.log("");
      console.log("Usage:");
      console.log("  sea-builder [options]");
      console.log("");
      console.log("Options:");
      console.log("  -i, --input <file>      Input file (e.g. server.ts)");
      console.log(
        "  -icon, --icon <file>    Icon file (e.g. icon.ico) [Windows only]"
      );
      console.log(
        "  -p, --platform <platform>  Target platform (win32, linux, or macos)"
      );
      console.log(
        "  -o, --obfuscate  Obfuscate the output file using js-confuser"
      );
      console.log("");
      console.log("Examples:");
      console.log("  sea-builder -i server.ts -p win32 --obfuscate");
      console.log("  sea-builder -i server.ts -p linux");
      console.log("  sea-builder -i server.ts -p macos");
      console.log("");
    };

    log4js.configure({
      appenders: {
        console: { type: "console" },
      },
      categories: {
        default: { appenders: ["console"], level: "debug" },
      },
    });

    const logger = log4js.getLogger();

    const program = new commander.Command();

    // Check Node.js version
    const nodeVersion = process.version;
    if (!semver.gte(nodeVersion, "19.9.0")) {
      console.error(
        chalk.bold.cyan("SEA-Builder") + chalk.bold.redBright(" [Unsuported Version Error]") +
        ` - The current version of Node.js (${nodeVersion}) does not support building a Single Executable Application (SEA). This feature is available from Node.js v19.9.0 onwards. Please update your Node.js version and try again.`
      );
      process.exit(1);
    }


    program
      .version("1.0.0")
      .description(
        "Build a Single Executable Application (SEA) from a Node.js project"
      )
      .requiredOption("-i, --input <file>", "Input file (e.g. server.ts)")
      .option(
        "-icon, --icon <file>",
        "Icon file (e.g. icon.ico) [Windows only]"
      )
      .requiredOption(
        "-p, --platform <platform>",
        "Target platform (win32, linux, or macos)"
      )
      .option("-o, --obfuscate", "Obfuscate the output file using js-confuser")
      .parse(process.argv);

    if (process.argv.length < 2) {
      showSplash();
      process.exit(0);
    }

    const { input, icon, platform } = program.opts();

    const outputFile = "out.js";
    const seaConfig = {
      main: outputFile,
      output: "sea-prep.blob",
      disableExperimentalSEAWarning: true,
    };

    const executableOutputPath = getExecutableOutputPath(platform);

    async function main() {
      showSplash();

      try {
        // Step 1: Bundle the Node.js project using ESBuild
        await bundleProject(input);
        logger.info(chalk.green("Bundle completed successfully"));

        // Step 2: Obfuscate the bundled output file using js-confuser (if the --obfuscate option was provided)
        if (program.opts().obfuscate) {
          await obfuscateOutputFile(outputFile);
          logger.info(chalk.green("Obfuscation completed successfully"));
        }

        // Step 2: Generate the SEA preparation blob
        await generateSEABlob(seaConfig);
        logger.info(chalk.green("SEA preparation blob generated successfully"));

        // Step 3: Create a copy of the Node.js executable
        createExecutableCopy(executableOutputPath);
        logger.info(chalk.green("Executable copy created successfully"));

        // Step 4: Set the icon of the executable using rcedit (optional, Windows only)
        await setExecutableIcon(executableOutputPath, icon, platform);
        logger.info(chalk.green("Icon set successfully"));

        // Step 5: Inject the blob into the Node.js executable
        await injectSEABlobIntoNodeExecutable(
          executableOutputPath,
          seaConfig.output
        );
        logger.info(chalk.green("SEA blob injected successfully"));
      } catch (error) {
        logger.error(
          chalk.red("An unexpected error occurred: ") + error.message
        );
        process.exit(1);
      }
    }

    async function obfuscateOutputFile(outputFile) {
      const code = fs.readFileSync(outputFile, "utf-8");
      const obfuscated = await JsConfuser.obfuscate(code, {
        target: "node",
        preset: "low",
        lock: {
          integrity: true,
          selfDefending: true,
          antiDebug: true,
        },
        calculator: true,
        compact: true,
        hexadecimalNumbers: true,
        controlFlowFlattening: 0.25,
        dispatcher: 0.5,
        duplicateLiteralsRemoval: true,
        identifierGenerator: "randomized",
        minify: false,
        movedDeclarations: true,
        objectExtraction: true,
        opaquePredicates: 0.1,
        renameVariables: true,
        renameGlobals: true,
        stringConcealing: true,
      });
      fs.writeFileSync(outputFile, obfuscated);
    }

    function getExecutableOutputPath(platform) {
      const outputDir = "dist";
      const executableName = platform === "win32" ? "out.exe" : "out";
      return path.join(outputDir, executableName);
    }

    async function bundleProject(input) {
      await esbuild.build({
        entryPoints: [input],
        bundle: true,
        platform: "node",
        outfile: outputFile,
        external: ["esbuild"], // Mark esbuild as external
      });
    }

    async function generateSEABlob(seaConfig) {
      const seaConfigPath = "sea-config.json";
      fs.writeFileSync(seaConfigPath, JSON.stringify(seaConfig, null, 2));

      const { stdout, stderr } = await spawnNode(seaConfigPath);

      if (!fs.existsSync(seaConfig.output)) {
        throw new Error(
          `SEA preparation blob file was not created: ${seaConfig.output}\nSTDERR:\n${stderr}`
        );
      }

      fs.unlinkSync(seaConfigPath);
    }

    function spawnNode(seaConfigPath) {
      return new Promise((resolve, reject) => {
        const nodeProcess = spawn("node", [
          "--experimental-sea-config",
          seaConfigPath,
        ]);

        let stdout = "";
        let stderr = "";

        nodeProcess.stdout.on("data", (data) => {
          stdout += data.toString();
        });

        nodeProcess.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        nodeProcess.on("close", (code) => {
          if (code === 0) {
            resolve({ stdout, stderr });
          } else {
            reject(
              new Error(
                `Node process exited with code ${code}\nSTDOUT:\n${stdout}\nSTDERR:\n${stderr}`
              )
            );
          }
        });

        nodeProcess.on("error", reject);
      });
    }

    function createExecutableCopy(executableOutputPath) {
      const nodeExecutablePath = process.execPath;
      const executableOutputDir = path.dirname(executableOutputPath);
      fs.mkdirSync(executableOutputDir, { recursive: true });
      fs.copyFileSync(nodeExecutablePath, executableOutputPath);
    }

    async function setExecutableIcon(executableOutputPath, icon, platform) {
      if (icon && fs.existsSync(icon) && platform === "win32") {
        await setIcon(executableOutputPath, icon);
      } else if (icon && fs.existsSync(icon) && platform !== "win32") {
        logger.warn("Icon setting is only supported on Windows.");
      } else if (!icon && platform === "win32") {
        const appDataDir = process.env.APPDATA;
        const iconPath = path.join(
          appDataDir,
          "npm",
          "node_modules",
          "sea-builder",
          "default.ico"
        );
        await setIcon(executableOutputPath, iconPath);
      } else {
        logger.info("No icon specified or not supported on this platform.");
      }
    }

    async function setIcon(executable, iconPath) {
      try {
        await rcedit(executable, {
          icon: path.resolve(iconPath),
        });
      } catch (error) {
        logger.error("Error setting icon: " + error.message);
      }
    }

    async function injectSEABlobIntoNodeExecutable(
      nodeExecutable,
      seaBlobPath
    ) {
      logger.info(`Injecting SEA blob into ${nodeExecutable}`);

      const FUSE_STRING = atob(
        "Tk9ERV9TRUFfRlVTRV9mY2U2ODBhYjJjYzQ2N2I2ZTA3MmI4YjVkZjE5OTZiMg=="
      );

      if (!fs.existsSync(seaBlobPath)) {
        throw new Error(
          `The SEA preparation blob file does not exist: ${seaBlobPath}`
        );
      }

      const seaBlobBuffer = fs.readFileSync(seaBlobPath);

      try {
        await postject.inject(nodeExecutable, "NODE_SEA_BLOB", seaBlobBuffer, {
          sentinelFuse: FUSE_STRING,
          machoSegmentName: platform === "macos" ? "NODE_SEA" : undefined,
        });
      } catch (error) {
        throw new Error(`Error injecting SEA blob: ${error.message}`);
      }

      fs.unlinkSync(seaBlobPath);
      fs.unlinkSync(outputFile);
    }
    main();
  })
  .catch((error) => {
    console.error("Failed to load modules:", error);
    process.exit(1);
  });
