import React, { useState, useEffect } from "react";
import { Button, Space, Row, Col, Card } from "antd";
import axios from "axios";
import html2canvas from "html2canvas";
import CanvasDraw from "react-canvas-draw";
import LZ from "lz-string";
import { useSimpleLocalStorage } from "../hooks";

const ipfsAPI = require("ipfs-http-client");
const ipfs = ipfsAPI({ host: "ipfs.infura.io", port: "5001", protocol: "https" });

// import { stravaAct1Json } from "../stravaAct1Json";
// import { stravaAct2Json } from "../stravaAct2Json";

const { REACT_APP_STRAVA_CLIENTID, REACT_APP_STRAVA_SECRET, REACT_APP_STRAVA_CALLBACK } = process.env;

let stravaActJson = {};

let canvasDraw = CanvasDraw;

const clientId = REACT_APP_STRAVA_CLIENTID;
const clientSecret = REACT_APP_STRAVA_SECRET;
const callback = REACT_APP_STRAVA_CALLBACK;

const searchParams = new URLSearchParams(window.location.href);
let code = "",
  accessToken = "",
  refreshToken = "";
if (searchParams.has("code")) {
  code = searchParams.get("code");
}

if (window.localStorage.getItem("accessToken") != "") {
  accessToken = window.localStorage.getItem("accessToken");
}
if (window.localStorage.getItem("refreshToken") != "") {
  refreshToken = window.localStorage.getItem("refreshToken");
}

const AuthorizeUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${callback}&response_type=code&scope=activity:read`;
const AccessTokenUrl = `https://www.strava.com/oauth/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=authorization_code&code=${code}`;
const RefreshTokenUrl = `https://www.strava.com/oauth/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token&refresh_token=${refreshToken}`;
const AllActivitiesUrl = `https://www.strava.com/api/v3/activities?per_page=10`;
const ActivityUrl = _act => `https://www.strava.com/api/v3/activities/${_act}?include_all_efforts=true`;

//-- start - map --
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

  let map;
  let markersArray = [];
  let image = "img/";
  let bounds = new window.google.maps.LatLngBounds();
  let loc;
  let size;

  let mapOptions = { mapTypeId: window.google.maps.MapTypeId.ROADMAP };

  map = new window.google.maps.Map(document.getElementById("map_canvas"), mapOptions);

  // loc = new window.google.maps.LatLng("3.15171","101.692056");
  // bounds.extend(loc);

  // loc = new window.google.maps.LatLng("3.163949","101.689592");
  // bounds.extend(loc);

  let _seg, segSt, segEnd;
  for (_seg in stravaActJson.segment_efforts) {
    segSt = stravaActJson.segment_efforts[_seg].segment.start_latlng;
    segEnd = stravaActJson.segment_efforts[_seg].segment.end_latlng;

    loc = new window.google.maps.LatLng(segSt[0], segSt[1]);
    bounds.extend(loc);

    loc = new window.google.maps.LatLng(segEnd[0], segEnd[1]);
    bounds.extend(loc);
  }

  // for (_seg in stravaAct2Json.segment_efforts) {

  //   segSt = stravaAct2Json.segment_efforts[_seg].segment.start_latlng;
  //   segEnd = stravaAct2Json.segment_efforts[_seg].segment.end_latlng;

  //   loc = new window.google.maps.LatLng(segSt[0], segSt[1]);
  //   bounds.extend(loc);

  //   loc = new window.google.maps.LatLng(segEnd[0], segEnd[1]);
  //   bounds.extend(loc);
  // }

  map.fitBounds(bounds);
  map.panToBounds(bounds);

  const lineSymbol = {
    // Define the custom symbols. All symbols are defined via SVG path notation
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: 5,
    strokeColor: "#f44336", //🏃🏽‍♂️
  };

  let decodedPath, setRegion;
  let decodedLevels = decodeLevels("BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB");
  decodedPath = window.google.maps.geometry.encoding.decodePath(stravaActJson.map.summary_polyline);
  setRegion = new window.google.maps.Polyline({
    path: decodedPath,
    levels: decodedLevels,
    strokeColor: "#f44336",
    strokeOpacity: 0.83,
    strokeWeight: 5,
    map: map,
    icons: [
      {
        icon: lineSymbol,
        offset: "100%",
      },
    ],
  });
  animateCircle(setRegion);

  // decodedPath = window.google.maps.geometry.encoding.decodePath(stravaAct2Json.map.summary_polyline);
  // setRegion = new window.google.maps.Polyline({
  //   path: decodedPath,
  //   levels: decodedLevels,
  //   strokeColor: "#ff5722",
  //   strokeOpacity: 0.73,
  //   strokeWeight: 5,
  //   map: map,
  // });
};

