
class Tile {
        
    constructor(x, y, z) {
        this.x=x; this.y=y; this.z=z;
        this.EARTH = 40075016.68; 
        this.HALF_EARTH = 20037508.34;
    }

     getMetresInTile() {
        return this.EARTH/Math.pow(2,this.z);
     }

     getBottomLeft() {
        var metresInTile = this.getMetresInTile();
        return [this.x*metresInTile - this.HALF_EARTH, this.HALF_EARTH - (this.y+1)*metresInTile];    
     }

     getTopRight() {
        var p = this.getBottomLeft();
        var metresInTile = this.getMetresInTile();
        p[0] += metresInTile;
        p[1] += metresInTile;
        return p;    
     }
}

module.exports = Tile;
