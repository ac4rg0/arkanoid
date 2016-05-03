
(function() {
    function Sprite(url, pos, size, speed, frames, dir, once) {
        this.pos = pos;
        this.size = size;
        this.speed = typeof speed === 'number' ? speed : 0;
        this.frames = frames;
        this._index = 0;
        this.url = url;
        this.dir = dir || 'horizontal';
        this.once = once;
    };

    Sprite.prototype = {
        update: function(dt) {
            this._index += this.speed*dt;
        },

        _render: function() {
	    var frame;

            if(this.speed > 0) {
                var max = this.frames.length;
                var idx = Math.floor(this._index);
                frame = this.frames[idx % max];

                if(this.once && idx >= max) {
                    this.done = true;
                    return;
                }
            }
            else {
                frame = 0;
            }


            var x = this.pos[0];
            var y = this.pos[1];

            if(this.dir == 'vertical') {
                y += frame * this.size[1];
            }
            else {
                x += frame * this.size[0];
            }

		return {x: x, y:y};

		 },

        render: function(ctx) {
        	var pos = this._render();
	    		ctx.drawImage(resources.get(this.url),
                          pos.x, pos.y,
                          this.size[0], this.size[1],
                          0, 0,
                          this.size[0], this.size[1]);
        },

	image: function() {
		var pos = this._render();
		var pattern_canvas = document.createElement('canvas');
		pattern_canvas.width = this.size[0];
		pattern_canvas.height = this.size[1];
		var pattern_context = pattern_canvas.getContext('2d');
			pattern_context.drawImage(resources.get(this.url),
                          pos.x, pos.y,
                          this.size[0], this.size[1],
                          0, 0,
                          this.size[0], this.size[1]);
		return pattern_canvas;
	       }
    };

    window.Sprite = Sprite;
})();
