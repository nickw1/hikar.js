AFRAME.registerComponent('pinch-detector', {
    init: function() {
        this.allTouches = [];
        this.allUntouches = [];
        this.left = { };
        this.right = { };
    },

    play: function() {
        if(!screen.orientation) return;

        this.el.sceneEl.canvas.addEventListener('touchstart', e=> {
            this.allTouches.push(...e.changedTouches);
            if(this.allTouches.length == 2) {
                this.left.id = 
                    this.allTouches[0].pageX < this.allTouches[1].pageX ? 
                    this.allTouches[0].identifier: 
                    this.allTouches[1].identifier;
                this.right.id = 
                    this.allTouches[0].pageX < this.allTouches[1].pageX ?
                    this.allTouches[1].identifier: 
                    this.allTouches[0].identifier;
                this.left.startX = 
                    this.allTouches[0].pageX < this.allTouches[1].pageX ?
                    this.allTouches[0].pageX:
                    this.allTouches[1].pageX;
                this.right.startX = 
                    this.allTouches[0].pageX < this.allTouches[1].pageX ?
                    this.allTouches[1].pageX:
                    this.allTouches[0].pageX;
                this.allTouches = [];
            }
        });    

        this.el.sceneEl.canvas.addEventListener('touchend', e=> {
            this.allUntouches.push(...e.changedTouches);
            if(this.allUntouches.length == 2) {
                let leftEnd, rightEnd;
                for(let i=0; i<2; i++) {
                    if(this.allUntouches[i].identifier == this.left.id) {
                        leftEnd = this.allUntouches[i].pageX;
                    } else if (this.allUntouches[i].identifier == this.right.id) {
                        rightEnd = this.allUntouches[i].pageX; 
                    }
                }
                if(leftEnd < this.left.startX && rightEnd > this.right.startX) {
                     this.el.emit("nw-pinch", { 
                         direction: -1
                     });
                }
                if(leftEnd > this.left.startX && rightEnd < this.right.startX) {
                     this.el.emit("nw-pinch", { 
                         direction: 1
                     }); 
                } 
                this.allUntouches = [];
            }
        });    
    }
});

