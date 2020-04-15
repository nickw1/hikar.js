const Tiler = require('nw-geolib').Tiler;

class JsonTiler extends Tiler {
    constructor(url) {
        super(url);
    }

    async readTile(url) {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    }
}

module.exports = JsonTiler;
