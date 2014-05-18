var urlParse = require('url').parse;

var HTML_RE = /\.html?$/;
var DIRS_RE = /^\/dirs\/(.+)/;
var FILES_RE = /^\/files\/([0-9]+)\/(.+)/;

exports.isHtmlUrl = function(url) {
  var path = urlParse(url).pathname;

  if (!HTML_RE.test(path)) return false;
  return (DIRS_RE.test(path) || FILES_RE.test(path));
};

exports.getMirrorUrl = function(mirror, url) {
  var path = urlParse(url).pathname;

  if (DIRS_RE.test(path)) {
    return mirror + path.match(DIRS_RE)[1];
  } else if (FILES_RE.test(path)) {
    var match = path.match(FILES_RE);
    var digits = match[1];
    var dirPrefix = digits.slice(0, -1).split('').join('/');

    return mirror + dirPrefix + '/' + digits + '/' + match[2];
  } else {
    throw new Error("unknown gutenberg url pattern for " + url);
  }
}
