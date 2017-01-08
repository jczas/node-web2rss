var RSS = require('rss');

var express = require('express');
var router = express.Router();

var request = require('request');

var xpath = require('xpath');
var dom = require('xmldom').DOMParser;

var async = require('async');

router.get('/:id', function (req, res, next) {
    var url = 'http://www.rdc.pl/publicystyka/podcasty/' + req.params.id + '/';

    var feed = new RSS({
        title: 'RDC (' + req.params.id + ')',
        site_url: 'http://www.rdc.pl',
        image: 'http://www.rdc.pl/xn_rdclogo2.jpg.pagespeed.ic.MFxM58Sw1H.jpg'
    });

    request(url, function (error, response, html) {
        if (!error) {
            var doc = new dom().parseFromString(html);
            var nodes = xpath.select("//article/header//a", doc);

            var subpages = [];
            for (var i = 0, len = nodes.length; i < len; i++) {


                console.log("node: " + nodes[i].toString());
                (function () {
                    var suburl = nodes[i].attributes[0].value;
                    var title = nodes[i].firstChild.data;

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

            var regEx = /mp3: "(.*\.mp3)"/;
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
                callback(true);
            }

        } else {
            callback(true);
        }
    });
}

module.exports = router;
