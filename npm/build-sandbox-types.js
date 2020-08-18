#!/usr/bin/env node
// ---------------------------------------------------------------------------------------------------------------------
// This script is intended to generate type-definition for this module
// ---------------------------------------------------------------------------------------------------------------------

/* eslint-env node, es6 */
require('shelljs/global');

var _ = require('lodash'),
    path = require('path'),
    fs = require('fs'),
    chalk = require('chalk'),
    async = require('async'),
    shell = require('shelljs'),
    typescript = require('typescript'),
    templates = require('./utils/templates'),

    IS_WINDOWS = (/^win/).test(process.platform),
    TARGET_DIR = path.join('types', 'sandbox');

/**
 * Generate tests script type-def
 * @param {*} node
 * @param {*} printer
 */
function generateSandboxTypes (node, printer, target) {
    var source = '',
        excludeResponse = target === 'prerequest',
        collectionSDKTypesExtension = '';

    node.forEachChild((child) => {
        if (excludeResponse && _.get(child, 'name.escapedText') === 'Postman') {
            child.members = child.members.filter((m) => {
                if (m.name && m.name.escapedText === 'response') {
                    return false;
                }
                return true;
            });
        }

        source += printer.printNode(typescript.EmitHint.Unspecified, child, node);
        source += '\n\n';
    });

    source += `${templates.postmanExtensionString}\n`;

    // Any module types that needs to be extended has to be covered inside a module
    // See https://github.com/microsoft/TypeScript/issues/10859 for further details.
    collectionSDKTypesExtension = `\n${templates.cookieListExtensionString}\n`;
    !excludeResponse && (collectionSDKTypesExtension += `\n${templates.responseExtensionString}\n`);

    source += `\ndeclare module "postman-collection" {\n${collectionSDKTypesExtension}\n}\n`;

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

        if (code) {
            // output status
            console.log(chalk.red.bold('unable to generate type-definition'));
            exit(code);
        }

        fs.readFile(`${TARGET_DIR}/index.d.ts`, function (err, contents) {
            if (err) {
                console.log(chalk.red.bold('unable to read the type-definition file'));
                exit(1);
            }

            var node,
                source,
                printer,
                preScriptSource,
                testScriptSource,
                collectionSDKTypes;

            source = contents.toString()
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
                // remove @link tags
                .replace(/\{@link (\S+)\}/gm, '$1');

            source = `${templates.heading}\n\n${templates.postmanLegacyString}\n\n${source}`;

            node = typescript.createSourceFile(
                '../types/sandbox/index.d.ts',
                source,
                typescript.ScriptTarget.Latest
            );

            printer = typescript.createPrinter({
                removeComments: false,
                newLine: typescript.NewLineKind.LineFeed
            });

            // Since we are referencing some types from Postman Collection lib, those types needs to imported.
            // See https://stackoverflow.com/a/51114250
            collectionSDKTypes = ['CookieList', 'Request', 'Response', 'VariableScope'];

            node.forEachChild((child) => {
                child.members && child.members.forEach((c) => {
                    // takes care of properties referencing CollectionSDK types
                    if (c.type && c.type.typeName) {
                        let currentType = c.type.typeName.escapedText;
                        if (collectionSDKTypes.includes(currentType)) {
                            c.type.typeName.escapedText = `import("postman-collection").${currentType}`;
                        }
                    }
                    // takes care of functions with parameters referencing CollectionSDK types
                    else if (c.parameters && c.parameters.length > 0) {
                        c.parameters.forEach((p) => {
                            if (p.type && p.type.types && p.type.types.length) {
                                p.type.types.forEach((t) => {
                                    if (t.typeName) {
                                        let currentType = t.typeName.escapedText;
                                        if (collectionSDKTypes.includes(currentType)) {
                                            t.typeName.escapedText = `import("postman-collection").${currentType}`;
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
            });

            testScriptSource = generateSandboxTypes(node, printer, 'test');
            preScriptSource = generateSandboxTypes(node, printer, 'prerequest');

            async.each([
                {fileName: `${TARGET_DIR}/prerequest.d.ts`, content: preScriptSource},
                {fileName: `${TARGET_DIR}/test.d.ts`, content: testScriptSource}
            ], function (file, callback) {
                fs.writeFile(file.fileName, file.content, function (err) {
                    if (err) {
                        console.log(chalk.red.bold(`unable to write ${file.fileName} file'`));
                    }
                    else {
                        console.log(chalk.green.bold(`${file.fileName} file saved successfully at "${TARGET_DIR}"`));
                    }

                    callback();
                });

            }, function (err) {
                if (err) {
                    console.log(chalk.red.bold('couldn\'t save all type-definitions. Aborting...'));
                    exit(1);
                }

                console.log(chalk.green.bold('All type-definition files have been processed successfully'));
                console.log(chalk.yellow.bold('Deleting index.d.ts files'));

                fs.unlink(`${TARGET_DIR}/index.d.ts`, function (err) {
                    if (err) {
                        console.log(chalk.red.bold('couldn\'t delete index.d.ts file. Aborting...'));
                        exit(1);
                    }

                    console.log(chalk.green.bold(`sandbox type-definition files available at ${TARGET_DIR}`));
                    exit(0);
                });
            });
        });
    });
};

// ensure we run this script exports if this is a direct stdin.tty run
!module.parent && module.exports(exit);
