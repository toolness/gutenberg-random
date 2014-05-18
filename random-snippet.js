var http = require('http');
var _ = require('underscore');
var htmlparser = require('htmlparser2');

var metadata = require('./metadata.json');

var SNIPPET_LENGTH = 1500;

var index = _.random(metadata.length - 1);
var item = metadata[index];

console.log('getting', item);

http.get(item.url, function(res) {
  if (res.statusCode != 200) {
    // If it's 307, it's a captcha request.
    console.log(res.headers.location);
    throw new Error('got status ' + res.statusCode);
  }

  var currTag = null;
  var done = false;
  var paragraphs = [];
  var totalLength = 0;
  var onDone = function() {
    if (done) return;
    done = true;
    res.socket.destroy();
  };
  var parser = new htmlparser.Parser({
    ontext: function(text) {
      if (done) return;
      if (currTag != 'p') return;

      text = text.trim();
      if (!text) return;

      paragraphs.push(text);

      totalLength += text.length;

      onDone();
    },
    onopentag: function(name, attribs) {
      currTag = name;
    }
  });

  res.on('end', onDone).pipe(parser);
});
