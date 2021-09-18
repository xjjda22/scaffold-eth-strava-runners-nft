//StravaActivityMap
import React, { useState, useEffect } from "react";
import { Button, Space, Row, Col, Card, Steps, Radio } from "antd";
import axios from "axios";
import html2canvas from "html2canvas";
// import CanvasDraw from "react-canvas-draw";
// import overrideCanvas from "../react-canvas-draw.override";
import { fabric } from "fabric";
import { SwatchesPicker, TwitterPicker } from "react-color";
import LZ from "lz-string";
import { useLocalStorage, useSimpleLocalStorage } from "../hooks";

const { Step } = Steps;

const fromWei = i => {
  return i / 10 ** 18;
};
const fromGWei = i => {
  return i / 10 ** 9;
};
const toGWei = i => {
  return i * 10 ** 9;
};

const ipfsAPI = require("ipfs-http-client");
const ipfs = ipfsAPI({ host: "ipfs.infura.io", port: "5001", protocol: "https" });

// import { stravaAct1Json } from "../stravaAct1Json";
// import { stravaAct2Json } from "../stravaAct2Json";

const { REACT_APP_STRAVA_CLIENTID, REACT_APP_STRAVA_SECRET, REACT_APP_STRAVA_CALLBACK } = process.env;

const clientId = REACT_APP_STRAVA_CLIENTID;
const clientSecret = REACT_APP_STRAVA_SECRET;
const callback = REACT_APP_STRAVA_CALLBACK;

const cWidth = 600,
  cHeight = 400,
  cPadding = 10;

const searchParams = new URLSearchParams(window.location.href);
let code = "",
  accessToken = "",
  refreshToken = "";
if (searchParams.has("code")) {
  code = searchParams.get("code");
}

//-- start - fabric --
let canvasFrabic;
let _txtbox, _stGroup;

