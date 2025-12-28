import express from 'express';
import ViteExpress from 'vite-express';
import mapRouter from './routes/map';
import fetch from 'node-fetch';
import { loadEnvFile } from 'node:process';
import * as fs from 'node:fs';
const app = express();

const PORT = 3001;

loadEnvFile();

app.use('/map', mapRouter);

// Get local DEM tiles
app.get('/dem/:z/:x/:y.png', async(req, res) => {
    try {
        const regExp=/^\d+$/;
        if(regExp.exec(req.params.x) && regExp.exec(req.params.y) && regExp.exec(req.params.z)) {
            const filename = `${process.env.TERRARIUM_TILES}/${req.params.z}/${req.params.x}/${req.params.y}.png`;
            fs.createReadStream(filename)
                .on('error', (e: any) => {
                    const notFound = e.code == 'ENOENT';
                    res.status(notFound ? 404 : 500)
                        .json({
                            "error": 
                            notFound ? 
                            "Can't find file": 
                            "Unknown error loading tile"
                        })
                    }).pipe(res);
        } else {        
            res.status(400).json({error:"x, y and z must be integers"});
        }
    } catch(e) { 
        res.status(500).json({error: e});
    }
});

// Get DEM tiles from AWS
app.get('/dem/aws/:z/:x/:y.png', async(req, res) => {
    try {
        const resp = await fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${req.params.z}/${req.params.x}/${req.params.y}.png`);
        if(resp.status == 200) {
            res.set('Content-Type', 'image/png');
            resp.body?.pipe(res);
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
