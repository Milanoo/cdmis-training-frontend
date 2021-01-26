//Declared a variable for popup to show when map is hovered
var popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false
});

loadMap();

//Call functions after map is loaded
map.on('load', function () {
  addControls();
  loadGhoraiGeoJson();
  loadInstitutionMarkers();
  removeInstitutionMarkers();
  loadGhoraiAllWardStatistics();
});

//Load Map function Declaration
function loadMap() {
  mapboxgl.accessToken = 'pk.eyJ1IjoiYmFuc2FqdGVzdCIsImEiOiJja2sxenFnbHMwd2I5MzBuMjhqdGJxd3N6In0.dKEbWvhOsadDSfeYUnievg';
  map = new mapboxgl.Map({
    container: 'map',
    // style: 'mapbox://styles/mapbox/streets-v11', //Change styles
    style: 'mapbox://styles/bansajtest/ckk20h14m1j7417mzf0os2jq4',
    center: [82.4841966, 28.0392923],
    zoom: 10,
  });
}

//add controls inside map
function addControls() {
  map.addControl(new mapboxgl.NavigationControl());
}

//add geojson fetched from the server to map
function loadGhoraiGeoJson() {
  $.getJSON(apiBaseUrl+"/ghorai.php", function(mapJson) {
    // for (i=0;i<mapJson.features.length;i++) {
    //   mapJson.features[i].properties.title_en = Number(mapJson.features[i].properties.title_en);
    // }
    var geoColorStops = [
      [0, '#b60a1c'],
      [1000, '#e03531'],
      [2000, '#ff684c'],
      [3000, '#e39802'],
      [4000, '#f0bd27'],
      [5000, '#ffda66'],
      [6000, '#51b364'],
      [7000, '#8ace74']
    ];
    map.addSource('ghorai', {
      'type': 'geojson',
      'data': mapJson
    });
    map.addLayer({
      'id': 'ghorai',
      'type': 'fill',
      'source': 'ghorai',
      'layout': {},
      'paint': {
        'fill-color': {
          property: 'population',
          stops: geoColorStops
        },
        'fill-opacity': 0.8,
      }
    });
    map.addLayer({
      'id': 'ghorai-ward-border',
      'type': 'line',
      'source': 'ghorai',
      'paint': {
        'line-color': 'red',
        'line-width': 2
      }
    });
    map.addLayer({
      'id': 'ward-title',
      'type': 'symbol',
      'source': 'ghorai',
      'layout': {
        'text-field': '{title_en}',
        'text-size': 12
      }
    });
  });
}

function loadInstitutionMarkers() {
  $.getJSON(apiBaseUrl+"/read_institution.php?municipality=136", function(json) {
    institutionJson = json.results;
    for(i=0;i<institutionJson.length;i++) {
      var popup = new mapboxgl.Popup({ offset: 25 }).setText(institutionJson[i].title);
      var markerCordinate = [parseFloat(institutionJson[i].long), parseFloat(institutionJson[i].lat)];
      // create DOM element for the marker
      var el = document.createElement('div');
      el.className = 'marker_'+institutionJson[i].type;
      
      // create the marker
      var marker = new mapboxgl.Marker(el)
      .setLngLat(markerCordinate)
      .setPopup(popup).addTo(map); // sets a popup on this marker
      activeMarkers.push(marker);
    }
  });
}

function removeInstitutionMarkers() {
  for(i=0;i<activeMarkers.length;i++) {
    activeMarkers[i].remove();
  }
}

function loadGhoraiAllWardStatistics() {
  $.getJSON(apiBaseUrl+"/read_statistic.php?municipality=193", function(json) {
    statisticsJson = json.results; //local variable
    for (let i = 0; i < statisticsJson.length; i++) {
      totalStatisticsJson.population = totalStatisticsJson.male_population+parseInt(statisticsJson[i].population);
      totalStatisticsJson.male_population = totalStatisticsJson.male_population+parseInt(statisticsJson[i].male_population);
      totalStatisticsJson.female_population = totalStatisticsJson.female_population+parseInt(statisticsJson[i].female_population);
      totalStatisticsJson.household = totalStatisticsJson.household+parseInt(statisticsJson[i].household);
    }
    setActiveStatistics(totalStatisticsJson);
  });
  map.on('mouseenter', 'ghorai', onMouseEnter);
  map.on('mouseleave', 'ghorai', onMouseExit);
  map.on('mousemove', 'ghorai', onMouseMove);
}


function onMouseExit() {
    
  map.getCanvas().style.cursor = '';
  popup.remove();
  setActiveStatistics(totalStatisticsJson);
}

function onMouseEnter(e) {
      
}

function onMouseMove(e) {
    // console.log(e.lngLat);
  // Updates the cursor to a hand (interactivity)
  map.getCanvas().style.cursor = 'pointer';
  console.log(e.features);
  // Show the popup at the coordinates with some data
  popup.setLngLat(e.lngLat)
    .setHTML(checkEmpty(e.features[0].properties.title_en))
    .addTo(map);
    setActiveStatistics(e.features[0].properties);
}

function checkEmpty(info) {
  let activeStatistics = [];
  for (let i = 0; i < statisticsJson.length; i++) {
      if (statisticsJson[i].ward_title.toString() == info) {
        activeStatistics.push(statisticsJson[i]);
      }
  }
  activeStatistics = activeStatistics[0]; //choose one if multiple entry
  
  var popupInfo;
  if(activeStatistics){
    popupInfo = '<h3>'+info+'</h3><p>Population:'+activeStatistics.population+'</p><p>Male:'+activeStatistics.male_population+'</p><p>Female:'+activeStatistics.female_population+'</p><p>Household:'+activeStatistics.household+'</p>';
  } else {
    popupInfo = info;
  }
  return (popupInfo) ? popupInfo : "No data";
}


function setActiveStatistics(statistics) {
  activeStatisticsJson = statistics;
  document.getElementById('household').innerHTML = statistics.household;
  document.getElementById('male_population').innerHTML = statistics.male_population;
  document.getElementById('female_population').innerHTML = statistics.female_population;
  drawChart();
  //loadStatistics
}