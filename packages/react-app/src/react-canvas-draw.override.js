//"react-canvas-draw
_this.loadSaveData = function (saveData) {
      var immediate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _this.props.immediateLoading;

      if (typeof saveData !== "string") {
        throw new Error("saveData needs to be of type string!");
      }

      var _JSON$parse = JSON.parse(saveData),
          lines = _JSON$parse.lines,
          width = _JSON$parse.width,
          height = _JSON$parse.height;

      if (!lines || typeof lines.push !== "function") {
        throw new Error("saveData.lines needs to be an array!");
      }

      _this.clear();

      if (width === _this.props.canvasWidth && height === _this.props.canvasHeight) {
        _this.simulateDrawingLines({
          lines: lines,
          immediate: immediate
        });
      } else {
        // we need to rescale the lines based on saved & current dimensions
        var scaleX = _this.props.canvasWidth / width;
        var scaleY = _this.props.canvasHeight / height;
        var scaleAvg = (scaleX + scaleY) / 2;

        _this.simulateDrawingLines({
          lines: lines.map(function (line) {
            return _extends({}, line, {
              points: line.points.map(function (p) {
                return {
                  x: p.x * scaleX,
                  y: p.y * scaleY
                };
              }),
              brushRadius: line.brushRadius * scaleAvg
            });
          }),
          immediate: immediate
        });
      }

      //draw bm and profile
      const _ctx = _this.ctx.drawing;
      const _grid = _this.ctx.grid;
      _ctx.font = "16pt Overpass Mono";
      _ctx.shadowColor = "#fff";
      _ctx.shadowBlur = 3;
      // _ctx.strokeStyle = _ctx.fillStyle = '#f44336';
      // _ctx.strokeStyle = _ctx.fillStyle = '#f24f4f';
      _ctx.strokeStyle = "#bf0404";
      _ctx.fillStyle = "#cb0505";

      let dashLen = 220,
      dashOffset = dashLen,
      speed = 25,
      txt = "",
      x = 10,
      y = 420,
      i = 0;

      if(_this.props.bm != ""){
        _ctx.fillText(_this.props.bm, 320, 30);
        _ctx.strokeText(_this.props.bm, 320, 30);
      }

      if(_this.props.profile != ""){
        const _i = new Image();
        _i.src = _this.props.profile;
        _i.crossOrigin = "anonymous";
        _i.onload = async () => {
          await _grid.drawImage(_i, 435, 10, 55, 55);
        }
      }

      _this.loopTextAnim = () => {
        //_ctx.clearRect(x, 0, 200, 150);
        _ctx.setLineDash([dashLen - dashOffset, dashOffset - speed]); // create a long dash mask
        dashOffset -= speed;

        if (txt[i] == "#") {
          x = 10;
          y += 30;
          i++;
        } // reduce dash length
        if(txt[i] == undefined){
          return;
        }
        _ctx.strokeText(txt[i], x, y); // stroke letter

        if (dashOffset > 0) window.requestAnimationFrame(_this.loopTextAnim);
        // animate
        else {
          _ctx.fillText(txt[i], x, y); // fill final letter
          dashOffset = dashLen; // prep next char
          x += _ctx.measureText(txt[i++]).width + _ctx.lineWidth * Math.random();
          //_ctx.setTransform(1, 0, 0, 1, 0, 3 * Math.random());        // random y-delta
          //_ctx.rotate(Math.random() * 0.005);                         // random rotation
          if (i < txt.length) window.requestAnimationFrame(_this.loopTextAnim);
        }
      };

      //draw text animations
      if(_this.props.stats != ""){
        txt = _this.props.stats;
        _this.loopTextAnim();
      }
      

    };