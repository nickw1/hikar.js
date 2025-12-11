import express from 'express';
import ViteExpress from 'vite-express';
const app = express();

const PORT = 3001;

ViteExpress.listen(app, PORT, () => {
    console.log(`App listening on port ${PORT}.`);
});
