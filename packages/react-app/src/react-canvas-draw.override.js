//"react-canvas-draw
// import CanvasDraw from "react-canvas-draw";

// let canvasDraw = CanvasDraw;
// window.canvasDraw = canvasDraw;
// const initCanvas = () => {
//   overrideCanvas(canvasDraw.saveableCanvas);
// };
// const showCanvasInterface = _f => {
//     canvasDraw.saveableCanvas.canvas.interface.style.display = _f ? "block" : "none";
// };
// const playCanvasImage = async () => {
//   const _dataURL = await LZ.decompress(window.localStorage.getItem("savedDrawing"));
//   await canvasDraw.saveableCanvas.loadSaveData(_dataURL, false);
// };
// const saveData = async () => {
//   const _dataURL = await LZ.compress(canvasDraw.saveableCanvas.getSaveData());
//   window.localStorage.setItem("savedDrawing", _dataURL);
// };

const overrideCanvas = canvasObj => {
  let _extends =
    Object.assign ||
    function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];
        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }
      return target;
    };
  let _this = canvasObj;
  canvasObj.loadSaveData = function (saveData) {
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
        immediate: immediate,
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
                y: p.y * scaleY,
              };
            }),
            brushRadius: line.brushRadius * scaleAvg,
          });
        }),
        immediate: immediate,
      });
    }

    //draw bm and profile
    const _ctx = _this.ctx.drawing;
    const _grid = _this.ctx.grid;

    // _ctx.font = "15pt Overpass Mono";
    // _ctx.shadowColor = "#fff";
    // _ctx.shadowBlur = 6;
    // _ctx.strokeStyle = _ctx.fillStyle = '#f44336';
    // _ctx.strokeStyle = _ctx.fillStyle = '#f24f4f';
    // _ctx.strokeStyle = "#bf0404";
    // _ctx.fillStyle = "#cb0505";

    if (_this.props.bm != "") {
      let bx = _this.props.canvasWidth - _this.props.imgSrcPadding - 190,
        by = _this.props.imgSrcPadding + 30;

      _ctx.font = "15pt Overpass Mono";
      _ctx.shadowColor = "#fff";
      _ctx.shadowBlur = 3;
      _ctx.strokeStyle = "#bf0404";
      _ctx.fillStyle = "#cb0505";
      _ctx.fillText(_this.props.bm, bx, by);
      _ctx.strokeText(_this.props.bm, bx, by);
      _ctx.fill();
    }

    if (_this.props.profile != "") {
      let px = _this.props.canvasWidth - _this.props.imgSrcPadding - 65,
        py = _this.props.imgSrcPadding + 10;

      const _i = new Image();
      _i.src = _this.props.profile;
      _i.crossOrigin = "anonymous";
      _i.onload = async () => {
        await _grid.drawImage(_i, px, py, 55, 55);
      };
    }

    _this.loopTextAnim = () => {
      //_ctx.clearRect(x, 0, 200, 150);
      _ctx.setLineDash([dashLen - dashOffset, dashOffset - speed]); // create a long dash mask
      dashOffset -= speed;

      if (txt[i] == "#") {
        sx = _this.props.imgSrcPadding + 10;
        sy += 30;
        i++;
      } // reduce dash length
      if (txt[i] == undefined) {
        return;
      }
      _ctx.strokeText(txt[i], sx, sy); // stroke letter

      if (dashOffset > 0) window.requestAnimationFrame(_this.loopTextAnim);
      // animate
      else {
        _ctx.fillText(txt[i], sx, sy); // fill final letter
        _ctx.fill();
        dashOffset = dashLen; // prep next char
        sx += _ctx.measureText(txt[i++]).width + _ctx.lineWidth * Math.random();
        //_ctx.setTransform(1, 0, 0, 1, 0, 3 * Math.random());        // random y-delta
        //_ctx.rotate(Math.random() * 0.005);                         // random rotation
        if (i < txt.length) window.requestAnimationFrame(_this.loopTextAnim);
      }
    };

    let sx,
      sy,
      dashLen = 220,
      dashOffset = dashLen,
      txt = "",
      speed = 25,
      i = 0;

    //draw text animations
    if (_this.props.stats != "") {
      sx = _this.props.imgSrcPadding + 10;
      sy = _this.props.canvasHeight - _this.props.imgSrcPadding - 80;

      txt = _this.props.stats;
      _ctx.font = "20pt Overpass Mono";
      _ctx.shadowColor = "#fff";
      _ctx.shadowBlur = 2;
      _ctx.strokeStyle = "#bf0404";
      _ctx.fillStyle = "#cb0505";

      _this.loopTextAnim();
    }
  };
};

export default overrideCanvas;
