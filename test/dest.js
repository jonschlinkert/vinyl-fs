'use strict';

var path = require('path');

var fs = require('graceful-fs');
var File = require('vinyl');
var expect = require('expect');
var miss = require('mississippi');

var vfs = require('../');

var cleanup = require('./utils/cleanup');
var statMode = require('./utils/stat-mode');
var mockError = require('./utils/mock-error');
var applyUmask = require('./utils/apply-umask');
var testStreams = require('./utils/test-streams');
var isDirectory = require('./utils/is-directory-mock');
var testConstants = require('./utils/test-constants');

var from = miss.from;
var pipe = miss.pipe;
var concat = miss.concat;

var count = testStreams.count;
var rename = testStreams.rename;
var includes = testStreams.includes;
var slowCount = testStreams.slowCount;

function noop() {}

var outputRelative = testConstants.outputRelative;
var inputBase = testConstants.inputBase;
var outputBase = testConstants.outputBase;
var inputPath = testConstants.inputPath;
var outputPath = testConstants.outputPath;
var outputRenamePath = testConstants.outputRenamePath;
var inputDirpath = testConstants.inputDirpath;
var outputDirpath = testConstants.outputDirpath;
var contents = testConstants.contents;

var clean = cleanup([outputBase]);

describe('.dest()', function() {

  beforeEach(clean);
  afterEach(clean);

  // TODO: make this work correctly
  it.skip('throws on invalid folder (empty)', function(done) {
    var stream;
    try {
      stream = vfs.dest();
    } catch (err) {
      expect(err).toExist();
      expect(stream).toNotExist();
      done();
    }
  });

  // TODO: make this work correctly
  it.skip('throws on invalid folder (empty string)', function(done) {
    var stream;
    try {
      stream = vfs.dest('');
    } catch (err) {
      expect(err).toExist();
      expect(stream).toNotExist();
      done();
    }
  });

  it('accepts the sourcemap option as true', function(done) {
    var file = new File({
      base: inputBase,
      path: inputPath,
      contents: null,
    });

    function assert(files) {
      expect(files.length).toEqual(1);
      expect(files).toInclude(file);
    }

    pipe([
      from.obj([file]),
      vfs.dest(outputBase, { sourcemaps: true }),
      concat(assert),
    ], done);
  });

  it('accepts the sourcemap option as a string', function(done) {
    var file = new File({
      base: inputBase,
      path: inputPath,
      contents: null,
    });

    function assert(files) {
      expect(files.length).toEqual(1);
      expect(files).toInclude(file);
    }

    pipe([
      from.obj([file]),
      vfs.dest(outputBase, { sourcemaps: '.' }),
      concat(assert),
    ], done);
  });

  it('accepts the sourcemap option as an object', function(done) {
    var options = {
      sourcemaps: {
        addComment: false,
      },
    };

    var file = new File({
      base: inputBase,
      path: inputPath,
      contents: null,
    });

    function assert(files) {
      expect(files.length).toEqual(1);
      expect(files).toInclude(file);
    }

    pipe([
      from.obj([file]),
      vfs.dest(outputBase, options),
      concat(assert),
    ], done);
  });

  it('passes through writes with cwd', function(done) {
    var file = new File({
      base: inputBase,
      path: inputPath,
      contents: null,
    });

    function assert(files) {
      expect(files.length).toEqual(1);
      expect(files).toInclude(file);
      expect(files[0].cwd).toEqual(__dirname, 'cwd should have changed');
    }

    pipe([
      from.obj([file]),
      vfs.dest(outputRelative, { cwd: __dirname }),
      concat(assert),
    ], done);
  });

  it('passes through writes with default cwd', function(done) {
    var file = new File({
      base: inputBase,
      path: inputPath,
      contents: null,
    });

    function assert(files) {
      expect(files.length).toEqual(1);
      expect(files).toInclude(file);
      expect(files[0].cwd).toEqual(process.cwd(), 'cwd should not have changed');
    }

    pipe([
      from.obj([file]),
      vfs.dest(outputBase),
      concat(assert),
    ], done);
  });

  it('does not write null files', function(done) {
    var file = new File({
      base: inputBase,
      path: inputPath,
      contents: null,
    });

    function assert(files) {
      var exists = fs.existsSync(outputPath);

      expect(files.length).toEqual(1);
      expect(files).toInclude(file);
      expect(files[0].base).toEqual(outputBase, 'base should have changed');
      expect(files[0].path).toEqual(outputPath, 'path should have changed');
      expect(exists).toEqual(false);
    };

    pipe([
      from.obj([file]),
      vfs.dest(outputBase),
      concat(assert),
    ], done);
  });

  it('writes buffer files to the right folder with relative cwd', function(done) {
    var cwd = path.relative(process.cwd(), __dirname);

    var file = new File({
      base: inputBase,
      path: inputPath,
      contents: new Buffer(contents),
    });

    function assert(files) {
      var outputContents = fs.readFileSync(outputPath, 'utf8');

      expect(files.length).toEqual(1);
      expect(files).toInclude(file);
      expect(files[0].cwd).toEqual(__dirname, 'cwd should have changed');
      expect(files[0].base).toEqual(outputBase, 'base should have changed');
      expect(files[0].path).toEqual(outputPath, 'path should have changed');
      expect(outputContents).toEqual(contents);
    }

    pipe([
      from.obj([file]),
      vfs.dest(outputRelative, { cwd: cwd }),
      concat(assert),
    ], done);
  });

  it('writes buffer files to the right folder with function and relative cwd', function(done) {
    var cwd = path.relative(process.cwd(), __dirname);

    var file = new File({
      base: inputBase,
      path: inputPath,
      contents: new Buffer(contents),
    });

    function outputFn(f) {
      expect(f).toExist();
      expect(f).toExist(file);
      return outputRelative;
    }

    function assert(files) {
      var outputContents = fs.readFileSync(outputPath, 'utf8');

      expect(files.length).toEqual(1);
      expect(files).toInclude(file);
      expect(files[0].cwd).toEqual(__dirname, 'cwd should have changed');
      expect(files[0].base).toEqual(outputBase, 'base should have changed');
      expect(files[0].path).toEqual(outputPath, 'path should have changed');
      expect(outputContents).toEqual(contents);
    }

    pipe([
      from.obj([file]),
      vfs.dest(outputFn, { cwd: cwd }),
      concat(assert),
    ], done);
  });

  it('writes buffer files to the right folder', function(done) {
    var file = new File({
      base: inputBase,
      path: inputPath,
      contents: new Buffer(contents),
    });

    function assert(files) {
      var outputContents = fs.readFileSync(outputPath, 'utf8');

      expect(files.length).toEqual(1);
      expect(files).toInclude(file);
      expect(files[0].base).toEqual(outputBase, 'base should have changed');
      expect(files[0].path).toEqual(outputPath, 'path should have changed');
      expect(outputContents).toEqual(contents);
    }

    pipe([
      from.obj([file]),
      vfs.dest(outputBase),
      concat(assert),
    ], done);
  });

  it('writes streaming files to the right folder', function(done) {
    var file = new File({
      base: inputBase,
      path: inputPath,
      contents: from([contents]),
    });

    function assert(files) {
      var outputContents = fs.readFileSync(outputPath, 'utf8');

      expect(files.length).toEqual(1);
      expect(files).toInclude(file);
      expect(files[0].base).toEqual(outputBase, 'base should have changed');
      expect(files[0].path).toEqual(outputPath, 'path should have changed');
      expect(outputContents).toEqual(contents);
    };

    pipe([
      from.obj([file]),
      vfs.dest(outputBase),
      concat(assert),
    ], done);
  });

  it('writes directories to the right folder', function(done) {
    var file = new File({
      base: inputBase,
      path: inputDirpath,
      contents: null,
      stat: {
        isDirectory: isDirectory,
      },
    });

    function assert(files) {
      var stats = fs.lstatSync(outputDirpath);

      expect(files.length).toEqual(1);
      expect(files).toInclude(file);
      expect(files[0].base).toEqual(outputBase, 'base should have changed');
      // TODO: normalize this path
      expect(files[0].path).toEqual(outputDirpath, 'path should have changed');
      expect(stats.isDirectory()).toEqual(true);
    }

    pipe([
      from.obj([file]),
      vfs.dest(outputBase),
      concat(assert),
    ], done);
  });

  it('allows piping multiple dests in streaming mode', function(done) {
    var file = new File({
      base: inputBase,
      path: inputPath,
      contents: new Buffer(contents),
    });

    function assert() {
      var outputContents1 = fs.readFileSync(outputPath, 'utf8');
      var outputContents2 = fs.readFileSync(outputRenamePath, 'utf8');
      expect(outputContents1).toEqual(contents);
      expect(outputContents2).toEqual(contents);
    }

    pipe([
      from.obj([file]),
      includes({ path: inputPath }),
      vfs.dest(outputBase),
      rename(outputRenamePath),
      includes({ path: outputRenamePath }),
      vfs.dest(outputBase),
      concat(assert),
    ], done);
  });

  it('writes new files with the default user mode', function(done) {
    var expectedMode = applyUmask('666');

    var file = new File({
      base: inputBase,
      path: inputPath,
      contents: new Buffer(contents),
    });

    function assert(files) {
      expect(files.length).toEqual(1);
      expect(files).toInclude(file);
      expect(statMode(outputPath)).toEqual(expectedMode);
    }

    pipe([
      from.obj([file]),
      vfs.dest(outputBase),
      concat(assert),
    ], done);
  });

  it('reports i/o errors', function(done) {
    var file = new File({
      base: inputBase,
      path: inputPath,
      contents: new Buffer(contents),
    });

    function assert(err) {
      expect(err).toExist();
      done();
    }

    fs.mkdirSync(outputBase);
    fs.closeSync(fs.openSync(outputPath, 'w'));
    fs.chmodSync(outputPath, 0);

    pipe([
      from.obj([file]),
      vfs.dest(outputBase),
    ], assert);
  });

  it('reports stat errors', function(done) {
    var expectedMode = applyUmask('722');

    var fstatSpy = expect.spyOn(fs, 'fstat').andCall(mockError);

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
      expect(fstatSpy.calls.length).toEqual(1);
      done();
    }

    fs.mkdirSync(outputBase);
    fs.closeSync(fs.openSync(outputPath, 'w'));

    pipe([
      from.obj([file]),
      vfs.dest(outputBase),
    ], assert);
  });

  it('does not overwrite files with overwrite option set to false', function(done) {
    var existingContents = 'Lorem Ipsum';

    var file = new File({
      base: inputBase,
      path: inputPath,
      contents: new Buffer(contents),
    });

    function assert(files) {
      var outputContents = fs.readFileSync(outputPath, 'utf8');

      expect(files.length).toEqual(1);
      expect(outputContents).toEqual(existingContents);
    }

    // Write expected file which should not be overwritten
    fs.mkdirSync(outputBase);
    fs.writeFileSync(outputPath, existingContents);

    pipe([
      from.obj([file]),
      vfs.dest(outputBase, { overwrite: false }),
      concat(assert),
    ], done);
  });

  it('overwrites files with overwrite option set to true', function(done) {
    var existingContents = 'Lorem Ipsum';

    var file = new File({
      base: inputBase,
      path: inputPath,
      contents: new Buffer(contents),
    });

    function assert(files) {
      var outputContents = fs.readFileSync(outputPath, 'utf8');

      expect(files.length).toEqual(1);
      expect(outputContents).toEqual(contents);
    }

    // This should be overwritten
    fs.mkdirSync(outputBase);
    fs.writeFileSync(outputPath, existingContents);

    pipe([
      from.obj([file]),
      vfs.dest(outputBase, { overwrite: true }),
      concat(assert),
    ], done);
  });

  it('does not overwrite files with overwrite option set to a function that returns false', function(done) {
    var existingContents = 'Lorem Ipsum';

    var file = new File({
      base: inputBase,
      path: inputPath,
      contents: new Buffer(contents),
    });

    function overwrite(f) {
      expect(f).toEqual(file);
      return false;
    }

    function assert(files) {
      var outputContents = fs.readFileSync(outputPath, 'utf8');

      expect(files.length).toEqual(1);
      expect(outputContents).toEqual(existingContents);
    }

    // Write expected file which should not be overwritten
    fs.mkdirSync(outputBase);
    fs.writeFileSync(outputPath, existingContents);

    pipe([
      from.obj([file]),
      vfs.dest(outputBase, { overwrite: overwrite }),
      concat(assert),
    ], done);
  });

  it('overwrites files with overwrite option set to a function that returns true', function(done) {
    var existingContents = 'Lorem Ipsum';

    var file = new File({
      base: inputBase,
      path: inputPath,
      contents: new Buffer(contents),
    });

    function overwrite(f) {
      expect(f).toEqual(file);
      return true;
    }

    function assert(files) {
      var outputContents = fs.readFileSync(outputPath, 'utf8');

      expect(files.length).toEqual(1);
      expect(outputContents).toEqual(contents);
    }

    // This should be overwritten
    fs.mkdirSync(outputBase);
    fs.writeFileSync(outputPath, existingContents);

    pipe([
      from.obj([file]),
      vfs.dest(outputBase, { overwrite: overwrite }),
      concat(assert),
    ], done);
  });

  it('creates symlinks when the `symlink` attribute is set on the file', function(done) {
    var inputRelativeSymlinkPath = 'wow';

    var file = new File({
      base: inputBase,
      path: inputDirpath,
      contents: null,
    });

    // `src()` adds this side-effect with `followSymlinks` option set to false
    file.symlink = inputRelativeSymlinkPath;

    function assert(files) {
      var symlink = fs.readlinkSync(outputDirpath);

      expect(files.length).toEqual(1);
      expect(file.symlink).toEqual(symlink);
      expect(files[0].symlink).toEqual(symlink);
      expect(files[0].path).toEqual(outputDirpath);
    }

    pipe([
      from.obj([file]),
      vfs.dest(outputBase),
      concat(assert),
    ], done);
  });

  it('emits a finish event', function(done) {
    var destStream = vfs.dest(outputBase);

    destStream.once('finish', done);

    var file = new File({
      base: inputBase,
      path: inputPath,
      contents: new Buffer('1234567890'),
    });

    pipe([
      from.obj([file]),
      destStream,
    ]);
  });

  it('does not get clogged by highWaterMark', function(done) {
    var expectedCount = 17;
    var highwatermarkFiles = [];
    for (var idx = 0; idx < expectedCount; idx++) {
      var file = new File({
        base: inputBase,
        path: inputPath,
        contents: new Buffer(contents),
      });
      highwatermarkFiles.push(file);
    }

    pipe([
      from.obj(highwatermarkFiles),
      count(expectedCount),
      // Must be in the Writable position to test this
      // So concat-stream cannot be used
      vfs.dest(outputBase),
    ], done);
  });

  it('allows backpressure when piped to another, slower stream', function(done) {
    this.timeout(20000);

    var expectedCount = 24;
    var highwatermarkFiles = [];
    for (var idx = 0; idx < expectedCount; idx++) {
      var file = new File({
        base: inputBase,
        path: inputPath,
        contents: new Buffer(contents),
      });
      highwatermarkFiles.push(file);
    }

    pipe([
      from.obj(highwatermarkFiles),
      count(expectedCount),
      vfs.dest(outputBase),
      slowCount(expectedCount),
    ], done);
  });

  it('respects readable listeners on destination stream', function(done) {
    var file = new File({
      base: inputBase,
      path: inputDirpath,
      contents: null,
    });

    var destStream = vfs.dest(outputBase);

    var readables = 0;
    destStream.on('readable', function() {
      var data = destStream.read();

      if (data != null) {
        readables++;
      }
    });

    function assert(err) {
      expect(readables).toEqual(1);
      done(err);
    }

    pipe([
      from.obj([file]),
      destStream,
    ], assert);
  });

  it('respects data listeners on destination stream', function(done) {
    var file = new File({
      base: inputBase,
      path: inputDirpath,
      contents: null,
    });

    var destStream = vfs.dest(outputBase);

    var datas = 0;
    destStream.on('data', function() {
      datas++;
    });

    function assert(err) {
      expect(datas).toEqual(1);
      done(err);
    }

    pipe([
      from.obj([file]),
      destStream,
    ], assert);
  });

  it('sinks the stream if all the readable event handlers are removed', function(done) {
    var expectedCount = 17;
    var highwatermarkFiles = [];
    for (var idx = 0; idx < expectedCount; idx++) {
      var file = new File({
        base: inputBase,
        path: inputPath,
        contents: new Buffer(contents),
      });
      highwatermarkFiles.push(file);
    }

    var destStream = vfs.dest(outputBase);

    destStream.on('readable', noop);

    pipe([
      from.obj(highwatermarkFiles),
      count(expectedCount),
      // Must be in the Writable position to test this
      // So concat-stream cannot be used
      destStream,
    ], done);

    process.nextTick(function() {
      destStream.removeListener('readable', noop);
    });
  });

  it('sinks the stream if all the data event handlers are removed', function(done) {
    var expectedCount = 17;
    var highwatermarkFiles = [];
    for (var idx = 0; idx < expectedCount; idx++) {
      var file = new File({
        base: inputBase,
        path: inputPath,
        contents: new Buffer(contents),
      });
      highwatermarkFiles.push(file);
    }

    var destStream = vfs.dest(outputBase);

    destStream.on('data', noop);

    pipe([
      from.obj(highwatermarkFiles),
      count(expectedCount),
      // Must be in the Writable position to test this
      // So concat-stream cannot be used
      destStream,
    ], done);

    process.nextTick(function() {
      destStream.removeListener('data', noop);
    });
  });

  // TODO: need a better way to pass these options through
  // Or maybe not at all since we fixed highWaterMark
  it('passes options to through2', function(done) {
    var file = new File({
      base: inputBase,
      path: inputPath,
      contents: new Buffer(contents),
    });

    function assert(err) {
      expect(err.message).toMatch(/Invalid non-string\/buffer chunk/);
      done();
    }

    pipe([
      from.obj([file]),
      vfs.dest(outputBase, { objectMode: false }),
    ], assert);
  });

  it('successfully processes files with streaming contents', function(done) {
    var file = new File({
      base: inputBase,
      path: inputPath,
      contents: from([contents]),
    });

    pipe([
      from.obj([file]),
      vfs.dest(outputBase),
    ], done);
  });

  it('errors if we cannot mkdirp', function(done) {
    var mkdirSpy = expect.spyOn(fs, 'mkdir').andCall(mockError);

    var file = new File({
      base: inputBase,
      path: inputPath,
      contents: null,
    });

    function assert(err) {
      expect(err).toExist();
      expect(mkdirSpy.calls.length).toEqual(1);
      done();
    }

    pipe([
      from.obj([file]),
      vfs.dest(outputBase),
    ], assert);
  });

  it('errors if vinyl object is a directory and we cannot mkdirp', function(done) {
    var ogMkdir = fs.mkdir;

    var mkdirSpy = expect.spyOn(fs, 'mkdir').andCall(function() {
      if (mkdirSpy.calls.length > 1) {
        mockError.apply(this, arguments);
      } else {
        ogMkdir.apply(this, arguments);
      }
    });

    var file = new File({
      base: inputBase,
      path: inputDirpath,
      contents: null,
      stat: {
        isDirectory: isDirectory,
      },
    });

    function assert(err) {
      expect(err).toExist();
      expect(mkdirSpy.calls.length).toEqual(2);
      done();
    }

    pipe([
      from.obj([file]),
      vfs.dest(outputBase),
    ], assert);
  });

  // TODO: is this correct behavior? had to adjust it
  it('does not error if vinyl object is a directory and we cannot open it', function(done) {
    var file = new File({
      base: inputBase,
      path: inputDirpath,
      contents: null,
      stat: {
        isDirectory: isDirectory,
        mode: applyUmask('000'),
      },
    });

    function assert() {
      var exists = fs.existsSync(outputDirpath);
      expect(exists).toEqual(true);
    }

    pipe([
      from.obj([file]),
      vfs.dest(outputBase),
      concat(assert),
    ], done);
  });

  it('errors if vinyl object is a directory and open errors', function(done) {
    var openSpy = expect.spyOn(fs, 'open').andCall(mockError);

    var file = new File({
      base: inputBase,
      path: inputDirpath,
      contents: null,
      stat: {
        isDirectory: isDirectory,
      },
    });

    function assert(err) {
      expect(err).toExist();
      expect(openSpy.calls.length).toEqual(1);
      done();
    }

    pipe([
      from.obj([file]),
      vfs.dest(outputBase),
    ], assert);
  });

  it('errors if content stream errors', function(done) {
    var contentStream = from(function(size, cb) {
      cb(new Error('mocked error'));
    });

    var file = new File({
      base: inputBase,
      path: inputPath,
      contents: contentStream,
    });

    function assert(err) {
      expect(err).toExist();
      done();
    }

    pipe([
      from.obj([file]),
      vfs.dest(outputBase),
    ], assert);
  });
});
