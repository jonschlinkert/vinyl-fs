'use strict';

var path = require('path');

// Input/output relative paths
var inputRelative = './fixtures/';
var outputRelative = './out-fixtures/';
// Input/Output base directories
var inputBase = path.join(__dirname, '..', inputRelative);
var outputBase = path.join(__dirname, '..', outputRelative);
// Used for file tests
var inputPath = path.join(inputBase, './foo.txt');
var outputPath = path.join(outputBase, './foo.txt');
// Used for directory tests
var inputDirpath = path.join(inputBase, './foo');
var outputDirpath = path.join(outputBase, './foo');
// Used for nested tests
var inputNestedPath = path.join(inputDirpath, './foo.txt');
var outputNestedPath = path.join(outputDirpath, './foo.txt');
// Used for nested directory tests
var inputNestedDirpath = path.join(inputDirpath, './bar/baz/');
var outputNestedDirpath = path.join(outputDirpath, './bar/baz/');
// Used for rename tests
var outputRenamePath = path.join(outputBase, './foo2.txt');
// Used for not-owned tests
var notOwnedBase = path.join(inputBase, './not-owned/');
var notOwnedPath = path.join(notOwnedBase, 'not-owned.txt');
// Used for contents of files
var contents = 'Hello World!';

module.exports = {
  inputRelative: inputRelative,
  outputRelative: outputRelative,
  inputBase: inputBase,
  outputBase: outputBase,
  inputPath: inputPath,
  outputPath: outputPath,
  inputDirpath: inputDirpath,
  outputDirpath: outputDirpath,
  inputNestedPath: inputNestedPath,
  outputNestedPath: outputNestedPath,
  outputRenamePath: outputRenamePath,
  inputNestedDirpath: inputNestedDirpath,
  outputNestedDirpath: outputNestedDirpath,
  notOwnedBase: notOwnedBase,
  notOwnedPath: notOwnedPath,
  contents: contents,
};
