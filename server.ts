import express from 'express';
import ViteExpress from 'vite-express';
import mapRouter from './routes/map';
const app = express();

const PORT = 3001;

app.use('/map', mapRouter);

ViteExpress.listen(app, PORT, () => {
    console.log(`App listening on port ${PORT}.`);
});
