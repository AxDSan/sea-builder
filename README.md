# SEA-Builder

Build a Single Executable Application (SEA) from a Node.js project with ease. SEA-Builder streamlines the process of packaging your Node.js application into a standalone executable for Windows, Linux, and macOS platforms.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://travis-ci.com/AxDSan/SEA-Builder.svg?branch=master)](https://travis-ci.com/AxDSan/SEA-Builder)
[![npm version](https://badge.fury.io/js/sea-builder.svg)](https://badge.fury.io/js/sea-builder)
[![Code Style](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Features

- **Cross-Platform Support**: Build executables for Windows, Linux, and macOS.
- **Easy to Use**: Simple command-line interface with clear usage instructions.
- **Customizable**: Set your application's icon on Windows and specify the output executable name.
- **Efficient**: Utilizes `esbuild` for fast bundling of your Node.js project.
- **Logging**: Detailed logs help you track the build process and troubleshoot issues.

## Installation

To use SEA-Builder, you must have Node.js installed on your system. Once you have Node.js, you can install SEA-Builder globally or locally in your project.

### Global Installation

```bash
npm install -g sea-builder
```

### Local Installation

```bash
npm install --save-dev sea-builder
```

## Usage

```bash
sea-builder -i server.ts -p win32
```

### Options

- `-i, --input <file>`: Input file (e.g., `server.ts`).
- `-icon, --icon <file>`: Icon file (e.g., `icon.ico`) [Windows only].
- `-p, --platform <platform>`: Target platform (`win32`, `linux`, or `macos`).

## Examples

Build for Windows:

```bash
sea-builder -i server.ts -p win32
```

Build for Linux:

```bash
sea-builder -i server.ts -p linux
```

Build for macOS:

```bash
sea-builder -i server.ts -p macos
```

## Contributing

Contributions are welcome! If you have a feature request, bug report, or a pull request, please open an issue or submit a PR.

## License

MIT © [AxDSan](https://github.com/AxDSan)

## Acknowledgments

- Thanks to the contributors who help maintain and improve this project.
- Special thanks to the creators and maintainers of the dependencies used in this project.
