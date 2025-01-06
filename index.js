let express = require('express');
let persist = require('node-persist')
let { v4: uuidv4 } = require('uuid')

let game_database = persist.create({
    dir: './game_database',
    ttl: 24 * 60 * 60 * 1000,
    expiredInterval: 60 * 1000
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

app.get('/game', (req, res) => {
    res.status(200).render('create_game');
});


app.get('/game/:game_id', async (req, res) => {
    let game_id = req.params.game_id;

    let game = await game_database.get(game_id);

    if(!game) return res.status(404).end('Game Not Found!')

    res.status(200).render("game");
});


/***************************** API *****************************/

// POST /games
app.post('/api/v1/games', async (req, res) => {
    let game_params = req.body;

    if(!game_params?.difficulty) return res.status(400).json({
        'code': 422,
        'message': 'Bad request: Missing field DifficultyType'
    });

    if(!game_params?.name) return res.status(400).json({
        'code': 422,
        'message': 'Bad request: Missing field name'
    });

    if(!game_params?.board) return res.status(400).json({
        'code': 422,
        'message': 'Bad request: Missing field board'
    });


    if(!['beginner', 'easy', 'medium', 'hard', 'extreme'].includes(game_params.difficulty)) return res.status(422).json({
        'code': 422,
        'message': `Semantic error: Not a valid DifficultyType`
    });

    if(typeof game_params.name !== 'string') return res.status(422).json({
        'code': 422,
        'message': `Semantic error: Not a valid name`
    });

    if(!Array.isArray(game_params.board) || game_params.board.length !== 15 || !game_params.board.every((row) => Array.isArray(row) && row.length === 15 && row.every(cell => cell === "X" || cell === "O" || cell === ""))) return res.status(422).json({
        'code': 422,
        'message': `Semantic error: Not a valid board`
    });

    let game_id = uuidv4();

    let current_date = new Date()

    let schema = {
        uuid: game_id ,
        createdAt: `${current_date.toLocaleDateString()}-${current_date.toLocaleTimeString()}`,
        updatedAt: `${current_date.toLocaleDateString()}-${current_date.toLocaleTimeString()}`,
        name: game_params.name,
        difficulty: game_params.difficulty,
        gameState: 'opening',
        board: game_params.board
    };

    let created_game = await game_database.set(game_id, schema);

    res.status(201).json(created_game.content.value);
});

// GET /games
app.get('/api/v1/games', async (req, res) => {
    let games = await game_database.values();

    res.status(200).json(games);
});

// GET /games/{uuid}
app.get('/api/v1/games/:game_id', async (req, res) => {
    let game_id = req.params.game_id;

    let game = await game_database.get(game_id);

    if(!game) return res.status(404).json({
        'code': 404,
        'message': 'Resource not found'
    });

    res.status(200).json(game);
});

// PUT /games/{uuid}
app.put('/api/v1/games/:game_id', async (req, res) => {
    let game_id = req.params.game_id;

    let game = await game_database.get(game_id);

    if(!game) return res.status(404).json({
        'code': 404,
        'message': 'Resource not found'
    });

    let update = req.body;

    if(!update?.name && !update?.difficulty && !update?.board) return res.status(400).json({
        'code': 400,
        'message': 'Bad request: Missing GameCreateUpdateRequest'
    });

    if(update?.name && typeof update.name !== 'string') return res.status(422).json({
        'code': 422,
        'message': `Semantic error: Not a valid name`
    });

    if(update?.difficulty && !['beginner', 'easy', 'medium', 'hard', 'extreme'].includes(update.difficulty)) return res.status(422).json({
        'code': 422,
        'message': `Semantic error: Not a valid DifficultyType`
    });

    if(update?.board && (!Array.isArray(update.board) || update.board.length !== 15 || !update.board.every((row) => Array.isArray(row) && row.length === 15 && row.every(cell => cell === "X" || cell === "O" || cell === "")))) return res.status(422).json({
        'code': 422,
        'message': `Semantic error: Not a valid board`
    });

    if(update?.name){
        game.name = update.name;
    };

    if(update?.difficulty){
        game.difficulty = update.difficulty;
    };

    if(update?.board){
        game.board = update.board;
    };

    let current_date = new Date();

    game.updatedAt = `${current_date.toLocaleDateString()}-${current_date.toLocaleTimeString()}`;

    let updated_game = await game_database.update(game_id, game);

    res.status(200).json(updated_game.content.value);
});

// DELETE /games/{uuid}
app.delete('/api/v1/games/:game_id', async (req, res) => {
    let game_id = req.params.game_id;

    let game = await game_database.get(game_id);

    if(!game) return res.status(404).json({
        'code': 404,
        'message': 'Resource not found'
    });

    await game_database.del(game_id);

    res.status(204).send();
});

/***************************** API *****************************/

app.listen(3000);