const animateCircle = line => {
  let count = 0;
  const s = window.setInterval(() => {
    count = (count + 1) % 200;
    const icons = line.get("icons");
    icons[0].offset = count / 2 + "%";
    line.set("icons", icons);
    if (count == 199) clearInterval(s);
  }, 100);
};

const decodeLevels = encodedLevelsString => {
  let decodedLevels = [];

  for (var i = 0; i < encodedLevelsString.length; ++i) {
    let level = encodedLevelsString.charCodeAt(i) - 63;
    decodedLevels.push(level);
  }
  return decodedLevels;
};
//-- end - map --

//-- start - canvas --
// const playActivityData = async () => {
//   const _ctx = canvasDraw.saveableCanvas.ctx.drawing;

//   const _prof = window.localStorage.getItem("stravaAthleteProfile");
//   let _i = new window.Image();
//   _i.src = _prof;
//   _i.onload = async () => {
//     await _ctx.drawImage(_i, 435, 10, 55, 55);
//   };

//   _ctx.font = "16pt Overpass Mono";
//   _ctx.shadowColor = "#fff";
//   _ctx.shadowBlur = 3;
//   // _ctx.strokeStyle = _ctx.fillStyle = '#f44336';
//   // _ctx.strokeStyle = _ctx.fillStyle = '#f24f4f';
//   _ctx.strokeStyle = "#bf0404";
//   _ctx.fillStyle = "#cb0505";

//   // _ctx.fillText("name",10,400);
//   // _ctx.fillText("distance",10,430);

//   _ctx.fillText("run🏃🏽‍♂nft", 320, 30);
//   _ctx.strokeText("run🏃🏽‍♂nft", 320, 30);
//   // _ctx.fill();

//   let dashLen = 220,
//     dashOffset = dashLen,
//     speed = 25,
//     txt = "",
//     x = 10,
//     y = 420,
//     i = 0;

//   txt = window.localStorage.getItem("stravaActivityStats");

//   // _ctx.font = "20px Overpass Mono";
//   // _ctx.lineWidth = 5;
//   // _ctx.lineJoin = "round";
//   // _ctx.globalAlpha = 2/3;
//   // _ctx.strokeStyle =
//   // _ctx.fillStyle = "#1f2f90";

//   window.loop = () => {
//     //_ctx.clearRect(x, 0, 200, 150);
//     _ctx.setLineDash([dashLen - dashOffset, dashOffset - speed]); // create a long dash mask
//     dashOffset -= speed;

//     if (txt[i] == "#") {
//       x = 10;
//       y += 30;
//       i++;
//     } // reduce dash length
//     if (txt[i] == undefined) {
//       return;
//     }
//     _ctx.strokeText(txt[i], x, y); // stroke letter

//     if (dashOffset > 0) window.requestAnimationFrame(window.loop);
//     // animate
//     else {
//       _ctx.fillText(txt[i], x, y); // fill final letter
//       dashOffset = dashLen; // prep next char
//       x += _ctx.measureText(txt[i++]).width + _ctx.lineWidth * Math.random();
//       //_ctx.setTransform(1, 0, 0, 1, 0, 3 * Math.random());        // random y-delta
//       //_ctx.rotate(Math.random() * 0.005);                         // random rotation
//       if (i < txt.length) window.requestAnimationFrame(window.loop);
//     }
//   };
//   window.loop();
// };

