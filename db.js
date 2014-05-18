var mongoose = require('mongoose');

var gutenberg = require('./gutenberg');

var MONGODB_URL = process.env.MONGODB_URL ||
                  'mongodb://127.0.0.1:27017/gutenberg-metadata';

mongoose.connect(MONGODB_URL);

var bookSchema = new mongoose.Schema({
  title: String,
  id: String,
  url: String,
  epoch: {
    start: Number,
    end: Number
  },
  random: {type: Number, index: true}
});

bookSchema.methods.getMirrorUrl = function(mirrorBase) {
  return gutenberg.getMirrorUrl(mirrorBase, this.url);
};

// http://stackoverflow.com/a/5517206
bookSchema.statics.findRandom = function(cb) {
  var rand = Math.random();

  this.findOne({
    random: {$gte: rand}
  }, function(err, result) {
    if (err) return cb(err);
    if (result) return cb(null, result);

    this.findOne({
      random: {$lte: rand}
    }, cb);
  }.bind(this));
};

bookSchema.pre('save', function(next) {
  if (typeof(this.random) != 'number')
    this.random = Math.random();
  next();
});

var Book = mongoose.model('EBook', bookSchema);

exports.Book = Book;
exports.disconnect = mongoose.disconnect.bind(mongoose);
