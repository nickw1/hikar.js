const OsmLoader = require('./osmloader');
const GoogleProjection = require('jsfreemaplib').GoogleProjection;

AFRAME.registerComponent('osm3d', {

    schema: {
        url: {
            type: 'string'
        },
    },

    init: function() {
        this.tilesLoaded = [];
        this.osmLoader = new OsmLoader(this);
        this.el.addEventListener('terrarium-dem-loaded', e=> {
            this.newObjectIds = [];
            this._loadAndApplyDem(e.detail.demData);
        });
    },

    _loadAndApplyDem: async function(demData) {
        const pois = [];
        for(let i=0; i<demData.length; i++) {
            const osmData = await this._loadData(demData[i].tile);
            if(osmData != null) {
                const features = await this._applyDem(osmData, demData[i]);
                pois.push(...features.pois);
            }
        }
        
        this.el.emit('osm-data-loaded', {
            objectIds: this.newObjectIds,
            pois: pois
        });
    },

    _loadData: async function(tile) {
        const tileIndex = `${tile.z}/${tile.x}/${tile.y}`;
        if(this.tilesLoaded.indexOf(tileIndex) == -1) {
            const realUrl = this.data.url.replace('{x}', tile.x)
                                .replace('{y}', tile.y)
                                .replace('{z}', tile.z);
            console.log(realUrl);
            const response = await fetch(realUrl);
            const osmData = await response.json();
            this.tilesLoaded.push(tileIndex);
            return osmData;
        }
        return null;
    },

    _applyDem: async function(osmData, dem) {
        const originSphMerc = document.querySelector('a-camera').components['gps-projected-camera'].originCoordsProjected;
        const features = await this.osmLoader.loadOsm(osmData,`${dem.tile.z}/${dem.tile.x}/${dem.tile.y}`, dem.dem);
        features.ways.forEach ( f=> {
            const mesh = new THREE.Mesh(f.geometry, new THREE.MeshBasicMaterial ( { color: f.properties.color } ));
            this.el.setObject3D(f.properties.id, mesh);
            this.newObjectIds.push(f.properties.id);
        });
        return features;
    }
});

