import express from 'express';
import UserModel from '../models/user.mjs';
import db from '../db/index.mjs';

const router = new express.Router();

const userModel = new UserModel(db);

router.post('/signup', async (req, res) => {
    try {
        if(req.body.username && req.body.password) {
            await userModel.signup(req.body.username, req.body.password);
            res.status(200).json({success:1});
        } else {
            res.status(400).json({error: 'Username/password not provided.'});
        }
    } catch(e) {
        res.status(500).json({error: e});
    }
});

export default router;
