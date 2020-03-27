const Tiler = require('./tiler');
const PNGReader = require('./pngjs/PNGReader');

class DemTiler extends Tiler {

    constructor(url) {
        super(url);
    }

    async readTile(url) {
        return new Promise ( (resolve, reject) => {
            const arrbuf = fetch(url).then(res => res.arrayBuffer()).then
                (arrbuf => {
                    const reader = new PNGReader(arrbuf);
                    reader.parse( (err,png) => {
                        if(err) reject(err);
                        const imgData = png.getRGBA8Array();
                        const elevs = [];
                        for(let i=0; i<imgData.length; i+=4) {
                            elevs.push(Math.round((imgData[i]*256 + imgData[i+1] + imgData[i+2]/256) - 32768));
                    }
                    resolve ({ w:png.getWidth(), 
                               h:png.getHeight(), 
                               elevs:elevs });
                });
            }); 
        });
    }
}

module.exports = DemTiler;
