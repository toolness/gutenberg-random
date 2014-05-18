var http = require('http');
var urlParse = require('url').parse;
var _ = require('underscore');
var htmlparser = require('htmlparser2');

var gutenberg = require('./gutenberg');
var metadata = require('./metadata.json');

var MIRROR_URL = 'http://mirror.csclub.uwaterloo.ca/gutenberg/';
var MIN_PARAGRAPHS_TO_SKIP = 10;
var MAX_PARAGRAPHS_TO_SKIP = 40;
var SNIPPET_LENGTH = 140;

var index = _.random(metadata.length - 1);
var item = metadata[index];

http.get(gutenberg.getMirrorUrl(MIRROR_URL, item.url), function(res) {
  if (res.statusCode != 200)
    throw new Error('got status ' + res.statusCode);

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
    console.log(paragraphs.join('\n'));
    console.log('\n-- ' + item.title);
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
