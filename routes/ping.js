var Feed = require('feed');

var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
  var feed = new Feed({
    title: 'Ping',
    description: 'Ping',
    link: 'http://me',
    copyright: 'Copyright 2016 by me'
  });
  res.set('Content-Type', 'text/xml');
  res.send(feed.render('rss-2.0'));
});

module.exports = router;