class DEM  {
    constructor(geom, bottomLeft) {
        
        this.bottomLeft=bottomLeft;
        this.ptWidth=geom.parameters.widthSegments+1;
        this.ptHeight=geom.parameters.heightSegments+1;
        this.vertices = geom.getAttribute("position").array;
        this.xSpacing=geom.parameters.width / geom.parameters.widthSegments;
        this.ySpacing=geom.parameters.height / geom.parameters.heightSegments;
    }
    
    
        
    // Uses bilinear interpolation
    // Based on Footnav code
    // x,y must be in projection of the geometry with scaling factor 
    // already applied
    getHeight(x, y) {
        let p = [x,y];
        let xIdx = Math.floor((p[0]-this.bottomLeft[0]) / this.xSpacing),
            yIdx = this.ptHeight-(Math.ceil((p[1] - this.bottomLeft[1]) / this.ySpacing));
        
        let x1,x2,y1,y2;
        let h1,h2,h3,h4;
        
        let h = -1;

        // 021114 change this so that points outside the DEM are given a height based on closest edge/corner
        // idea being to reduce artefacts at the edges of tiles
        // this means that a -1 return cannot now be used to detect whether a point is in the DEM or not
        // (hopefully this is NOT being done anywhere!)
        // 200215 turning this off again due to iffy results
        
        if(xIdx>=0 && yIdx>=0 && xIdx<this.ptWidth-1 && yIdx<this.ptHeight-1) {
            h1 = this.vertices[(3*(yIdx*this.ptWidth+xIdx))+1];
            h2 = this.vertices[(3*(yIdx*this.ptWidth+xIdx+1))+1];
            h3 = this.vertices[(3*(yIdx*this.ptWidth+xIdx+this.ptWidth))+1];
            h4 = this.vertices[(3*(yIdx*this.ptWidth+xIdx+this.ptWidth+1))+1];
            
            x1 = this.bottomLeft[0] + xIdx*this.xSpacing;
            x2 = x1 + this.xSpacing;
            
            // 041114 I think this was wrong change from this.ptHeight-yIdx to this.ptHeight-1-yIdx
            y1 = this.bottomLeft[1] + (this.ptHeight-1-yIdx)*this.ySpacing;
            y2 = y1 - this.ySpacing;
            
//            console.log("x,y bounds " + x1 + " " + y1+ " " +x2 + " " +y2);
 //           console.log("vertices " + h1 + " " + h2+ " " +h3 + " " +h4);
            
            let propX = (p[0]-x1)/this.xSpacing;
            
            let htop = h1*(1-propX) + h2*propX,
                hbottom = h3*(1-propX) + h4*propX;
            
            let propY = (p[1]-y2)/this.ySpacing;
            
            h = hbottom*(1-propY) + htop*propY;
            
            //console.log("*******************************height is: " + h);
            
        } 
        return h;
    }
}

module.exports = DEM;