const initCanvasFrabic = async () => {
  let { type } = JSON.parse(window.localStorage.getItem("stravaActivityJson")) || "";

  const _savedDrawingBack = LZ.decompress(window.localStorage.getItem("savedDrawingBack")) || "";
  const _savedDrawing = JSON.parse(window.localStorage.getItem("savedDrawing")) || [];
  const _bm = type ? (type.toLowerCase() == "run" ? "©️run🏃🏽‍♂nft" : "©️ride🚴🏽‍♂nft") : "";
  const _stats = window.localStorage.getItem("stravaActivityStats") || "";

  const _profile =
    "https://sheltered-gorge-36130.herokuapp.com/" + window.localStorage.getItem("stravaAthleteProfile") || "";
  const _savedMessage = JSON.parse(window.localStorage.getItem("savedMessage")) || "";
  const _stampCity = window.localStorage.getItem("stampCity") || "";
  
  if(canvasFrabic == undefined){
    canvasFrabic = await new fabric.Canvas("canvas_frabic", {
      // isDrawingMode: true
    });
    window.canvasFrabic =canvasFrabic;
  } else {
    canvasFrabic.clear();
  }
  canvasFrabic.freeDrawingBrush.width = 6;
  canvasFrabic.freeDrawingBrush.color = JSON.parse(window.localStorage.getItem("color"));

  //gradients
  let rectTop = new fabric.Rect({
    selectable: false,
    evented: false,
    left: cPadding,
    top: cPadding,
    width: cWidth - (cPadding*2),
    height: 60,
    fill: "transparent",
    opacity: 1,
  });
  let rectBotttom = new fabric.Rect({
    selectable: false,
    evented: false,
    left: cPadding,
    top: cHeight - cPadding - 120,
    width: cWidth - (cPadding*2),
    height: 120,
    fill: "transparent",
    opacity: 1,
  });
  let gradTop = new fabric.Gradient({
    type: "linear",
    gradientUnits: "pixels", // or 'percentage'
    coords: { x1: 0, y1: 0, x2: 0, y2: 50 },
    colorStops: [
      { offset: 0, color: "#0000004d" },
      { offset: 1, color: "transparent" },
    ],
  });
  let gradBottom = new fabric.Gradient({
    type: "linear",
    gradientUnits: "pixels", // or 'percentage'
    coords: { x1: 0, y1: 0, x2: 0, y2: 80 },
    colorStops: [
      { offset: 0, color: "transparent" },
      { offset: 1, color: "#0000004d" },
    ],
  });
  rectTop.set("fill", gradTop);
  await canvasFrabic.add(rectTop);
  rectBotttom.set("fill", gradBottom);
  await canvasFrabic.add(rectBotttom);

  //stamp
  const _st = new Image();
  // _st.src = "https://img.pngio.com/postage-stamp-clipart-text-circle-font-transparent-clip-art-circle-stamp-png-900_960.jpg";
  _st.src = "../stamp-sample.png";
  _st.crossOrigin = "anonymous";
  _st.onload = async () => {
    const _stImg = new fabric.Image(_st, {
      selectable: false,
      evented: false,
      left: cWidth - cPadding - 448,
      top: cPadding + 22,
    });
    await _stImg.scaleToWidth(120, true);

    const _cityTxt = _stampCity.replace("#", "\n") || "";
    const _sttxt = new fabric.Text(_cityTxt + "\n" + getDate(), {
      selectable: false,
      evented: false,
      left: cWidth - cPadding - 450,
      top: cPadding +65,
      fontSize: 17,
      fontFamily: "Special Elite, cursive",
      textAlign: "center",
      fill: "#000",
    });

    _stGroup = new fabric.Group([_stImg, _sttxt], {
      selectable: false,
      evented: false,
      left: cWidth - cPadding - 448,
      top: cPadding + 22,
      centeredRotation: true,
    });
    canvasFrabic.add(_stGroup);
    window._stGroup = _stGroup;

    await stampAngle();
  };

  //bm
  if (_bm != "") {
    let btxt = await new fabric.Text(_bm, {
      selectable: false,
      evented: false,
      left: cWidth - cPadding - 170,
      top: cPadding + 10,
      fontFamily: "Overpass Mono, sans-serif",
      fontSize: 18,
      // fontWeight: "bold",
      // fill: "#cb0505",
      fill: "#fff",
      shadow: "rgba(0,0,0,0.3) 3px 3px 3px",
    });
    await canvasFrabic.add(btxt);
  }

  //profile
  if (_profile != "") {
    const _p = new Image();
    _p.src = _profile;
    _p.crossOrigin = "anonymous";
    _p.onload = async () => {
      const _img = new fabric.Image(_p, {
        selectable: false,
        evented: false,
        left: cWidth - cPadding - 75,
        top: cPadding,
        scaleX: 0.6,
        scaleY: 0.6,
        clipPath: new fabric.Circle({
          radius: 50,
          originX: "center",
          originY: "center",
        }),
      });
      canvasFrabic.add(_img);
    };
    const circlePatrol = new fabric.Circle({
      selectable: false,
      evented: false,
      left: cWidth - cPadding - 38,
      top: cPadding + 37,
      radius: 31,
      originX: "center",
      originY: "center",
      // strokeDashArray: [10, 10],
      stroke: "#fff",
      strokeWidth: 2,
      fill: "rgba(0,0,0,0)",
    });
    canvasFrabic.add(circlePatrol);
    // window.circlePatrol = circlePatrol;

    // new fabric.Image.fromURL(_profile, function(_img) {
    //   // scale image down, and flip it, before adding it onto canvas
    //   _img.scale(0.45);
    //   canvasFrabic.add(_img);
    // },{
    //   selectable:false,
    //   evented:false,
    //   left: cWidth-85,
    //   top: 30,
    // });
  }

  //stats
  if (_stats != "") {
    const _statsStr = _stats.replaceAll("#","\n");
    let _si = 0;
    let sx = cPadding + 10,
      sy = cHeight - cPadding - 100;

    let  stxt = await new fabric.Text(_statsStr, {
      selectable: false,
      evented: false,
      left: sx,
      top: sy,
      fontFamily: "Overpass Mono, sans-serif",
      fontSize: 26,
      // "fontWeight": "bold",
      // fill: "#cb0505",
      fill: "#fff",
      shadow: "rgba(0,0,0,0.3) 3px 3px 3px",
      // stroke: '#fff',
      // strokeWidth: 1
    });
    await canvasFrabic.add(stxt);
    // sy += 30;
  }

  //fan text message
  _txtbox = await new fabric.Textbox("-- fan message --", {
    left: cPadding + 30,
    top: cPadding + 30,
    width: 250,
    // fontFamily: "Special Elite, cursive",
    fontFamily: "Overpass Mono, sans-serif",
    fontSize: 25,
  });
  if (_savedMessage != "") {
    _txtbox = await new fabric.Textbox(_savedMessage.text, _savedMessage);
  }
  _txtbox.set("fill", JSON.parse(window.localStorage.getItem("color")));
  await canvasFrabic.add(_txtbox);
  // await canvasFrabic.setActiveObject(_txtbox);

  //saved back image
  if (_savedDrawingBack != "") {
    const _el = new Image();
    _el.src = _savedDrawingBack;
    _el.style.width = cWidth + "px";
    _el.style.height = cHeight + "px";
    _el.onload = async () => {
      await canvasFrabic.setBackgroundImage("", canvasFrabic.renderAll.bind(canvasFrabic));
      await canvasFrabic.setBackgroundImage(_el.src, canvasFrabic.renderAll.bind(canvasFrabic), {
        scaleX: canvasFrabic.width / _el.width,
        scaleY: canvasFrabic.height / _el.height,
      });
    };
  }

  //saved drawing
  let i, _item, _path;
  if (_savedDrawing.length > 0) {
    setTimeout(() => {
      for (i in _savedDrawing) {
        _item = _savedDrawing[i];
        _item.selectable = false;
        _path = new fabric.Path(_item.path.join(","), _item);
        canvasFrabic.add(_path);
      }
    }, 2000);
  }
};

