var RSS = require('rss');

var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
  var feed = new RSS({
    title: 'Ping RSS',
    site_url: 'http://a.b.c',
    ttl: '1',
  });

  res.set('Content-Type', 'text/xml');
  res.send(feed.xml());
});

module.exports = router;
