import express from 'express';
import ViteExpress from 'vite-express';
import mapRouter from './routes/map';
import fetch from 'node-fetch';
const app = express();

const PORT = 3001;


app.use('/map', mapRouter);

app.get('/dem/:z/:x/:y.png', async(req, res) => {
    try {
        const resp = await fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${req.params.z}/${req.params.x}/${req.params.y}.png`);
        if(resp.status == 200) {
            res.set('Content-Type', 'image/png');
            (resp.body!).pipe(res);
        } else {
            res.status(resp.status).json({error: 'Could not retrieve DEM'});
        }
    } catch(e) { 
        res.status(500).json({error: e});
    }
});

ViteExpress.listen(app, PORT, () => {
    console.log(`App listening on port ${PORT}.`);
});
