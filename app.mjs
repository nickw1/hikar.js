import express from 'express';
const app = express();
import 'dotenv/config';
import mapRouter from './routes/map.mjs';
import userRouter from './routes/user.mjs';
import MapModel from './models/map.mjs';
import UserModel from './models/user.mjs';
import NoticeboardModel from './models/noticeboard.mjs';
import db from './db/index.mjs';
import expressSession from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import fetch from 'node-fetch';
import morgan from 'morgan';
import cors from 'cors';
const pgSession = connectPgSimple(expressSession);
const mapModel = new MapModel(db);
const userModel = new UserModel(db);
const noticeboardModel = new NoticeboardModel(db);


app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(morgan('combined'));
app.use(cors());

// add noticeboard - /fm/ws/annotation.php?action=create&lon=$lon&lat=$lat&annotationType=$annotationType&text=$annotation, http auth (Authorization header), base64 encoded

app.use(express.static('public'));

app.use(expressSession({
    store: new pgSession({
        pool: db
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    unset: 'destroy',
    proxy: true,
    cookie: {
        maxAge: 600000,
        httpOnly: false
    }
}));

app.use('/map', mapRouter);
app.use('/user', userRouter);

const numRegex = /^\d+$/;
const floatRegex = /^[\d\.\-]+$/;

// Fake the old endpoint - necessary for the Hikar app to continue working 
app.get('/tile', async(req, res) => {
    if(numRegex.exec(req.query.x) && numRegex.exec(req.query.y) && numRegex.exec(req.query.z)) {
        try {
            const mapData = await mapModel.getMap(
                req.query, ['ways', 'pois']
            );
            res.json(mapData);
        } catch(e) {
            res.status(500).json(e);
        }    
    } else {
        res.status(400).json({error: 'Invalid x,y,z query parameters'});
    }
});

// Noticeboard endpoint from Hikar app
app.post('/annotation/create', async(req, res) => {
    const auth = req.headers.authorization ? req.headers.authorization.split(' ') : null;
    if(auth && auth.length == 2) {
        const [user, pass] = Buffer.from(auth[1], 'base64').toString().split(':');
        try {
            if(await userModel.validate(user, pass)) {
                // lon lat annotationType text
                if(floatRegex.exec(req.body.lon) && floatRegex.exec(req.body.lat)) {
                    await noticeboardModel.add(req.body);            
                } else {
                    res.status(400).json({error: 'Invalid lat/lon format.'});
                }
            } else {
                res.status(401).json({error: 'Invalid login details.'});
            }
        } catch(e) {
            res.status(500).json({error: e});
        }
    } else {
        res.status(401).json({error: 'No login details.'});
    }
});

app.get('/dem/:z(\\d+)/:x(\\d+)/:y(\\d+).png', async(req, res) => {
    try {
        const resp = await fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${req.params.z}/${req.params.x}/${req.params.y}.png`);
        if(resp.status == 200) {
            res.set('Content-Type', 'image/png');
            resp.body.pipe(res);
        } else {
            res.status(resp.status).json({error: 'Could not retrieve DEM'});
        }
    } catch(e) { 
        res.status(500).json({error: e});
    }
});

app.listen(3001);
