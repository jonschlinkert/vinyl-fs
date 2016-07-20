'use strict';

var fs = require('graceful-fs');
var File = require('vinyl');
var expect = require('expect');
var miss = require('mississippi');

var vfs = require('../');

var cleanup = require('./utils/cleanup');
var statMode = require('./utils/stat-mode');
var mockError = require('./utils/mock-error');
var isWindows = require('./utils/is-windows');
var applyUmask = require('./utils/apply-umask');
var isDirectory = require('./utils/is-directory-mock');
var testConstants = require('./utils/test-constants');

var from = miss.from;
var pipe = miss.pipe;
var concat = miss.concat;

var inputBase = testConstants.inputBase;
var outputBase = testConstants.outputBase;
var inputPath = testConstants.inputPath;
var outputPath = testConstants.outputPath;
var inputDirpath = testConstants.inputDirpath;
var outputDirpath = testConstants.outputDirpath;
var inputNestedPath = testConstants.inputNestedPath;
var outputNestedPath = testConstants.outputNestedPath;
var contents = testConstants.contents;

var clean = cleanup([outputBase]);

describe('.dest() with custom modes', function() {

  beforeEach(clean);
  afterEach(clean);

  it('should set the mode of a written buffer file if set on the vinyl object', function(done) {
    // Changing the mode of a file is not supported by node.js in Windows.
    // Windows is treated as though it does not have permission to make this operation.
    if (isWindows) {
      this.skip();
      return;
    }

    var expectedMode = applyUmask('677');

    var file = new File({
      base: inputBase,
      path: inputPath,
      contents: new Buffer(contents),
      stat: {
        mode: expectedMode,
      },
    });

    function assert() {
      expect(statMode(outputPath)).toEqual(expectedMode);
    }

    pipe([
      from.obj([file]),
      vfs.dest(outputBase, { cwd: __dirname }),
      concat(assert),
    ], done);
  });

  it('should set the sticky bit on the mode of a written stream file if set on the vinyl object', function(done) {
    if (isWindows) {
      this.skip();
      return;
    }

    var expectedMode = applyUmask('1677');

    var file = new File({
      base: inputBase,
      path: inputPath,
      contents: from([contents]),
      stat: {
        mode: expectedMode,
      },
    });

    function assert() {
      expect(statMode(outputPath)).toEqual(expectedMode);
    }

    pipe([
      from.obj([file]),
      vfs.dest(outputBase, { cwd: __dirname }),
      concat(assert),
    ], done);
  });

  it('should set the mode of a written stream file if set on the vinyl object', function(done) {
    if (isWindows) {
      this.skip();
      return;
    }

    var expectedMode = applyUmask('677');

    var file = new File({
      base: inputBase,
      path: inputPath,
      contents: from([contents]),
      stat: {
        mode: expectedMode,
      },
    });

    function assert() {
      expect(statMode(outputPath)).toEqual(expectedMode);
    }

    pipe([
      from.obj([file]),
      vfs.dest(outputBase, { cwd: __dirname }),
      concat(assert),
    ], done);
  });

  it('should set the mode of a written directory if set on the vinyl object', function(done) {
    if (isWindows) {
      this.skip();
      return;
    }

    var expectedMode = applyUmask('677');

    var file = new File({
      base: inputBase,
      path: inputDirpath,
      contents: null,
      stat: {
        isDirectory: isDirectory,
        mode: expectedMode,
      },
    });

    function assert() {
      expect(statMode(outputDirpath)).toEqual(expectedMode);
    }

    pipe([
      from.obj([file]),
      vfs.dest(outputBase, { cwd: __dirname }),
      concat(assert),
    ], done);
  });

  it('should set sticky bit on the mode of a written directory if set on the vinyl object', function(done) {
    if (isWindows) {
      this.skip();
      return;
    }

    var expectedMode = applyUmask('1677');

    var file = new File({
      base: inputBase,
      path: inputDirpath,
      contents: null,
      stat: {
        isDirectory: isDirectory,
        mode: expectedMode,
      },
    });

    function assert() {
      expect(statMode(outputDirpath)).toEqual(expectedMode);
    }

    pipe([
      from.obj([file]),
      vfs.dest(outputBase, { cwd: __dirname }),
      concat(assert),
    ], done);
  });

  it('should write new files with the mode specified in options', function(done) {
    if (isWindows) {
      this.skip();
      return;
    }

    var expectedMode = applyUmask('777');

    var file = new File({
      base: inputBase,
      path: inputPath,
      contents: new Buffer(contents),
    });

    function assert() {
      expect(statMode(outputPath)).toEqual(expectedMode);
    }

    pipe([
      from.obj([file]),
      vfs.dest(outputBase, { cwd: __dirname, mode: expectedMode }),
      concat(assert),
    ], done);
  });

  it('should update file mode to match the vinyl mode', function(done) {
    if (isWindows) {
      this.skip();
      return;
    }

    var startMode = applyUmask('655');
    var expectedMode = applyUmask('722');

    var file = new File({
      base: inputBase,
      path: inputPath,
      contents: new Buffer(contents),
      stat: {
        mode: expectedMode,
      },
    });

    function assert() {
      expect(statMode(outputPath)).toEqual(expectedMode);
    }

    fs.mkdirSync(outputBase);
    fs.closeSync(fs.openSync(outputPath, 'w'));
    fs.chmodSync(outputPath, startMode);

    pipe([
      from.obj([file]),
      vfs.dest(outputBase, { cwd: __dirname }),
      concat(assert),
    ], done);
  });

  it('should update directory mode to match the vinyl mode', function(done) {
    if (isWindows) {
      this.skip();
      return;
    }

    var startMode = applyUmask('2777');
    var expectedMode = applyUmask('727');

    var file1 = new File({
      base: inputBase,
      path: outputDirpath,
      stat: {
        isDirectory: isDirectory,
        mode: startMode,
      },
    });
    var file2 = new File({
      base: inputBase,
      path: outputDirpath,
      stat: {
        isDirectory: isDirectory,
        mode: expectedMode,
      },
    });

    function assert() {
      expect(statMode(outputDirpath)).toEqual(expectedMode);
    }

    pipe([
      from.obj([file1, file2]),
      vfs.dest(outputBase, { cwd: __dirname }),
      concat(assert),
    ], done);
  });

  it('should use different modes for files and directories', function(done) {
    if (isWindows) {
      this.skip();
      return;
    }

    var expectedDirMode = applyUmask('2777');
    var expectedFileMode = applyUmask('755');

    var file = new File({
      base: inputBase,
      path: inputNestedPath,
      contents: new Buffer(contents),
    });

    function assert() {
      expect(statMode(outputDirpath)).toEqual(expectedDirMode);
      expect(statMode(outputNestedPath)).toEqual(expectedFileMode);
    }

    pipe([
      from.obj([file]),
      vfs.dest(outputBase, {
        cwd: __dirname,
        mode: expectedFileMode,
        dirMode: expectedDirMode,
      }),
      concat(assert),
    ], done);
  });

  it('should not fchmod a matching file', function(done) {
    if (isWindows) {
      this.skip();
      return;
    }

    var fchmodSpy = expect.spyOn(fs, 'fchmod').andCallThrough();

    var expectedMode = applyUmask('777');

    var file = new File({
      base: inputBase,
      path: inputPath,
      contents: new Buffer(contents),
      stat: {
        mode: expectedMode,
      },
    });

    function assert() {
      expect(fchmodSpy.calls.length).toEqual(0);
      expect(statMode(outputPath)).toEqual(expectedMode);
    }

    pipe([
      from.obj([file]),
      vfs.dest(outputBase, { cwd: __dirname }),
      concat(assert),
    ], done);
  });

  it('should see a file with special chmod (setuid/setgid/sticky) as distinct', function(done) {
    if (isWindows) {
      this.skip();
      return;
    }

    var fchmodSpy = expect.spyOn(fs, 'fchmod').andCallThrough();

    var startMode = applyUmask('3722');
    var expectedMode = applyUmask('722');

    var file = new File({
      base: inputBase,
      path: inputPath,
      contents: new Buffer(contents),
      stat: {
        mode: expectedMode,
      },
    });

    function assert() {
      expect(fchmodSpy.calls.length).toEqual(1);
    }

    fs.mkdirSync(outputBase);
    fs.closeSync(fs.openSync(outputPath, 'w'));
    fs.chmodSync(outputPath, startMode);

    pipe([
      from.obj([file]),
      vfs.dest(outputBase, { cwd: __dirname }),
      concat(assert),
    ], done);
  });

  it('should report fchmod errors', function(done) {
    if (isWindows) {
      this.skip();
      return;
    }

    var expectedMode = applyUmask('722');

    var fchmodSpy = expect.spyOn(fs, 'fchmod').andCall(mockError);

    var file = new File({
      base: inputBase,
      path: inputPath,
      contents: new Buffer(contents),
      stat: {
        mode: expectedMode,
      },
    });

    function assert(err) {
      expect(err).toExist();
      expect(fchmodSpy.calls.length).toEqual(1);
      done();
    }

    fs.mkdirSync(outputBase);
    fs.closeSync(fs.openSync(outputPath, 'w'));

    pipe([
      from.obj([file]),
      vfs.dest(outputBase, { cwd: __dirname }),
    ], assert);
  });
});
