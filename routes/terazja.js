var RSS = require('rss');

var express = require('express');
var router = express.Router();

var request = require('request');

var xpath = require('xpath');
var dom = require('xmldom').DOMParser;

var async = require('async');

router.get('/', function (req, res) {
    var url = 'http://www.nowa.tv/wszystko-o/teraz-ja,5/16/';

    request(url, function (error, response, html) {
        if (!error) {
            var doc = new dom().parseFromString(html);
            var main_title = xpath.select1("//title", doc).firstChild.data;
            var nodes = xpath.select('//div[@class="box age_12 video"]/a', doc);

            console.log("main_title: " + main_title);

            var subpages = [];
            for (var i = 0, len = nodes.length; i < len; i++) {


                console.log("node: " + nodes[i].toString());
                (function () {
                    var suburl = 'http://www.nowa.tv' + (nodes[i].attributes[0].value);

                    console.log("node.suburl: " + suburl);

                    subpages.push(function (callback) {
                        getAndProcessSubpage(callback, {
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
                        site_url: 'http://www.nowa.tv/wszystko-o/teraz-ja,5/16/',
                        image_url: 'http://www.nowa.tv/media/static/images/logo.png',
                        ttl: '5'
                    });

                    for (var i = 0, len = results.length; i < len; i++) {
                        if (results[i] != null) {
                            feed.item(results[i]);
                        }
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

            var regExUrl = /var mp4 = "(.*\.mp4)"/;
            var matchUrl = regExUrl.exec(html);

            if (matchUrl !== null) {
                console.log('match url: ' + matchUrl[1]);
            } else {
                console.log('problem with url regex');
            }
            
            var regExTitle = /var title = "(.*)"/;
            var matchTitle = regExTitle.exec(html);

            if (matchTitle !== null) {
                console.log('match title: ' + matchTitle[1]);
            } else {
                console.log('problem with title regex');
            }

            if (matchUrl !== null && matchTitle !== null) {
                console.log('match url: ' + matchUrl[1]);
                console.log('match title: ' + matchTitle[1]);
                var item = {
                    title: matchTitle[1],
                    url: params.url,
                    enclosure: { url: matchUrl[1] }
                };

                callback(false, item);
            } else {
                console.log("Error in data in getAndProcessSubpage: " + params.url);
                callback(false); // ignore errors
            }

        } else {
            console.log("Error in request in getAndProcessSubpage: " + params.url);
            callback(false); // ignore errors
        }
    });
}

module.exports = router;
