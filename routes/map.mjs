import express from 'express';
const router = express.Router();
import MapModel from '../models/map.mjs';
import db from '../db/index.mjs';
import DemTiler from 'jsfreemaplib/demtiler.js';
import fetch from 'node-fetch';
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

router.get('/:z(\\d+)/:x(\\d+)/:y(\\d+).poi.json', async (req, res) => {
    try {
        const mapData = await mapModel.getMap(
            req.params, ['pois'], req.query ? req.query.outProj: null
        );
        res.json(mapData);
    } catch(e) {
        res.status(500).json(e);
    }    
});

router.get('/peaks', async(req, res) => {
	try {
		if(req.query.bbox && /^[0-9\.\-\,]+$/.exec(req.query.bbox)) {
			const bbox = req.query.bbox.split(',').map(str => parseFloat(str));
			if(bbox.length == 4) {
				const data = await mapModel.getPeaks(bbox);
				res.json(data);
			} else {
				res.status(400).json({error: 'Bbox does not have 4 values'});
			} 
		} else {
			res.status(400).json({error: 'Invalid bbox format'});
		}
	} catch(e) {
		res.status(500).json({error: e});
	}
});


export default router;
