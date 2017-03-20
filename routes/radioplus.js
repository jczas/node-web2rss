var RSS = require('rss');

var express = require('express');
var router = express.Router();

var request = require('request');

router.get('/', function (req, res) {
    var url = 'http://www.radioplus.pl/podcasty-ogolne';

    request(url, function (error, response, html) {
        if (!error) {
            console.log(html);
            var main_title = 'Radio Plus - podcasty';

            var feed = new RSS({
                title: main_title,
                site_url: url,
                image_url: 'http://www.radioplus.pl/html/img/logo/logo.png',
                ttl: '5'
            });

            var titleRegEx = /<em class="DosisSemiBold">([\s\S]*?)<\/em>([\s\S]*?)<\/div>/g;
            var mp3RegEx = /"([^"]*.\.mp3)"/g;
            var titleMatch;
            var mp3Match;

            while (titleMatch = titleRegEx.exec(html)) {
                if (mp3Match = mp3RegEx.exec(html)) {
                    console.log(titleMatch[1], mp3Match[1]);
                    feed.item({
                        title: titleMatch[2].trim() + ' - ' + titleMatch[1].trim(),
                        url: mp3Match[1],
                        enclosure: { url: mp3Match[1] }
                    });
                }
            }

            res.set('Content-Type', 'text/xml');
            res.send(feed.xml());
        } else {
            res.status(404);        // HTTP status 404: NotFound
            res.send('Problem with ' + url);
        }
    });
});

module.exports = router;
