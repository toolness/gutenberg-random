var fs = require('fs');
var _ = require('underscore');
var tar = require('tar');
var cheerio = require('cheerio');

var gutenberg = require('./gutenberg');
var db = require('./db');

var MAX_EBOOK_ID = 1000;

function findHtmlUrl($) {
  var url = null;

  $('dcterms\\:hasFormat dcterms\\:format rdf\\:value').each(function() {
    if (!/^text\/html/.test($(this).text())) return;
    var file = $(this).parents('pgterms\\:file');
    var candidateUrl = file.attr('rdf:about');

    if (gutenberg.isHtmlUrl(candidateUrl))
      url = candidateUrl;
  });

  return url;
}

function findEpoch($) {
  var years = [];

  $('pgterms\\:birthdate, pgterms\\:deathdate').each(function() {
    years.push(parseInt($(this).text()));
  });

  if (years.length == 0) return null;

  var start = _.min(years);
  var end = _.max(years);

  if (end - start > 150) return null;

  return {start: start, end: end};
}

function writeEntry(tar, entry) {
  var chunks = [];
  entry.on('data', function(chunk) {
    chunks.push(chunk);
  });
  entry.on('end', function() {
    var rdf = Buffer.concat(chunks).toString('utf8');
    var $ = cheerio.load(rdf);
    var id = $('pgterms\\:ebook').attr('rdf:about');
    var title = $('dcterms\\:title').text().trim();
    var epoch = findEpoch($);
    var htmlUrl = findHtmlUrl($);
    var lang = $('dcterms\\:language').text().trim().toLowerCase();

    if (!(lang == 'en' && title && epoch && htmlUrl)) return;

    entry.pause();

    var book = new db.Book({
      id: id,
      title: title,
      epoch: epoch,
      url: htmlUrl
    });
    book.save(function(err) {
      if (err) throw err;

      console.log('saved ' + id + ' (' + title.slice(0, 30) + ')');
      entry.resume();
    });
  });
}

db.Book.remove({}, function(err) {
  if (err) throw err;

  fs.createReadStream(__dirname + '/rdf-files.tar')
    .pipe(tar.Parse())
    .on('entry', function(entry) {
      var match = entry.path.match(/^cache\/epub\/([0-9]+)\//);
      if (match && parseInt(match[1]) < MAX_EBOOK_ID) {
        writeEntry(this, entry);
      }
    })
    .on('end', function() {
      console.log('bye');
      db.disconnect();
    });
});
