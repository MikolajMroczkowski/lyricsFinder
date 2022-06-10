const lyricsFinder = require('lyrics-finder');
var express = require('express');
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
const yts = require('yt-search')
var HTMLParser = require('node-html-parser');
const https = require("https");

var app = express();

app.use(bodyParser.urlencoded({extended: false}))
app.use(express.static(__dirname + '/static'));
app.use(cookieParser())

app.set('view engine', 'ejs');

app.get('/', function (req, res) {
    var errors = ["Wprowadź poprawne dane", "Nie znaleziono tekstu", ""]
    var errIndex = req.query.error;
    if (errIndex === undefined) {
        errIndex = 2;
    }
    var error = errors[errIndex];
    res.render("main", {error: error});
});

app.get('/lyrics', function (req, res) {
    if (req.query.title !== "" && req.query.artist !== "") {


        (async function (artist, title) {
            let lyrics = await lyricsFinder(artist, title) || "err";
            if ("err" === lyrics) {
                res.redirect("/lyricsv2?title=" + req.query.title + "&artist=" + req.query.artist)
                return;
            }
            lyrics = lyrics.split('\n')
            const r = await yts(req.query.artist + " " + req.query.title)
            const videos = r.videos.slice(0, 1)
            videos.forEach(function (v) {
                var urlP = v.url.split('/');
                var url = urlP[urlP.length - 1]
                url = url.replace("watch?v=", "")
                res.render("tekst", {lyric: lyrics, url: url, title: req.query.title, artist: req.query.artist});
            })

        })(req.query.artist, req.query.title);
    } else {
        res.redirect("/?error=0");
    }
});

app.get('/lyricsv2', function (req, res) {
    if (req.query.title !== "" && req.query.artist !== "") {
        var options = {
            host: 'www.tekstowo.pl',
            port: 443,
            path: '/szukaj,wykonawca,' + req.query.artist.replaceAll(" ", "+") + ',tytul,' + req.query.title.replaceAll(" ", "+") + '.html'
        };
        https.get(options, function (resa) {
            var a = "";
            resa.on('data', function (d) {
                a += d;
            });
            resa.on('end', function () {
                var root = HTMLParser.parse(a);
                optionsa = options
                if(root.querySelectorAll('.content')[0].querySelectorAll('.title')[0]===undefined){
                    res.redirect("/?error=1");
                    return
                }
                optionsa.path = root.querySelectorAll('.content')[0].querySelectorAll('.title')[0]._rawAttrs.href;
                https.get(optionsa, function (resb) {
                    var b = ""
                    resb.on('data', function (d) {
                        b += d;
                    });
                    resb.on('end', async function () {
                        var tekst = []
                        var main = HTMLParser.parse(b);
                        var tekstObj = main.querySelectorAll('.inner-text')[0]
                        if (tekstObj.childNodes === undefined) {
                            return
                        }
                        for (var x = 0; x < tekstObj.childNodes.length; x++) {
                            if (tekstObj.childNodes[x]._rawText !== undefined) {
                                tekst.push(tekstObj.childNodes[x]._rawText);
                            }
                        }
                        const r = await yts(req.query.artist + " " + req.query.title)
                        const videos = r.videos.slice(0, 1)
                        videos.forEach(function (v) {
                            var urlP = v.url.split('/');
                            var url = urlP[urlP.length - 1]
                            url = url.replace("watch?v=", "")
                            res.render("tekst", {
                                lyric: tekst,
                                url: url,
                                title: req.query.title,
                                artist: req.query.artist
                            });
                        })
                    });
                });

            });
        }).on('error', function (e) {
            res.redirect("/?error=1");
        })

    } else {
        res.redirect("/?error=1");
    }
});

app.listen(8080);
console.log('Server is listening on port 8080');