var _ = require('underscore');
var express = require('express');

var findRandomSnippet = require('./random-snippet');

var PORT = process.env.PORT || 3000;

var app = express();

app.get('/', function(req, res, next) {
  findRandomSnippet(function(err, result) {
    if (err) return res.type('text').send(500, err.message);

    return res.send(
      '<blockquote>' + result.paragraphs.map(function(text) {
        return '<p>' + text + '</p>'
      }).join('\n') + '</blockquote>' +
      '<a href="http://gutenberg.org/' + result.book.id + '">' +
      _.escape(result.book.title) + '</a>'
    );
  });
});

app.listen(PORT, function() {
  console.log('listening on port', PORT);
});
