let express = require('express');
let persist = require('node-persist')

let game_database = persist.create({
    dir: './game_database',
    expiredInterval: 24 * 60 * 60 * 1000
});

game_database.init();

let app = express();

app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.static('./public'));

app.get('/', (req, res) => {
    res.status(200).render('index');
});

app.get('/games/:game_id', async (req, res) => {
    // add some loading :)
    let game_id = req.params.game_id;

    let game = await game_database.get(game_id);

    if(!game) return res.status(404).end('Game Not Found!')

    res.status(200).json(game)
});

app.post('/api/games', async (req, res) => {
    let game_id = Math.random().toString(36).substring(2);

    await game_database.set(game_id, {
        game_type: req.body.game_type // create a game with default scheme
    });

    res.json({"game_id": game_id});
});

app.get('*', (req, res) => {
    res.status(404).end("Page Not Found")
});

app.listen(3000)