const undo = () => {
  let _last = canvasFrabic.getObjects().length - 1;
  let _item = canvasFrabic.item(_last);

  if (_item.get("type") === "path") {
    canvasFrabic.remove(_item);
    canvasFrabic.renderAll();
  }
};

const saveData = () => {
  let _paths = canvasFrabic.getObjects();
  let i, _item;
  let _savedDrawing = [];

  for (i in _paths) {
    _item = _paths[i];
    if (_item.get("type") === "path") {
      _savedDrawing.push(_paths[i]);
    }
  }
  if (_savedDrawing.length > 0) {
    window.localStorage.setItem("savedDrawing", JSON.stringify(_savedDrawing));
  }
  window.localStorage.setItem("savedMessage", JSON.stringify(_txtbox));
};

const play = () => {
  // let _savePaths = JSON.parse(window.localStorage.getItem('savePaths'));
  // let i,_item,_path;
  // if(_savePaths.length > 0){
  //   for(i in _savePaths){
  //     _item = _savePaths[i];
  //     _path = new fabric.Path(_item.path.join(','), _item);
  //     canvasFrabic.add(_path);
  //   }
  // }
};

const start = () => {
  canvasFrabic.isDrawingMode = true;
};

const pause = () => {
  canvasFrabic.isDrawingMode = false;
};

const clear = () => {
  canvasFrabic.clear();
};

const getDate = () => {
  let _d = new Date().toDateString().split(" ");
  return _d[2] + _d[1] + _d[3].substring(2, 4);
};

const randomMaxMin = (max, min) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const stampAngle = async () => {
  await _stGroup.set("angle", randomMaxMin(70, 20));
  await _stGroup.set("left", randomMaxMin(200, 132));
  await _stGroup.set("top", randomMaxMin(100, 42));
  await _stGroup.set("opacity", 0.6);
  canvasFrabic.renderAll();
  // await canvasFrabic.setActiveObject(_stGroup);
  console.log("left,top,angle:", _stGroup.left, _stGroup.top, _stGroup.angle);
};

//-- end - fabric --

//-- start - image --
const initImage = async () => {
  const preview_container = await document.getElementById("preview_container");
  const preview_image = await document.getElementById("preview_image");

  const _dataURL = window.localStorage.getItem("savedImage") || "";

  if(!preview_image){
    const _el = new Image();
    _el.id = "preview_image";
    _el.src = _dataURL;
    _el.style.width = cWidth + "px";
    _el.style.height = cHeight + "px";
    // await document.body.appendChild(_el);

    //preview image
    await preview_container.appendChild(_el);
  } else {
    preview_image.src = _dataURL;
  }
  
};
//-- end - image --

//-- start - openstreet maps --
let osmap;
let stravaActJson = {};

const initData = () => {
  stravaActJson = JSON.parse(window.localStorage.getItem("stravaActivityJson")) || "";
};

const initScript = () => {
  if (!document.getElementById("google_map_js")) {
    const _el = document.createElement("script");
    _el.setAttribute("id", "google_map_js");
    _el.src = `https://unpkg.com/leaflet@1.7.1/dist/leaflet.js`;
    document.head.appendChild(_el);

    const _el2 = document.createElement("script");
    _el2.setAttribute("id", "google_map_js");
    _el2.src = `https://rawgit.com/jieter/Leaflet.encoded/master/Polyline.encoded.js`;
    document.head.appendChild(_el2);
  }
};
// initScript();

const initDiv = () => {
  if (!document.getElementById("map_canvas")) {
    const _el = document.createElement("div");
    _el.setAttribute("id", "map_canvas");
    _el.style.width = "450px";
    _el.style.height = "450px";
    _el.style.display = "block";
    document.body.appendChild(_el);
  }
};

const showDiv = _f => {
  if (document.getElementById("map_canvas")) {
    const _m = document.getElementById("map_canvas");
    _m.style.display = _f ? "block" : "none";
  }
};

