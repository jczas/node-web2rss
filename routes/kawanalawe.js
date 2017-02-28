var RSS = require('rss');

var express = require('express');
var router = express.Router();

var request = require('request');

var xpath = require('xpath');
var dom = require('xmldom').DOMParser;

var async = require('async');

router.get('/', function (req, res) {
    var url = 'http://www.tvn24.pl/kawa-na-lawe,59,m';

    request(url, function (error, response, html) {
        if (!error) {
            var doc = new dom().parseFromString(html);
            var main_title = xpath.select1("//title", doc).firstChild.data;
            var nodes = xpath.select('//a[@class="btnPlayOnImg small"]', doc);

            console.log("main_title: " + main_title);

            var titleEx = /\/kawa-na-lawe,59,m\/([a-zA-z0-9-]*),/;

            var subpages = [];
            for (var i = 0, len = nodes.length; i < len && i < 5; i++) {


                console.log("node: " + nodes[i].toString());
                (function () {
                    var suburl;
                    var title;
                    for (var j = 0, len2 = nodes[i].attributes.length; j < len2; j++) {
                        if (nodes[i].attributes[j].name == 'href') {
                            suburl = 'http://www.tvn24.pl' + (nodes[i].attributes[j].value).replace(/#autoplay$/, '');
                            title = (nodes[i].attributes[j].value).replace(/#autoplay$/, '');

                            var titleMatch = titleEx.exec(title);
                            if (titleMatch !== null) {
                                title = (titleMatch[1]).replace(/-/g, ' ');
                            }
                        }
                    }

                    console.log("node.suburl: " + suburl);
                    console.log("node.title: " + title);

                    subpages.push(function (callback) {
                        getAndProcessSubpage(callback, {
                            title: title,
                            url: suburl
                        });
                    });
                }());
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
                        site_url: 'http://www.tvn24.pl/kawa-na-lawe,59,m',
                        image_url: 'https://upload.wikimedia.org/wikipedia/commons/8/80/TVN_24_Logo.png',
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

            var regEx = /data-src="(.*\.mp4)"/;
            var match = regEx.exec(html);

            if (match !== null) {
                console.log('match: ' + match[1]);
                var item = {
                    title: params.title,
                    url: params.url,
                    enclosure: { url: match[1] }
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
