const Tile=require('./Tile');
const GoogleProjection = require('./GoogleProjection');
const DEM = require("./dem");
const OsmWay = require('./osmway');
const DemTiler = require('./demtiler');

class Terrarium {

    constructor(options) {
        this.options = options;
        this.tilesLoaded = [];
        this.tiler = new DemTiler();
        this.dems = {};
        this.setTilerUrl(this.options.url);
        this.setTilerZoom(this.options.zoom);
    }

    setTilerUrl(url) {
        this.tiler.url = url;
    }

    setTilerZoom(zoom) {
        this.tiler.setZoom(zoom);
    }

    async updateLonLat(lon, lat) {
        const sphMerc = this.tiler.lonLatToSphMerc(lon,lat);
        return await this.updateSphMerc(sphMerc);
    }

    async updateSphMerc(sphMerc) {
        const dems = [];
        const newData = await this.tiler.update(sphMerc);
        newData.forEach ( data=> { 
            const dem = this.loadTerrariumData(data);
            if(dem != null) {
                dems.push(dem);
            }
        });     
        return dems;
    }

    loadTerrariumData(data) {
        let demData = null;    
        if(data !== null) {
            const geom = this.createDemGeometry(data);
            geom.geom.computeFaceNormals();
            geom.geom.computeVertexNormals();
            const dem = new DEM(geom.geom.getAttribute("position").array, 
                                geom.realBottomLeft,
                                geom.geom.parameters.widthSegments+1,
                                geom.geom.parameters.heightSegments+1,
                                geom.geom.parameters.width / geom.geom.parameters.widthSegments,
                                geom.geom.parameters.height / geom.geom.parameters.heightSegments);
            this.dems[`${data.tile.z}/${data.tile.x}/${data.tile.y}`] = dem;
            demData = { dem: dem, tile: data.tile };
        }
        return demData;
    }

    createDemGeometry(data) {
        const demData = data.data;
        const tile = data.tile; 
        const topRight = tile.getTopRight();
        const bottomLeft = tile.getBottomLeft();
        const centre = [(topRight[0] + bottomLeft[0]) / 2, 
            (topRight[1] + bottomLeft[1]) /2];
        const xSpacing = (topRight[0] - bottomLeft[0]) / (demData.w-1);
        const ySpacing = (topRight[1] - bottomLeft[1]) / (demData.h-1);
        const realBottomLeft = [bottomLeft[0], bottomLeft[1]] ;
        const geom = new THREE.PlaneBufferGeometry(topRight[0] - bottomLeft[0], topRight[1] - bottomLeft[1], demData.w - 1,  demData.h - 1);
        const array = geom.getAttribute("position").array;
        let i;
        for (let row=0; row<demData.h; row++) {
           for(let col=0; col<demData.w; col++) {
                i = row*demData.w + col;
                array[i*3+2] = -(centre[1] + array[i*3+1]); 
                array[i*3+1] = demData.elevs[i];
                array[i*3] += centre[0];
            }        
        }

        return {geom: geom, realBottomLeft: realBottomLeft };    
    }

    getElevation(lon, lat, z) {
        const sphMercPos = this.tiler.lonLatToSphMerc(lon, lat, z);
        return this.getElevationFromSphMerc(sphMercPos, z);
    }

    getElevationFromSphMerc(sphMercPos, z) {    
        const tile = this.tiler.getTile(sphMercPos, z);
        if(this.dems[`${tile.z}/${tile.x}/${tile.y}`]) {
            const scaled = [ sphMercPos[0], sphMercPos[1]  ];
            return this.dems[`${tile.z}/${tile.x}/${tile.y}`].getHeight
                (scaled[0], scaled[1]);
        }
        return -1;
    }

    async setPosition(lon, lat) {
        if(lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90) {
            const demData = await this.updateLonLat(lon, lat);
            return { demData: demData, elevation: this.getElevation(lon, lat, this.options.zoom) };
        }
    }
}

module.exports = Terrarium;
