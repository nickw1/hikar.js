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
        for(let i=0; i<demData.length; i++) {
            const osmData = await this._loadData(demData[i].tile);
            if(osmData != null) {
                await this._applyDem(osmData, demData[i]);
            }
        }
        
        this.el.emit('vector-ways-loaded', {
           objectIds: this.newObjectIds
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
        features.pois
          .filter(f => f.properties.name !== undefined)
          .forEach(f => {
            const textEntity = document.createElement("a-text");
            textEntity.setAttribute("value", f.properties.name);
            textEntity.setAttribute("position", {
                x: f.geometry[0] - originSphMerc[0], 
                y: f.geometry[1] + 10,
                z: -(f.geometry[2] - originSphMerc[1]), 
            });
            textEntity.setAttribute("scale", {
                x: 100,
                y: 100,
                z: 100
            });
            textEntity.setAttribute("look-at", "[gps-projected-camera]");
            this.el.appendChild(textEntity);
            
        });
        return features;
    }
});

