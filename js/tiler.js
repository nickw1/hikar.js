const GoogleProjection = require('./GoogleProjection');
const Tile = require('./Tile');

class Tiler {
    constructor(url) {
        this.tile = new Tile(0, 0, 13); 
        this.tilesLoaded = [];
        this.url = url;
        this.sphMerc = new GoogleProjection();
    }

    setZoom(z) {
        this.tile.z = z;
    }

    lonLatToSphMerc(lon, lat) {
        return this.sphMerc.project(lon, lat);
    }

    getTile(sphMercPos, z) {
        return this.sphMerc.getTile(sphMercPos, z);
    }

    async update(pos) {
        const loadedData = [];
        let t;
        if( t = this.needNewData(pos)) {
            const tilesX = [t.x, t.x-1, t.x+1], tilesY = [t.y, t.y-1, t.y+1];
            for(let ix=0; ix<tilesX.length; ix++) {    
                for(let iy=0; iy<tilesY.length; iy++) {    
                    const thisTile = new Tile(tilesX[ix], tilesY[iy], t.z);
                    const data = await this.loadTile(thisTile);
                    if(data !== null) {
                        loadedData.push({ data: data, tile: thisTile });
                    }
                }
            }
        }
        return loadedData;
    }

    needNewData(pos) {
        if(this.tile) {
            const newTile = this.sphMerc.getTile(pos, this.tile.z);
            const needUpdate = newTile.x != this.tile.x || newTile.y != this.tile.y;
            this.tile = newTile;    
            return needUpdate ? newTile : false;
        }
        return false;
    }

    async loadTile(tile) {
        const tileIndex = `${tile.z}/${tile.x}/${tile.y}`;    
        if(this.tilesLoaded.indexOf(tileIndex) == -1) {
            const tData = await this.readTile(this.url
                .replace("{x}", tile.x)
                .replace("{y}", tile.y)
                .replace("{z}", tile.z)
            );
            this.tilesLoaded.push(tileIndex);
            return tData;
        }
        return null;
    }

    async readTile(url) {
        return null;
    }

    projectLonLat(lon, lat) {
        return this.sphMerc.project(lon,lat);
    }
}

module.exports = Tiler;