const boxShadow = async () => {
  const _ctx = canvasDraw.saveableCanvas.ctx.grid;

  // _ctx.fillStyle = "#fff";
  _ctx.strokeStyle = "#fff";
  _ctx.shadowColor = "#777";
  _ctx.shadowBlur = 6;
  _ctx.shadowOffsetX = 6;
  _ctx.shadowOffsetY = 6;
  _ctx.strokeRect(1, 1, 494, 494);
  _ctx.fill();

  // const _prof = "https://img.icons8.com/color/2x/sports-mode.png";
  // const _prof = "https://dgalywyr863hv.cloudfront.net/pictures/athletes/50862840/13626437/1/medium.jpg";
  // const _prof = await (window.localStorage.getItem("stravaAthleteProfile"));

  // let _i = await new window.Image();
  // _i.src = _prof;
  // _i.crossOrigin = "anonymous";
  // _i.onload = async () => {
  //   await _ctx.drawImage(_i, 435, 10, 55, 55);
  //   await _ctx.drawImage(_i, 435+10, 10+50, 55, 55);
  //   // var i = new Image();
  //   // i.crossOrigin = "anonymous";
  //   // i.src= _ctx.canvas.toDataURL();
  //   // document.body.appendChild(i);
  // };
  // document.body.appendChild(_i);
};
//-- end - canvas --

