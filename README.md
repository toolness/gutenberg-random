This is a simple web service that returns a random passage from
a random public domain work in the [Project Gutenberg][] catalog.

## Prerequisites

* Node v0.10
* MongoDB (probably any 2.x version will do)

## Quick Start

1. Download the [complete catalog][], uncompress it, and put
   `rdf-files.tar` in the root directory of this repository. (Do not
   extract the tar archive itself.)

2. Optionally, configure the `MONGODB_URL` environment variable to point
   to your database. If undefined, it will default to
   `mongodb://127.0.0.1:27017/gutenberg-metadata`.

3. Run `node extract-metadata.js` to extract metadata about
   the catalog to the database. (Currently, only a small subset of
   the database is used for development purposes.)

4. Run `node app.js` and visit http://localhost:3000.

## License

Public Domain [CC0 1.0 Universal][cczero].

  [Project Gutenberg]: http://www.gutenberg.org/
  [complete catalog]: http://www.gutenberg.org/wiki/Gutenberg:Feeds#The_Complete_Project_Gutenberg_Catalog
  [cczero]: http://creativecommons.org/publicdomain/zero/1.0/