const initMaps = async () => {
  await initDiv();
  await initData();

  if (stravaActJson == "") return;

  // if(window.L.DomUtil.get('map_canvas2'))
  if (osmap) osmap.remove();

  osmap = new window.L.map("map_canvas", {
    renderer: window.L.canvas(),
  });

  let tile = new window.L.tileLayer("http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: 'Map data ©️ <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(osmap);

  let _seg;
  let bounds = [],
    boundslatlng = [];

  let {
    map: { summary_polyline },
    segment_efforts,
  } = stravaActJson;

  if (segment_efforts.length > 0) {
    for (_seg in segment_efforts) {
      let {
        segment: { start_latlng, end_latlng },
      } = segment_efforts[_seg];

      let loc1 = new window.L.latLng(start_latlng[0], start_latlng[1]);
      bounds.push(loc1);

      let loc2 = new window.L.latLng(end_latlng[0], end_latlng[1]);
      bounds.push(loc2);

      boundslatlng.push(new window.L.latLngBounds(loc1, loc2));
    }
    // osmap.fitBounds(bounds,{padding:[35, 35]});
    osmap.fitBounds(boundslatlng, { padding: [20, 20] });

    // let encodedRoutes = [
    //     summary_polyline
    // ]

    // for (let encoded of encodedRoutes) {
    let coordinates = new window.L.Polyline.fromEncoded(summary_polyline).getLatLngs();
    let poly = new window.L.polyline(coordinates, {
      // color: "#f44336",
      // color: "#ff0202",
      color: "#dc0404",
      weight: 5,
      opacity: 0.82,
      lineJoin: "round",
    }).addTo(osmap);
    // }
  }
};
//-- end - openstreet maps --

export default function StravaActivityMap({ address, tx, readContracts, writeContracts, provider, gas, ethPrice }) {
  // const [code, setCode] = useState();

  const [accessToken, setAccessToken] = useSimpleLocalStorage("accessToken");
  const [refreshToken, setRefreshToken] = useSimpleLocalStorage("refreshToken");

  const [stravaAthleteJson, setStravaAthleteJson] = useSimpleLocalStorage("stravaAthleteJson");
  const [stravaAthleteProfile, setStravaAthleteProfile] = useSimpleLocalStorage("stravaAthleteProfile");
  const [stravaActivityCities, setStravaActivityCities] = useSimpleLocalStorage("stravaActivityCities");

  const [stampCity, setStampCity] = useSimpleLocalStorage("stampCity");

  const [stravaRunActivitiesJson, setStravaRunActivitiesJson] = useState();
  const [stravaRideActivitiesJson, setStravaRideActivitiesJson] = useState();

  const [imgSrc, setImgSrc] = useState();
  const [bm, setBm] = useState();
  const [stats, setStats] = useState();
  const [profile, setProfile] = useState();

  const [color, setColor] = useLocalStorage("color", "#666666");

  const [ipfsMintGas, setIpfsMintGas] = useState(0);
  const [ipfsMintGasEth, setIpfsMintGasEth] = useState(0);
  const [ipfsMintGasUsd, setIpfsMintGasUsd] = useState(0);
  const [svgMintGas, setSvgMintGas] = useState(0);
  const [svgMintGasEth, setSvgMintGasEth] = useState(0);
  const [svgMintGasUsd, setSvgMintGasUsd] = useState(0);

  const AuthorizeUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${callback}&response_type=code&scope=activity:read`;
  const AccessTokenUrl = `https://www.strava.com/oauth/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=authorization_code&code=${code}`;
  const RefreshTokenUrl = `https://www.strava.com/oauth/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token&refresh_token=${refreshToken}`;
  const AllActivitiesUrl = `https://www.strava.com/api/v3/activities?per_page=10`;
  const ActivityUrl = _act => `https://www.strava.com/api/v3/activities/${_act}?include_all_efforts=true`;

  useEffect(() => {
    checkAccessToken();
    // initCanvasFrabic();
    initImage();

    setTimeout(initCanvasFrabic, 1000);
    setTimeout(initMaps, 1000);
  }, []);

  useEffect(() => {
  
    // setImgSrc("https://upload.wikimedia.org/wikipedia/commons/a/a1/Nepalese_Mhapuja_Mandala.jpg");
    // setProfile("https://img.icons8.com/color/2x/sports-mode.png" || "");

  }, [imgSrc, bm, stats, profile]);

  const checkAccessToken = async () => {
    if (accessToken == null || refreshToken == null || code != "") {
      await axios
        .post(AccessTokenUrl)
        .then(response => {
          setAccessToken(response.data.access_token);
          setRefreshToken(response.data.refresh_token);

          setStravaAthleteJson(JSON.stringify(response.data.athlete));
          setStravaAthleteProfile(response.data.athlete.profile);

          // window.localStorage.setItem("accessToken", response.data.access_token);
          // window.localStorage.setItem("refreshToken", response.data.refresh_token);

          // window.localStorage.setItem("stravaAthlete", JSON.stringify(response.data.athlete));
          // window.localStorage.setItem("stravaAthleteProfile", response.data.athlete.profile);

          window.location.href = window.location.href.split("?")[0];
        })
        .catch(error => {
          console.log(error.response);

          setAccessToken(null);
          setRefreshToken(null);

          // window.localStorage.setItem("accessToken", "");
          // window.localStorage.setItem("refreshToken", "");
        });
    } else {
      await axios
        .post(RefreshTokenUrl)
        .then(response => {
          setAccessToken(response.data.access_token);
          setRefreshToken(response.data.refresh_token);

          // window.localStorage.setItem("accessToken", response.data.access_token);
          // window.localStorage.setItem("refreshToken", response.data.refresh_token);

          getAllActivities();
        })
        .catch(error => {
          console.log(error.response);

          setAccessToken(null);
          setRefreshToken(null);

          // window.localStorage.setItem("accessToken", "");
          // window.localStorage.setItem("refreshToken", "");
        });
    }
  };

  const getAllActivities = async () => {
    if (accessToken != null || refreshToken != null) {
      await axios
        .get(AllActivitiesUrl, { headers: { Authorization: `Bearer ${window.localStorage.getItem("accessToken")}` } })
        .then(async response => {
          const _runActJson = [];
          const _rideActJson = [];
          let i;
          for (i in response.data) {
            if (response.data[i].type.toLowerCase() == "run") {
              _runActJson.push(response.data[i]);
            } else if (response.data[i].type.toLowerCase() == "ride") {
              _rideActJson.push(response.data[i]);
            }
          }
          setStravaRunActivitiesJson(_runActJson);
          setStravaRideActivitiesJson(_rideActJson);
        })
        .catch(error => {
          console.log(error.response);

          // setAccessToken(null);
          // setRefreshToken(null);
        });
    }
  };

  const getActivity = async _act => {
    if (accessToken != null || refreshToken != null) {
      await axios
        .get(ActivityUrl(_act), { headers: { Authorization: `Bearer ${window.localStorage.getItem("accessToken")}` } })
        .then(async response => {
          stravaActJson = response.data;
          window.localStorage.setItem("stravaActivityJson", JSON.stringify(stravaActJson));
          await setActivityStats();

          await initMaps();
        })
        .catch(error => {
          console.log(error.response);

          // setAccessToken(null);
          // setRefreshToken(null);
        });
    }
  };

  const setActivityStats = async () => {
    let { name, distance, moving_time, start_date_local, segment_efforts } = JSON.parse(
      window.localStorage.getItem("stravaActivityJson"),
    );
    distance = parseFloat(distance / 1000).toFixed(2) + " km : " + parseFloat(moving_time / 60).toFixed(2) + " mins";
    start_date_local = start_date_local.replace("T", " ");
    start_date_local = start_date_local.replace("Z", "");
    let start_date = new Date(start_date_local);
    start_date = start_date.toDateString() + ' ' +start_date.toLocaleTimeString();

    window.localStorage.setItem("stravaActivityStats", name + "#" + distance + "#" + start_date);

    let _seg,
      _savedCityCountrys = [],
      _uniqCityCountrys;
    if (segment_efforts.length > 0) {
      for (_seg in segment_efforts) {
        let {
          segment: { city, country },
        } = segment_efforts[_seg];
        city && country && _savedCityCountrys.push({ city, country });
      }
      _uniqCityCountrys = _savedCityCountrys.filter(
        (v, i, a) => a.findIndex(t => t.city === v.city && t.country === v.country) === i,
      );
      _savedCityCountrys = _uniqCityCountrys;

      setStravaActivityCities(JSON.stringify(_savedCityCountrys));
    }
  };

  const saveMap = async () => {
    const pageYOffset = window.pageYOffset;
    await window.scrollTo(0, 0);
    // -- openstreet maps
    osmap.removeControl(osmap.zoomControl);

    // -- google maps
    // const map_canvas = await document.getElementById("map_canvas");
    // const map_canvas = await document.getElementsByClassName("gm-style")[0].firstElementChild;

    // const map_canvas = await document.getElementById("map_container");
    const map_canvas = await document.getElementById("map_canvas");
    const canvas_container = await document.getElementById("canvas_container");

    html2canvas(map_canvas, {
      useCORS: true,
      allowTaint: false,
      scale: 2,
      // width:cWidth,
      // height:cHeight,
      ignoreElements: node => {
        return node.nodeName === "IFRAME";
      },
    }).then(async canvas => {
      // console.log(canvas.toDataURL());
      // showDiv(true);

      const _dataURL = await LZ.compress(canvas.toDataURL());
      window.localStorage.setItem("savedDrawingBack", _dataURL);

      await initCanvasFrabic();

      // showDiv(false);

      await window.scrollTo(0, pageYOffset);
      osmap.addControl(osmap.zoomControl);

      // test code
      // const _el = new Image();
      // _el.src = canvas.toDataURL();
      // canvas_container.appendChild(_el);
    });

    // html2canvas(map_canvas,{
    //   useCORS: true,
    //   allowTaint: false,
    //   ignoreElements: (node) => {
    //     return node.nodeName === 'IFRAME';
    //   }
    // }).
    //   then(
    //     function(canvas) {
    //       document.body.appendChild(canvas);
    //     }
    //   );
  };

  const saveImage = async () => {
    const pageYOffset = window.pageYOffset;
    await window.scrollTo(0, 0);
    //fabric textbox
    await _txtbox.set("hasBorders", false);
    await _txtbox.set("hasControls", false);
    await canvasFrabic.renderAll();

    const canvas_container = await document.getElementById("canvas_container");
    const preview_image = await document.getElementById("preview_image");

    html2canvas(canvas_container, {
      useCORS: true,
      allowTaint: true,
      scale: 2,
      ignoreElements: node => {
        return node.nodeName === "IFRAME";
      },
    }).then(async canvas => {
      // console.log(canvas.toDataURL());

      const _dataURL = await canvas.toDataURL();
      window.localStorage.setItem("savedImage", _dataURL);

      preview_image.src = _dataURL;

      await window.scrollTo(0, pageYOffset);
      //fabric textbox
      await _txtbox.set("hasBorders", true);
      await _txtbox.set("hasControls", true);
      await canvasFrabic.renderAll();

      // test code
      // const _el = new Image();
      // _el.src = _dataURL;
      // _el.style.width = (cWidth + 2) + "px";
      // _el.style.height = (cHeight + 2) + "px";
      // await document.body.appendChild(_el);
    });
  };

  const updateColor = async value => {
    console.log(value);
    const _c = `rgba(${value.rgb.r},${value.rgb.g},${value.rgb.b},${value.rgb.a})`;
    await setColor(_c);
    // console.log(_c);

    //fabric brush
    canvasFrabic.freeDrawingBrush.color = _c;
    //fabric textbox
    await _txtbox.set("fill", _c);
    await canvasFrabic.renderAll();
  };

  const uploadIpfs = async () => {
    const _dataImage = window.localStorage.getItem("savedImage");
    const _dataImageBuffer = Buffer.from(_dataImage.split(",")[1], "base64");

    const _ipfsImageResult = await ipfs.add(_dataImageBuffer);

    console.log("_ipfsImageResult", _ipfsImageResult);
    window.localStorage.setItem("ipfsImage", JSON.stringify(_ipfsImageResult));

    let { name, description, distance, moving_time, start_date_local, type } = JSON.parse(
      window.localStorage.getItem("stravaActivityJson"),
    );
    distance = parseFloat(distance / 1000).toFixed(2);
    moving_time = parseFloat(moving_time / 60).toFixed(2);
    start_date_local = start_date_local.replace("T", " ");
    start_date_local = start_date_local.replace("Z", "");
    let start_date = new Date(start_date_local);
    start_date = start_date.toDateString() + ' ' +start_date.toLocaleTimeString()

    let _bm = type ? (type.toLowerCase() == "run" ? "©️run🏃🏽‍♂nft" : "©️ride🚴🏽‍♂nft") : "";

    let displayDetails = "";
    if (distance >= 10) displayDetails += "10km, ";
    if (distance >= 20) displayDetails += "20km, ";
    if (distance >= 21) displayDetails += "HM, ";
    if (distance >= 30) displayDetails += "30km, ";
    if (distance >= 40) displayDetails += "40km, ";
    if (distance >= 42) displayDetails += "FM, ";

    if (displayDetails.length > 2) displayDetails = displayDetails.substring(0, displayDetails.length - 2);

    let tagsDetails = "";
    tagsDetails += "sports nft, ";
    if (tagsDetails.length > 10) tagsDetails = tagsDetails.substring(0, tagsDetails.length - 2);

    const _json = {
      image: "https://ipfs.io/ipfs/" + _ipfsImageResult.path,
      external_url: "",
      name,
      description,
      distance: distance + " km",
      moving_time: moving_time + " mins",
      start_datetime:start_date,
      attributes: [
        {
          trait_type: "activity",
          value: type,
        },
        {
          trait_type: "distance",
          value: displayDetails,
        },
        {
          trait_type: "time",
          value: moving_time + " mins",
        },
        {
          trait_type: "event",
          value: "",
        },
        {
          trait_type: "tags",
          value: tagsDetails,
        },
      ],
    };

    const _jsonBuffer = Buffer.from(JSON.stringify(_json));
    const _ipfsResult = await ipfs.add(_jsonBuffer);

    console.log("_ipfsResult", _ipfsResult);
    window.localStorage.setItem("ipfsJson", JSON.stringify(_ipfsResult));
  };

  const mint = async () => {
    const _ipfsResult = await JSON.parse(window.localStorage.getItem("ipfsJson"));
    // console.log("_ipfsResult", _ipfsResult);
    // console.log("_ipfsResult", tx, writeContracts);

    tx(writeContracts.YourCollectible.mintItem(_ipfsResult.path));
  };

  const mint_est = async () => {
    const _ipfsResult = await JSON.parse(window.localStorage.getItem("ipfsJson"));
    // console.log("_ipfsResult", _ipfsResult);
    // console.log("_ipfsResult", tx, readContracts);

    // tx(readContracts.YourCollectible.mintItem(_ipfsResult.path));
    
    let gl = await provider.signer.estimateGas(readContracts.YourCollectible.mintItem(_ipfsResult.path));
    gl = gl.toString();
    const fg = toGWei(gas);
    const gm = fromWei(fg * gl);
    const u = parseFloat(gm * ethPrice).toFixed(6);

    setIpfsMintGas(gl);
    if (gm > 0) setIpfsMintGasEth(gm);
    if (u > 0) setIpfsMintGasUsd(u);

  };

  const onChangeCity = e => {
    console.log("radio checked", e.target.value);
    setStampCity(e.target.value);
  };

  return (
    <div style={{ margin: "auto", marginTop: 10, padding: 10 }}>
      <div
        style={{
          width: "auto",
          // margin: "auto",
          marginTop: 10,
          padding: 10,
          fontWeight: "bolder",
          borderRadius: 12,
        }}
        class="grad_deeprelief"
      >
        <div> ****** </div>
        <div style={{ textAlign: "left" }}>
          
        </div>
        <Steps size="small" direction="vertical">
          <Step title="Network" description=" please connect to kovan testnet." status={"process"} />
          <Step title="Authorize" description=" please connect to Strava" status={"process"} />
          <Step
            title="List Activities"
            description=" please click on button to list Strava Activities"
            status={"process"}
          />
          <Step title="Draw/Save Signature" description="Draw Signature to make it unique NFT" status={"process"} />
          <Step title="Mint " description="mint the nft on kovan testnet" status={"process"} />
          <Step title="Trade" description="view and trade NFT on opensea" status={"process"} />
          <Step title="TODO - fractional or svg nft" description="" status={"process"} />
          <Step title="TODO - create video or gif/ pixelated/ postcard" description="" status={"process"} />
        </Steps>
      </div>
      <div style={{ margin: "auto", marginTop: 10 }}>
      </div>
      <Space align="center"
        style={{ marginTop: 10, marginBottom: 10 }} 
      >
        <Button
          type={"primary"}
          onClick={() => {
            window.open(AuthorizeUrl);
          }}
        >
          Authorize Strava App
        </Button>
      </Space>

      {/*<h2>code - {window.localStorage.getItem("code")}</h2>*/}
      <h2>accessToken - {window.localStorage.getItem("accessToken")}</h2>
      <h2>refreshToken - {window.localStorage.getItem("refreshToken")}</h2>

      <Space align="center"
        style={{ marginTop: 10, marginBottom: 10 }} 
      >
        <Button
          type={"primary"}
          onClick={() => {
            getAllActivities();
          }}
        >
          Get Strava All Activities
        </Button>
        {/*
      <Button
        type={"primary"}
        onClick={() => {
          getActivity(4450170947); //4981791600 4450170947
        }}
      >
        Get Strava Activity - 4450170947
      </Button>
      */}
      </Space>

      <Card title="Run/Ride Activities" style={{ margin: "auto", marginTop: 10, paddingBottom: 10 }}>
        {/*<Card.Meta title="Run/Ride Activities" />*/}
        <Space 
          // direction="vertical" 
          // align="center" 
          wrap
          style={{ 
            // marginTop: 10, 
            // marginBottom: 10 
          }} 
        >
          {stravaRunActivitiesJson &&
            stravaRunActivitiesJson.length > 0 &&
            stravaRunActivitiesJson.map(_act => {
              return (
                <Button
                  key={"butt_" + _act.id}
                  type={"primary"}
                  onClick={() => {
                    getActivity(_act.id); //4981791600 4450170947
                  }}
                  style={{
                    margin: 5,
                    padding: "15px 5px",
                    // backgroundColor: "#456cda",
                    borderRadius: 4,
                    width: "210px",
                    height: "100%",
                  }}
                >
                  <div style={{ fontSize: 12 }}>Run🏃🏽‍♂: {_act.id} </div>
                  <div style={{ fontSize: 16,lineHeight:"20px" }}>{_act.name}</div>
                </Button>
              );
            })}
          {stravaRideActivitiesJson &&
            stravaRideActivitiesJson.length > 0 &&
            stravaRideActivitiesJson.map(_act => {
              return (
                <Button
                  key={"butt_" + _act.id}
                  type={"primary"}
                  onClick={() => {
                    getActivity(_act.id); //4981791600 4450170947
                  }}
                  style={{
                    margin: 5,
                    padding: "15px 5px",
                    // backgroundColor: "#456cda",
                    borderRadius: 4,
                    width: "210px",
                    height: "100%",
                  }}
                >
                  <div style={{ fontSize: 15 }}>Ride🚴🏽‍♂: {_act.id} </div>
                  <div style={{ fontSize: 16,lineHeight:"20px" }}>{_act.name}</div>
                </Button>
              );
            })}
        </Space>
      </Card>
      <Card title="Preview Map" style={{ margin: "auto", marginTop: 10, paddingBottom: 10 }}>
        <div
          id="map_container"
          style={{
            width: cWidth + 20,
            height: "100%",
            margin: "auto",
            marginTop: 10,
            padding: 10,
            display: "block",
            inset: "0px",
            boxShadow: "rgb(0 0 0 / 12%) 0px 2px 10px, rgb(0 0 0 / 16%) 0px 2px 5px",
            borderRadius: "2px",
            background: "#ffffff",
          }}
        >
          <div
            id="map_canvas"
            style={{
              width: cWidth + 0,
              height: cHeight + 0,
              // boxShadow: "rgb(0 0 0 / 12%) 0px 2px 10px, rgb(0 0 0 / 16%) 0px 2px 5px",
              // borderRadius: "2px",
              border: cPadding + "px solid #f7f6f6",
            }}
          ></div>
        </div>
        <Space align="center" 
          style={{ marginTop: 10, marginBottom: 10 }}
        >
          <Button
            type={"primary"}
            onClick={() => {
              saveMap();
            }}
          >
            Save Map
          </Button>
        </Space>
      </Card>
      <Card title="Preview Canvas" style={{ margin: "auto", marginTop: 10, paddingBottom: 10 }}>
        <div
          style={{
            width: cWidth,
            height: "100%",
            margin: "auto",
            marginTop: 10,
            paddingBottom: 10,
          }}
        >
          <SwatchesPicker width={cWidth} height={300} onChangeComplete={updateColor} />
        </div>
        <div
          id="canvas_container"
          style={{
            width: cWidth + 20,
            height: "100%",
            display: "block",
            margin: "auto",
            marginTop: 10,
            padding: 10,
            // borderRadius: 20,
            // border:"10px solid #b1dcb1",
            inset: "0px",
            boxShadow: "rgb(0 0 0 / 12%) 0px 2px 10px, rgb(0 0 0 / 16%) 0px 2px 5px",
            borderRadius: "2px",
            background: "#ffffff",
          }}
        >
          {/*<CanvasDraw
          ref={_c => (canvasDraw.saveableCanvas = _c)}
          saveData={LZ.decompress(window.localStorage.getItem("savedDrawing"))}
          imgSrc={imgSrc}
          imgSrcPadding={cPadding}
          bm={bm}
          stats={stats}
          profile={profile}
          brushColor={color}
          brushRadius={3}
          canvasWidth={cWidth}
          canvasHeight={cHeight}
          loadTimeOffset={3}

          // hideInterface={true}

          //style={{ boxShadow: "0 10px 6px -6px #777" }}
          //style={{ margin: "auto", marginTop: 10 }}
        />*/}
          <canvas
            id="canvas_frabic"
            width={cWidth + "px"}
            height={cHeight + "px"}
            style={{
              width: cWidth,
              height: cHeight,
            }}
          />
        </div>
        <Space direction="vertical" align="center" wrap
          style={{ marginTop: 10, marginBottom: 10 }} 
        >
          <Radio.Group onChange={onChangeCity} value={stampCity}>
            {stravaActivityCities &&
              JSON.parse(stravaActivityCities).length > 0 &&
              JSON.parse(stravaActivityCities).map(_act => {
                return (
                  <Radio key={"radio_" + _act.city} value={_act.city + "#" + _act.country} style={{ width: "100%" }}>
                    city - {_act.city} : country - {_act.country}
                  </Radio>
                );
              })}
          </Radio.Group>
          <Button
            type={"primary"}
            onClick={() => {
              stampAngle();
              // setInterval(stampAngle,3000);
            }}
          >
            randomize stamp
          </Button>
        </Space>
        <Space direction="vertical" align="center" style={{width:"100%"}}>
          <Space align="center" 
            // style={{ marginTop: 10, marginBottom: 10 }}
          >
            <Button
              type={"primary"}
              onClick={() => {
                saveData();
              }}
            >
              Save Data
            </Button>
            <Button
              type={"primary"}
              onClick={() => {
                saveImage();
              }}
            >
              Save Image
            </Button>
          </Space>
          <Space align="center" 
            // style={{ marginTop: 10, marginBottom: 10 }}
          >
            <Button
              type={"primary"}
              onClick={async () => {
                start();
              }}
            >
              start draw
            </Button>
            <Button
              type={"primary"}
              onClick={async () => {
                pause();
              }}
            >
              pause draw
            </Button>
            <Button
              type={"primary"}
              onClick={async () => {
                play();
              }}
            >
              Play
            </Button>
            <Button 
              type={"primary"} 
              onClick={async () => {
                clear();
              }}
            >
              clear
            </Button>
            <Button
              type={"primary"}
              onClick={async () => {
                undo();
              }}
            >
              undo
            </Button>
          </Space>
          <Space align="center" 
            // style={{ marginTop: 10, marginBottom: 10 }}
          >
            <Button
              type={"primary"}
              onClick={() => {
                uploadIpfs();
              }}
            >
              Upload to ipfs
            </Button>
            <Button
              type={"primary"}
              onClick={() => {
                mint();
              }}
            >
              mint nft
            </Button>
          </Space>
        </Space>
        <h3> gas limit : {ipfsMintGas}</h3>
        <h3> ♦ gas cost (eth) : {ipfsMintGasEth}</h3>
        <h3> 💲 gas cost (usd) : {ipfsMintGasUsd}</h3>
        <Space align="center" 
          // style={{ marginTop: 10, marginBottom: 10 }}
        >
          <Button
              type={"primary"}
              onClick={() => {
                mint_est();
              }}
            >
              mint cost
            </Button>
          </Space>
      </Card>
      <Card title="Preview Image" style={{ margin: "auto", marginTop: 10, paddingBottom: 10 }}>
        <div
          id="preview_container"
          style={{
            width: cWidth + 20,
            height: "100%",
            display: "block",
            margin: "auto",
            marginTop: 10,
            padding: 10,
            // borderRadius: 20,
            // border:"10px solid #b1dcb1",
            inset: "0px",
            boxShadow: "rgb(0 0 0 / 12%) 0px 2px 10px, rgb(0 0 0 / 16%) 0px 2px 5px",
            borderRadius: "2px",
            background: "#ffffff",
          }}
        >
          <img 
            id="preview_image" 
            width={cWidth + "px"}
            height={cHeight + "px"}
          />
        </div>
      </Card>
    </div>
  );
}
