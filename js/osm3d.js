const OsmLoader = require('./osmloader');

class OSM3D {
    constructor(url) {
        this.tilesLoaded = [];
        this.osmLoader = new OsmLoader(this);
        this.url = url;
    }

    async loadData(tile) {
        const tileIndex = `${tile.z}/${tile.x}/${tile.y}`;
        if(this.tilesLoaded.indexOf(tileIndex) == -1) {
            const realUrl = this.url.replace('{x}', tile.x)
                                .replace('{y}', tile.y)
                                .replace('{z}', tile.z);
            console.log(realUrl);
            const response = await fetch(realUrl);
            const osmData = await response.json();
            this.tilesLoaded.push(tileIndex);
            return osmData;
        }
        return null;
    }

    async applyDem(osmData, dem) {
        const data = await this.osmLoader.loadOsm(osmData,`${dem.tile.z}/${dem.tile.x}/${dem.tile.y}`, dem.dem);
        console.log(JSON.stringify(data));
    }

    async loadDem(demData) {
        for(let i=0; i<demData.length; i++) {
            const osmData = await this.loadData(demData[i].tile);
            await this.applyDem(osmData, demData[i]);
        }
    }
}

module.exports = OSM3D;
