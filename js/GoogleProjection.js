

const Tile = require('./Tile');


class GoogleProjection  {
    
   
    constructor() {
        this.EARTH = 40075016.68; 
        this.HALF_EARTH = 20037508.34;
    } 

    project (lon, lat) {
        return [this.lonToGoogle(lon), this.latToGoogle(lat)];
    }
    
    unproject (projected) {
        return [this.googleToLon(projected[0]),this.googleToLat(projected[1])];
    }
    
    lonToGoogle( lon) {
        return (lon/180) * this.HALF_EARTH;
    }
    
    latToGoogle(lat) {
        var y = Math.log(Math.tan((90+lat)*Math.PI/360)) / (Math.PI/180);
        return y*this.HALF_EARTH/180.0;
    }
    
    googleToLon(x) {
            return (x/this.HALF_EARTH) * 180.0;
    }
    
    googleToLat(y) {
        var lat = (y/this.HALF_EARTH) * 180.0;
        lat = 180/Math.PI * (2*Math.atan(Math.exp(lat*Math.PI/180)) - Math.PI/2);
        return lat;
    }
    
    getTile (p, z) {
        //console.log(`getTile(): ${p[0]} ${p[1]}`);
        var tile = new Tile(-1, -1, z);
        var metresInTile = tile.getMetresInTile(); 
        //console.log(metresInTile);
        tile.x = Math.floor((this.HALF_EARTH+p[0]) / metresInTile);
        tile.y = Math.floor((this.HALF_EARTH-p[1]) / metresInTile);
        return tile;
    }
    
    getTileFromLonLat(lon, lat, z) {
        //console.log(`getTileFromLonLat(): ${lon} ${lat} ${z}`);
        return this.getTile([this.lonToGoogle(lon),this.latToGoogle(lat)], z);
    }

    getID() {
        return "epsg:3857";
    }
}

module.exports = GoogleProjection;
