let express = require('express');

let app = express();

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.static('./public'));

app.get('/', (req, res) => {
    res.status(200).render('index');
});

app.get('/api', (req, res) => {
    res.status(200).json({"organization": "Student Cyber Games"})
});

app.get('*', (req, res) => {
    res.status(404).render('pagenotfound')
});

app.listen(3000)