export default function StravaActivityMap({ address, tx, writeContracts }) {
  // const [code, setCode] = useState();

  const [accessToken, setAccessToken] = useSimpleLocalStorage("accessToken");
  const [refreshToken, setRefreshToken] = useSimpleLocalStorage("refreshToken");

  const [stravaAthleteJson, setStravaAthleteJson] = useSimpleLocalStorage("stravaAthleteJson");
  const [stravaAthleteProfile, setStravaAthleteProfile] = useSimpleLocalStorage("stravaAthleteProfile");

  const [stravaRunActivitiesJson, setStravaRunActivitiesJson] = useState();
  const [stravaRideActivitiesJson, setStravaRideActivitiesJson] = useState();

  const [imgSrc, setImgSrc] = useState();
  const [bm, setBm] = useState();
  const [stats, setStats] = useState();
  const [profile, setProfile] = useState();

  // useEffect(() => {
  //   initMaps();
  // }, []);

  useEffect(() => {
    checkAccessToken();
    // playCanvasImage();
  }, []);

  useEffect(() => {
    let { type } = JSON.parse(window.localStorage.getItem("stravaActivityJson")) || "";

    const _dataURL = LZ.decompress(window.localStorage.getItem("savedDrawingBack"));
    const _bm = type ? (type.toLowerCase == "run" ? "run🏃🏽‍♂nft" : "ride🚴🏽‍♂nft") : "";
    const _stats = window.localStorage.getItem("stravaActivityStats");
    const _profile = window.localStorage.getItem("stravaAthleteProfile");

    setImgSrc(_dataURL || "");
    setBm(_bm || "");
    setStats(_stats || "");
    // setProfile(_profile || "");

    // setImgSrc("https://upload.wikimedia.org/wikipedia/commons/a/a1/Nepalese_Mhapuja_Mandala.jpg");
    //setProfile("https://img.icons8.com/color/2x/sports-mode.png" || "");

    canvasDraw.saveableCanvas.drawImage();

    // let _i = new window.Image();
    // _i.src = _profile;
    // _i.onload = async () => {
    //   await setProfile(_i || "");
    // };
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
          setTimeout(captureHtmltoImage, 1000);
        })
        .catch(error => {
          console.log(error.response);
          // setAccessToken(null);
          // setRefreshToken(null);
        });
    }
  };

  const setActivityStats = async () => {
    let { name, distance, moving_time, start_date_local } = JSON.parse(
      window.localStorage.getItem("stravaActivityJson"),
    );
    distance = parseFloat(distance / 1000).toFixed(2) + " km : " + parseFloat(moving_time / 60).toFixed(2) + " mins";
    start_date_local = start_date_local.replace("T", " ");
    start_date_local = start_date_local.replace("Z", "");

    window.localStorage.setItem("stravaActivityStats", name + "#" + distance + "#" + start_date_local);
  };

  const captureHtmltoImage = async () => {
    await window.scrollTo(0, 0);
    // const map_canvas = await document.getElementById("map_canvas");
    const map_canvas = await document.getElementsByClassName("gm-style")[0].firstElementChild;
    html2canvas(map_canvas, {
      useCORS: true,
      allowTaint: false,
      ignoreElements: node => {
        return node.nodeName === "IFRAME";
      },
    }).then(async canvas => {
      // console.log(canvas.toDataURL());
      showDiv(true);
      const _dataURL = await LZ.compress(canvas.toDataURL());
      window.localStorage.setItem("savedDrawingBack", _dataURL);
      await setImgSrc(_dataURL);

      // await document.getElementById("map_canvas_image").appendChild(canvas);

      // await canvasDraw.saveableCanvas.clear();
      // await canvasDraw.saveableCanvas.drawImage();

      // showDiv(false);

      await canvasDraw.saveableCanvas.clear();
      setTimeout(playCanvasImage, 1000);
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

  const playCanvasImage = async () => {
    const _dataURL = await LZ.decompress(window.localStorage.getItem("savedDrawing"));
    await canvasDraw.saveableCanvas.loadSaveData(_dataURL, false);
  };

  const saveData = async () => {
    const _dataURL = await LZ.compress(canvasDraw.saveableCanvas.getSaveData());
    window.localStorage.setItem("savedDrawing", _dataURL);
  };

  const saveImage = async () => {
    await window.scrollTo(0, 0);
    const map_canvas = await document.getElementById("canvas_container");
    html2canvas(map_canvas, {
      useCORS: true,
      allowTaint: true,
      ignoreElements: node => {
        return node.nodeName === "IFRAME";
      },
    }).then(async canvas => {
      // console.log(canvas.toDataURL());

      const _dataURL = await canvas.toDataURL();
      const _el = new Image();
      _el.src = _dataURL;
      _el.style.width = "502px";
      _el.style.height = "502px";
      await document.body.appendChild(_el);

      window.localStorage.setItem("savedImage", _dataURL);
    });
  };

  const uploadIpfs = async () => {
    const _dataImage = window.localStorage.getItem("savedImage");
    const _dataImageBuffer = Buffer.from(_dataImage.split(",")[1], "base64");

    const _ipfsImageResult = await ipfs.add(_dataImageBuffer);

    console.log("_ipfsImageResult", _ipfsImageResult);
    window.localStorage.setItem("ipfsImage", JSON.stringify(_ipfsImageResult));

    const _dataDraw = window.localStorage.getItem("savedDrawing");
    const _dataBack = window.localStorage.getItem("savedDrawingBack");
    const _stats = window.localStorage.getItem("stravaActivityStats");
    const _profile = window.localStorage.getItem("stravaAthleteProfile");

    let { name, distance, moving_time, start_date_local, type } = JSON.parse(
      window.localStorage.getItem("stravaActivityJson"),
    );
    distance = parseFloat(distance / 1000).toFixed(2);
    moving_time = parseFloat(moving_time / 60).toFixed(2);
    start_date_local = start_date_local.replace("T", " ");
    start_date_local = start_date_local.replace("Z", "");

    let _bm = type ? (type.toLowerCase == "run" ? "run🏃🏽‍♂nft" : "ride🚴🏽‍♂nft") : "";

    let displayDetails = "";
    if (distance >= 10) displayDetails += "10 km, ";
    if (distance >= 20) displayDetails += "20 km, ";
    if (distance >= 21) displayDetails += "HM, ";
    if (distance >= 30) displayDetails += "30km, ";
    if (distance >= 40) displayDetails += "40km, ";
    if (distance >= 42) displayDetails += "FM, ";

    if (displayDetails.length > 2) displayDetails = displayDetails.substring(0, displayDetails.length - 2);

    let tagsDetails = "";
    tagsDetails += "sports nft,";

    const _json = {
      image: "https://ipfs.io/ipfs/" + _ipfsImageResult.path,
      external_url: "",
      savedDrawing: _dataDraw,
      savedDrawingBack: _dataBack,
      bm: _bm,
      stats: _stats,
      profile: _profile,
      name,
      description: "",
      distance: distance + " km",
      moving_time: moving_time + " mins",
      start_date_local,
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
    console.log("_ipfsResult", _ipfsResult);
    console.log("_ipfsResult", tx, writeContracts);

    tx(writeContracts.YourCollectible.mintItem(_ipfsResult.path));
  };

  return (
    <div style={{ margin: "auto", marginTop: 10, paddingBottom: 10 }}>
      <Button
        type={"primary"}
        onClick={() => {
          window.open(AuthorizeUrl);
        }}
      >
        Authorize Strava App
      </Button>
      <h2>code - {window.localStorage.getItem("code")}</h2>
      <h2>accessToken - {window.localStorage.getItem("accessToken")}</h2>
      <h2>refreshToken - {window.localStorage.getItem("refreshToken")}</h2>
      <Space>
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
        <Space wrap>
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
                >
                  Run🏃🏽‍♂ - {_act.id} - {_act.name}
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
                >
                  Ride🚴🏽‍♂️ - {_act.id} - {_act.name}
                </Button>
              );
            })}
        </Space>
      </Card>
      <div
        id="map_canvas_container"
        style={{ width: 500, height: 500, margin: "auto", marginTop: 10, paddingBottom: 10, display: "block" }}
      >
        <div id="map_canvas" style={{ width: 500, height: 500 }}></div>
      </div>

      <div style={{ width: 500, height: "100%", margin: "auto", marginTop: 10, paddingBottom: 10 }}>
        <Space style={{ marginTop: 5 }}>
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
          <Button
            type={"primary"}
            onClick={() => {
              boxShadow();
            }}
          >
            boxShadow
          </Button>
          {/*
          <Button
            type={"primary"}
            onClick={() => {
              setActivityStats();
            }}
          >
            save Stats
          </Button>
          
        <Button type={"primary"}
            onClick={async () => {  
              // await setImgSrc("https://upload.wikimedia.org/wikipedia/commons/a/a1/Nepalese_Mhapuja_Mandala.jpg");
              // canvasDraw.saveableCanvas.drawImage();
              captureHtmltoImage();
            }}
          >
          load back Image
        </Button>
        */}
          <Button
            type={"primary"}
            onClick={async () => {
              playCanvasImage();
            }}
          >
            Play
          </Button>
          <Button
            type={"primary"}
            onClick={async () => {
              canvasDraw.saveableCanvas.clear();
            }}
          >
            clear
          </Button>
          <Button
            type={"primary"}
            onClick={async () => {
              canvasDraw.saveableCanvas.undo();
            }}
          >
            undo
          </Button>
        </Space>
        <Space style={{ marginTop: 5 }}>
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
        <div
          id="canvas_container"
          style={{
            width: 520,
            height: 520,
            display: "block",
            margin: "auto",
            marginTop: 10,
            borderRadius: 20 /*border:"10px solid #b1dcb1"*/,
          }}
        >
          <CanvasDraw
            ref={_c => (canvasDraw.saveableCanvas = _c)}
            saveData={LZ.decompress(window.localStorage.getItem("savedDrawing"))}
            imgSrc={imgSrc}
            bm={bm}
            stats={stats}
            profile={profile}
            hideGrid={false}
            brushRadius={5}
            canvasWidth={500}
            canvasHeight={500}
            loadTimeOffset={3}

            //style={{ boxShadow: "0 10px 6px -6px #777" }}
            //style={{ margin: "auto", marginTop: 10 }}
          />
        </div>
      </div>
    </div>
  );
}
