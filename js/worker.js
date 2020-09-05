const SignpostManager = require('./SignpostManager');

let sMgr = null; 

onmessage = e => {
    switch(e.data.type) {
        case 'updateData':
            if(sMgr !== null) {
                sMgr.update(e.data.data.ways, e.data.data.pois);
                postMessage({ type: 'dataUpdated' });
            }
            break;

        case 'checkJunction':
            if(sMgr !== null) {
                const sign = sMgr.updatePos(e.data.data, {
                    onStartProcessing: () => {
                        postMessage({ type: 'processingJunction' });
                    }
                });
                postMessage({ type: 'checkJunctionFinished', data: sign });  
            }
            break;
    
        case 'setOptions':
            if(sMgr === null) {
                sMgr = new SignpostManager({
                    distThreshold: e.data.data.distThreshold,
                    poiDistThreshold: e.data.data.poiDistThreshold,
                    roadCost: e.data.data.roadCost,
                    minPathProportion: e.data.data.minPathProportion,
                    minPathProportionOverride: e.data.data.minPathProportionOverride
                });
            } else {
                sMgr.setOptions({
                    distThreshold: e.data.data.distThreshold,
                    poiDistThreshold: e.data.data.poiDistThreshold,
                    roadCost: e.data.data.roadCost,
                    minPathProportion: e.data.data.minPathProportion,
                    minPathProportionOverride: e.data.data.minPathProportionOverride
                });
            }
            break;    
        }
};
