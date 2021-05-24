//google-maps

// const {
//   REACT_APP_GOOGLE_APIKEY,
// } = process.env;

// let map;
// let stravaActJson = {};

// const initScript = () => {
//   if (!document.getElementById("google_map_js")) {
//     const _el = document.createElement("script");
//     _el.setAttribute("id", "google_map_js");
//     _el.src = `http://maps.googleapis.com/maps/api/js?key=${googleApiKey}&amp;libraries=geometry&amp;sensor=false`;
//     document.head.appendChild(_el);
//   }
// };
// // initScript();

// const initDiv = () => {
//   if (!document.getElementById("map_canvas")) {
//     const _el = document.createElement("div");
//     _el.setAttribute("id", "map_canvas");
//     _el.style.width = "450px";
//     _el.style.height = "450px";
//     _el.style.display = "block";
//     document.body.appendChild(_el);
//   }
// };

// const showDiv = _f => {
//   if (document.getElementById("map_canvas")) {
//     const _m = document.getElementById("map_canvas");
//     _m.style.display = _f ? "block" : "none";
//   }
// };

// const initMaps = async () => {
//   await initDiv();

//   let map;
//   let markersArray = [];
//   let image = "img/";
//   let bounds = new window.google.maps.LatLngBounds();
//   let loc;
//   let size;

//   let mapOptions = { mapTypeId: window.google.maps.MapTypeId.ROADMAP };

//   map = new window.google.maps.Map(document.getElementById("map_canvas"), mapOptions);

//   // loc = new window.google.maps.LatLng("3.15171","101.692056");
//   // bounds.extend(loc);

//   // loc = new window.google.maps.LatLng("3.163949","101.689592");
//   // bounds.extend(loc);

//   let _seg, segSt, segEnd;
//   for (_seg in stravaActJson.segment_efforts) {
//     segSt = stravaActJson.segment_efforts[_seg].segment.start_latlng;
//     segEnd = stravaActJson.segment_efforts[_seg].segment.end_latlng;

//     loc = new window.google.maps.LatLng(segSt[0], segSt[1]);
//     bounds.extend(loc);

//     loc = new window.google.maps.LatLng(segEnd[0], segEnd[1]);
//     bounds.extend(loc);
//   }

//   // for (_seg in stravaAct2Json.segment_efforts) {

//   //   segSt = stravaAct2Json.segment_efforts[_seg].segment.start_latlng;
//   //   segEnd = stravaAct2Json.segment_efforts[_seg].segment.end_latlng;

//   //   loc = new window.google.maps.LatLng(segSt[0], segSt[1]);
//   //   bounds.extend(loc);

//   //   loc = new window.google.maps.LatLng(segEnd[0], segEnd[1]);
//   //   bounds.extend(loc);
//   // }

//   map.fitBounds(bounds);
//   map.panToBounds(bounds);

//   const lineSymbol = {
//     // Define the custom symbols. All symbols are defined via SVG path notation
//     path: window.google.maps.SymbolPath.CIRCLE,
//     scale: 5,
//     strokeColor: "#f44336", //🏃🏽‍♂️
//   };

//   let decodedPath, setRegion;
//   let decodedLevels = decodeLevels("BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB");
//   decodedPath = window.google.maps.geometry.encoding.decodePath(stravaActJson.map.summary_polyline);
//   setRegion = new window.google.maps.Polyline({
//     path: decodedPath,
//     levels: decodedLevels,
//     strokeColor: "#f44336",
//     strokeOpacity: 0.83,
//     strokeWeight: 5,
//     map: map,
//     icons: [
//       {
//         icon: lineSymbol,
//         offset: "100%",
//       },
//     ],
//   });
//   // animateCircle(setRegion);

//   // decodedPath = window.google.maps.geometry.encoding.decodePath(stravaAct2Json.map.summary_polyline);
//   // setRegion = new window.google.maps.Polyline({
//   //   path: decodedPath,
//   //   levels: decodedLevels,
//   //   strokeColor: "#ff5722",
//   //   strokeOpacity: 0.73,
//   //   strokeWeight: 5,
//   //   map: map,
//   // });
// };

// const animateCircle = line => {
//   let count = 0;
//   const s = window.setInterval(() => {
//     count = (count + 1) % 200;
//     const icons = line.get("icons");
//     icons[0].offset = count / 2 + "%";
//     line.set("icons", icons);
//     if (count == 199) clearInterval(s);
//   }, 100);
// };

// const decodeLevels = encodedLevelsString => {
//   let decodedLevels = [];

//   for (var i = 0; i < encodedLevelsString.length; ++i) {
//     let level = encodedLevelsString.charCodeAt(i) - 63;
//     decodedLevels.push(level);
//   }
//   return decodedLevels;
// };
