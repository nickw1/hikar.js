const SignpostManager = require('./SignpostManager');

const sMgr = new SignpostManager();

onmessage = e => {
    switch(e.data.type) {
        case 'updateData':
            sMgr.update(e.data.data.ways, e.data.data.pois);
            postMessage({ type: 'dataUpdated' });
            break;

        case 'checkJunction':
            const sign = sMgr.updatePos(e.data.data, {
                onStartProcessing: () => {
                    postMessage({ type: 'processingJunction' });
                }
            });
            postMessage({ type: 'checkJunctionFinished', data: sign });  
            break;
    }
};
