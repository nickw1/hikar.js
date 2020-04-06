const Tile=require('./Tile');
const DEM = require("./dem");
const DemTiler = require('./demtiler');

AFRAME.registerComponent ('terrarium-dem', {

    schema: {
        url: {
            type: 'string'
        },
        zoom: {
            type:'int'
        },
        lat: {
            type: 'number',
            default: 181
        },
        lon: {
            type: 'number',
            default: 91
        }
    },

    init: function() {
        this.dems = {};
        this.tilesLoaded = [];
        this.tiler = new DemTiler();
           this.tiler.url = this.data.url;
        this.tiler.setZoom(this.data.zoom);
    },

    update: function() {
        this._setPosition();
    },

    _updateLonLat: async function(lon, lat) {
         const sphMerc = this.tiler.lonLatToSphMerc(lon,lat);
         return await this._updateSphMerc(sphMerc);
     },

    _updateSphMerc: async function(sphMerc) {
         const dems = [];
         const newData = await this.tiler.update(sphMerc);
         newData.forEach ( data=> { 
             const dem = this._loadTerrariumData(data);
               if(dem != null) {
                   dems.push(dem);
               }
           });     
           return dems;
    },

    _loadTerrariumData: function(data) {
         let demData = null;    
         if(data !== null) {
             const geom = this._createDemGeometry(data);
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
    },

    _createDemGeometry: function(data) {
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
     },

     _getElevation: function(lon, lat, z) {
         const sphMercPos = this.tiler.lonLatToSphMerc(lon, lat, z);
         return this._getElevationFromSphMerc(sphMercPos, z);
     },

     _getElevationFromSphMerc: function(sphMercPos, z) {    
         const tile = this.tiler.getTile(sphMercPos, z);
         if(this.dems[`${tile.z}/${tile.x}/${tile.y}`]) {
             const scaled = [ sphMercPos[0], sphMercPos[1]  ];
             return this.dems[`${tile.z}/${tile.x}/${tile.y}`].getHeight
                 (scaled[0], scaled[1]);
         }
         return -1;
     },

     _setPosition: async function() {
         if(this.data.lon >= -180 && this.data.lon <= 180 && this.data.lat >= -90 && this.data.lat <= 90) {
             const demData = await this._updateLonLat(this.data.lon, this.data.lat);
             this.el.emit('terrarium-dem-loaded', { 
                 demData: demData,
                 elevation: this._getElevation(this.data.lon, this.data.lat, this.data.zoom),
                 lat: this.data.lat,
                 lon: this.data.lon
            });
        }
    }
});
