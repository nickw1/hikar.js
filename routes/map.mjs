import express from 'express';
const router = express.Router();
import MapModel from '../models/map.mjs';
import db from '../db/index.mjs';
const mapModel = new MapModel(db);


router.get('/:z(\\d+)/:x(\\d+)/:y(\\d+).json', async (req, res) => {
    try {
        const mapData = await mapModel.getMap(
            req.params, ['ways', 'pois', 'annotations'], req.query ? req.query.outProj: null
        );
        res.json(mapData);
    } catch(e) {
        res.status(500).json(e);
    }    
});

export default router;
