//Declared a variable for popup to show when map is hovered
var popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false
});

loadMap();

//Call functions after map is loaded
map.on('load', function () {
  addControls();
  loadButwalGeoJson();
  loadInstitutionMarkers();
  removeInstitutionMarkers();
  loadButwalAllWardStatistics();
});

//Load Map function Declaration
function loadMap() {
  mapboxgl.accessToken = 'pk.eyJ1IjoiYmFuc2FqdGVzdCIsImEiOiJja2sxenFnbHMwd2I5MzBuMjhqdGJxd3N6In0.dKEbWvhOsadDSfeYUnievg';
  map = new mapboxgl.Map({
    container: 'map',
    // style: 'mapbox://styles/mapbox/streets-v11', //Change styles
    style: 'mapbox://styles/bansajtest/ckk20h14m1j7417mzf0os2jq4',
    center: [83.3623242, 27.6821973],
    zoom: 11,
  });
}

//add controls inside map
function addControls() {
  map.addControl(new mapboxgl.NavigationControl());
}

//add geojson fetched from the server to map
function loadButwalGeoJson() {
  $.getJSON(apiBaseUrl+"/butwal.php", function(mapJson) {
    for (i=0;i<mapJson.features.length;i++) {
      mapJson.features[i].properties.title_en = Number(mapJson.features[i].properties.title_en);
    }
    var geoColorStops = [
      [0, '#b60a1c'],
      [1, '#e03531'],
      [2, '#ff684c'],
      [3, '#e39802'],
      [4, '#f0bd27'],
      [5, '#ffda66'],
      [6, '#51b364'],
      [7, '#8ace74']
    ];
    console.log(mapJson);
    map.addSource('butwal', {
      'type': 'geojson',
      'data': mapJson
    });
    map.addLayer({
      'id': 'butwal',
      'type': 'fill',
      'source': 'butwal',
      'layout': {},
      'paint': {
        'fill-color': {
          property: 'title_en',
          stops: geoColorStops
        },
        'fill-opacity': 0.8,
      }
    });
    map.addLayer({
      'id': 'butwal-ward-border',
      'type': 'line',
      'source': 'butwal',
      'paint': {
        'line-color': 'red',
        'line-width': 2
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

function loadButwalAllWardStatistics() {
  $.getJSON(apiBaseUrl+"/read_statistic.php?municipality=136", function(json) {
      statisticsJson = json.results; //local variable
      for (let i = 0; i < statisticsJson.length; i++) {
        totalStatisticsJson.population = totalStatisticsJson.male_population+parseInt(statisticsJson[i].population);
        totalStatisticsJson.male_population = totalStatisticsJson.male_population+parseInt(statisticsJson[i].male_population);
        totalStatisticsJson.female_population = totalStatisticsJson.female_population+parseInt(statisticsJson[i].female_population);
        totalStatisticsJson.household = totalStatisticsJson.household+parseInt(statisticsJson[i].household);
      }
      activeStatisticsJson = totalStatisticsJson;
      document.getElementById('household').innerHTML = totalStatisticsJson.household;
      document.getElementById('male_population').innerHTML = totalStatisticsJson.male_population;
      document.getElementById('female_population').innerHTML = totalStatisticsJson.female_population;
    });
    // drawChart();
    map.on('mouseenter', 'butwal', onMouseEnter);
    map.on('mouseleave', 'butwal', onMouseExit);
    map.on('mousemove', 'butwal', onMouseMove);
}


function onMouseExit() {
    
  map.getCanvas().style.cursor = '';
  popup.remove();
  // activeStatisticsJson = totalStatisticsJson;
  // drawChart();
}

function onMouseEnter(e) {
      
}

function onMouseMove(e) {
    console.log(e.lngLat);
  // Updates the cursor to a hand (interactivity)
  map.getCanvas().style.cursor = 'pointer';
  // Show the popup at the coordinates with some data
  popup.setLngLat(e.lngLat)
    .setHTML(checkEmpty(e.features[0].properties.title_en))
    .addTo(map);
    var activeStatistics = [];
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