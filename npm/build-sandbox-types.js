#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------------------------------
// This script is intended to generate type-definition for this module
// ---------------------------------------------------------------------------------------------------------------------

/* eslint-env node, es6 */
require('shelljs/global');

var path = require('path'),
    fs = require('fs'),
    chalk = require('chalk'),
    async = require('async'),
    shell = require('shelljs'),
    typescript = require('typescript'),
    templates = require('./utils/templates'),

    IS_WINDOWS = (/^win/).test(process.platform),
    TARGET_DIR = path.join('types', 'sandbox');

/**
 * Generate pre-test script type-def
 * @param {*} node
 * @param {*} printer
 */
function generatePreScriptSource (node, printer) {
    var source = '';
    node.forEachChild((child) => {
        var print = true,
            excludedChildren = ['_assignDefinedReadonly', 'Visualizer', 'serialize', 'deserialize', 'sanitizeURL',
                'forEachWithCallback', 'callbackHandler', 'PostmanCookieJar'],
            excludedMembers = ['iterationData', 'response', 'cookies', 'visualizer', 'expect'];
        if (child && child.name && child.name.escapedText) {
            if (child.name.escapedText === 'Postman') {
                child.members = child.members.filter((m) => {
                    if (m.name && excludedMembers.includes(m.name.escapedText)) {
                        return false;
                    }
                    return true;
                });
            }
            if (excludedChildren.includes(child.name.escapedText)) {
                print = false;
            }
        }
        if (print) {
            source += printer.printNode(
                typescript.EmitHint.Unspecified,
                child,
                node
            );
            source += '\n\n';
        }
    });
    source = source.slice(0, -2);
    source += `${templates.postmanExtensionString}\n\n`;
    return source;
}

/**
 * Generate tests script type-def
 * @param {*} node
 * @param {*} printer
 */
function generateTestScriptSource (node, printer) {
    var source = '';
    node.forEachChild((child) => {
        var print = true,
            excludedChildren = ['_assignDefinedReadonly', 'serialize', 'deserialize', 'sanitizeURL',
                'forEachWithCallback', 'callbackHandler'];
        if (child && child.name && child.name.escapedText) {
            if (excludedChildren.includes(child.name.escapedText)) {
                print = false;
            }
        }
        if (print) {
            source += printer.printNode(
                typescript.EmitHint.Unspecified,
                child,
                node
            );
            source += '\n\n';
        }
    });

    source += `${templates.postmanExtensionString}\n\n`;
    source += `${templates.cookieListExtensionString}\n\n`;
    source += `${templates.responseExtensionString}`;
    return source;
}

module.exports = function (exit) {
    console.log(chalk.yellow.bold('Generating type-definitions...'));

    try {
        // clean directory
        test('-d', TARGET_DIR) && rm('-rf', TARGET_DIR);
        shell.mkdir('-p', TARGET_DIR);
    }
    catch (e) {
        console.error(e.stack || e);
        return exit(e ? 1 : 0);
    }

    exec(`${IS_WINDOWS ? '' : 'node'} ${path.join('node_modules', '.bin', 'jsdoc')}${IS_WINDOWS ? '.cmd' : ''}` +
        ' -c .jsdoc-config-type-def-sandbox.json -p', function (code) {

        if (!code) {
            fs.readFile(`${TARGET_DIR}/index.d.ts`, function (err, contents) {
                if (err) {
                    console.log(chalk.red.bold('unable to read the type-definition file'));
                    exit(1);
                }
                var preScriptSource = '',
                    testScriptSource = '',
                    files,
                    source = contents.toString();
                source = source
                // replacing Integer with number as 'Integer' is not a valid data-type in Typescript
                    .replace(/Integer/gm, 'number')
                // replacing String[] with string[] as 'String' is not a valid data-type in Typescript
                    .replace(/String\[]/gm, 'string[]')
                // replacing Boolean[] with boolean[] as 'Boolean' is not a valid data-type in Typescript
                    .replace(/Boolean\[]/gm, 'boolean[]')
                // removing all occurrences html, as the these tags are not supported in Type-definitions
                    .replace(/<[^>]*>/gm, '')
                // replacing @link tags with the object namepath to which it was linked,
                // as these link tags are not navigable in type-definitions.
                    .replace(/\{@link (\w*)[#.]+(\w*)\}/gm, '$1.$2')
                    .replace(/\{@link (\S+)\}/gm, '$1'); // remove @link tags

                source = `${templates.heading}\n\n${templates.postmanLegacyString}\n\n${source}`;

                const node = typescript.createSourceFile(
                        '../types/sandbox/index.d.ts',
                        source,
                        typescript.ScriptTarget.Latest
                    ),

                    printer = typescript.createPrinter({
                        removeComments: false,
                        newLine: typescript.NewLineKind.LineFeed
                    });

                testScriptSource = generateTestScriptSource(node, printer);
                preScriptSource = generatePreScriptSource(node, printer);

                files = [{fileName: `${TARGET_DIR}/pre-script-sandbox-api.d.ts`, content: preScriptSource},
                    {fileName: `${TARGET_DIR}/tests-sandbox-api.d.ts`, content: testScriptSource}];

                async.each(files, function (file, callback) {
                    fs.writeFile(file.fileName, file.content, function (err) {
                        if (err) {
                            console.log(chalk.red.bold(`unable to write ${file.fileName} file'`));
                        }
                        else {
                            console.log(
                                chalk.green.bold(`${file.fileName} file saved successfully at "${TARGET_DIR}"`));
                        }

                        callback();
                    });

                }, function (err) {
                    if (err) {
                        console.log(chalk.red.bold('couldn\'t save all type-definitions. Aborting...'));
                        exit(1);
                    }
                    else {
                        console.log(chalk.green.bold('All type-definition files have been processed successfully'));
                        console.log(chalk.yellow.bold('Deleting index.d.ts files'));
                        fs.unlink(`${TARGET_DIR}/index.d.ts`, function (err) {
                            if (err) {
                                console.log(chalk.red.bold('couldn\'t delete index.d.ts file. Aborting...'));
                                exit(1);
                            }
                            else {
                                console.log(
                                    chalk.green.bold(`sandbox type-definition files available at ${TARGET_DIR}`));
                                exit(0);
                            }
                        });
                    }
                });
            });
        }
        else {
            // output status
            console.log(chalk.red.bold('unable to generate type-definition'));
            exit(code);
        }
    });
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(exit);
