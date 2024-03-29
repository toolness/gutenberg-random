var http = require('http');
var urlParse = require('url').parse;
var _ = require('underscore');
var htmlparser = require('htmlparser2');

var db = require('./db');

var MIRROR_URL = 'http://mirror.csclub.uwaterloo.ca/gutenberg/';
var MIN_PARAGRAPHS_TO_SKIP = 10;
var MAX_PARAGRAPHS_TO_SKIP = 40;
var SNIPPET_LENGTH = 140;

function findRandomSnippet(cb) {
  db.Book.findRandom(function(err, book) {
    if (err) return cb(err);

    http.get(book.getMirrorUrl(MIRROR_URL), function(res) {
      if (res.statusCode != 200)
        return cb(new Error('got status ' + res.statusCode));

      var currTag = null;
      var paragraphCount = 0;
      var paragraphsToSkip = _.random(MIN_PARAGRAPHS_TO_SKIP,
                                      MAX_PARAGRAPHS_TO_SKIP);
      var currParagraph = '';
      var foundHeader = false;
      var done = false;
      var paragraphs = [];
      var totalLength = 0;
      var onDone = function() {
        if (done) return;
        done = true;
        res.socket.destroy();
        cb(null, {book: book, paragraphs: paragraphs});
      };
      var parser = new htmlparser.Parser({
        ontext: function(text) {
          if (!foundHeader) return;
          if (done) return;
          if (currTag != 'p') return;
          if (paragraphCount < paragraphsToSkip) return;

          currParagraph += text.trim();
        },
        onopentag: function(name, attribs) {
          if (/^h[1-6]$/.test(name)) foundHeader = true;
          currTag = name;
        },
        onclosetag: function(name) {
          if (name != 'p') return;
          paragraphCount++;
          if (currParagraph) {
            paragraphs.push(currParagraph);

            totalLength += currParagraph.length;
            currParagraph = '';

            if (totalLength >= SNIPPET_LENGTH)
              onDone();
          }
        }
      });

      res.on('end', onDone).pipe(parser);
    });
  });
}

module.exports = findRandomSnippet;

if (!module.parent)
  findRandomSnippet(function(err, result) {
    if (err) throw err;
    console.log(result.paragraphs.join('\n'));
    console.log('\n-- ' + result.book.title);
    db.disconnect();
  });
