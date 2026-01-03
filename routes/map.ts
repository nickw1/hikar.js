import express from 'express';
const router = express.Router();
import MapModel from '../models/map';
import db from '../db';
import { Tile } from 'locar-tiler'; 
const mapModel = new MapModel(db);

import type { LayerKey } from '../types/hikar';

router.get('/:z/:x/:y.json', async (req, res) => {
    try {
        const regex = /^\d+$/;
        if(regex.exec(req.params.x) && regex.exec(req.params.y) && regex.exec(req.params.z)) {
            const mapData = await mapModel.getMap(
                new Tile(
                    parseInt(req.params.x),
                    parseInt(req.params.y),
                    parseInt(req.params.z)
                ),
                req.query?.layers ? (req.query.layers as string).split(",") as Array<LayerKey> : new Array<LayerKey>('ways', 'poi'), 
                req.query?.outProj ? (req.query.outProj as string): null
            );

            res.json(mapData);
        } else {
            res.status(500).json({"error": "x,y,z need to be numbers"});
        }
    } catch(e: any) {
        res.status(500).json(e);
    }    
});

export default router;

