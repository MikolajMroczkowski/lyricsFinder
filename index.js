const lyricsFinder = require('lyrics-finder');
var express = require('express');
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
const yts = require( 'yt-search' )

var app = express();

app.use(bodyParser.urlencoded({extended: false}))
app.use(express.static(__dirname + '/static'));
app.use(cookieParser())

app.set('view engine', 'ejs');

app.get('/', function (req, res) {
    res.render("main",{error: req.query.error});
});

app.get('/tekst', function (req, res) {
    if(req.query.title != "" && req.query.artist!=""){
        (async function(artist, title) {
            let lyrics = await lyricsFinder(artist, title) || "Nie znaleziono tekstu :C";
            lyrics = lyrics.split('\n')
            const r = await yts( req.query.artist+" "+req.query.title )
            const videos = r.videos.slice( 0, 1 )
            videos.forEach( function ( v ) {
                const views = String( v.views ).padStart( 10, ' ' )
                var urlP = v.url.split('/');
                var url = urlP[urlP.length-1]
                url = url.replace("watch?v=","")
                res.render("tekst",{lyric: lyrics, url: url, title: req.query.title, artist:  req.query.artist});
            } )

        })(req.query.artist,req.query.title);
    }
    else{
        res.redirect("/?error=Wprowadź pełne dane");
    }
});

app.listen(8080);
console.log('Server is listening on port 8080');
