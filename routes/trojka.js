var RSS = require('rss');

var express = require('express');
var router = express.Router();

var request = require('request');

var xpath = require('xpath');
var dom = require('xmldom').DOMParser;

var async = require('async');

router.get('/:id', function (req, res, next) {
    var url = 'http://www.polskieradio.pl/9/' + req.params.id + '/';


    request(url, function (error, response, html) {
        if (!error) {
            var doc = new dom().parseFromString(html);
            var main_title = xpath.select1("//title", doc).firstChild.data;
            var nodes = xpath.select("//div/div/div/div/div/div/div/div/div/section/article/a", doc);

            console.log("main_title: " + main_title);

            var subpages = [];
            for (var i = 0, len = nodes.length; i < len; i++) {


                console.log("node: " + nodes[i].toString());
                (function () {
                    var suburl = 'http://www.polskieradio.pl' + nodes[i].attributes[0].value;
                    var title = nodes[i].attributes[2].value;

                    console.log("node.suburl: " + suburl);
                    console.log("node.title: " + title);

                    subpages.push(function (callback) {
                        getAndProcessSubpage(callback, {
                            title: title,
                            url: suburl
                        });
                    });
                } ());
            }

            async.parallel(subpages, function (err, results) {
                if (err) {
                    console.log('error');

                    res.status(404);        // HTTP status 404: NotFound
                    res.send('Problem with subpage');
                } else {
                    console.log('ok: ' + results);

                    var feed = new RSS({
                        title: main_title,
                        site_url: 'http://www.polskieradio.pl/9,Trojka',
                        image_url: 'http://www.warsztatykultury.pl/wp-content/uploads/2013/07/3jka.jpg',
                        ttl: '5'
                    });

                    for (var i = 0, len = results.length; i < len; i++) {
                        feed.item(results[i]);
                    }
                    res.set('Content-Type', 'text/xml');
                    res.send(feed.xml());
                }
            });

        } else {
            res.status(404);        // HTTP status 404: NotFound
            res.send('Problem with ' + url);
        }
    });
});

function getAndProcessSubpage(callback, params) {
    console.log("calling getAndProcessSubpage: " + params.url);


    request(params.url, function (error, response, html) {
        if (!error) {
            console.log("finished getAndProcessSubpage: " + params.url);

            var regEx = /class="material-icons pr-media-play" data-media={"id":[0-9]*,"file":"\/\/static.prsa.pl\/([0-9a-z-]*\.mp3)"/;
            var match = regEx.exec(html);

            if (match !== null) {
                console.log('match: ' + match[1]);
                var item = {
                    title: params.title,
                    url: params.url,
                    enclosure: { url: 'http://www.polskieradio.pl/' + match[1] }
                };

                callback(false, item);
            } else {
                callback(true);
            }

        } else {
            callback(true);
        }
    });
}

module.exports = router;
