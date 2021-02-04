//Declared a variable for popup to show when map is hovered
var popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false
});

loadMap();

//Call functions after map is loaded
map.on('load', function () {
  addControls();
  loadGhoraiAllWardStatistics();
  loadGhoraiGeoJson();
  loadInstitutionMarkers();
  loadWardMapEvents();
});

//Load Map function Declaration
function loadMap() {
  mapboxgl.accessToken = 'pk.eyJ1IjoiYmFuc2FqdGVzdCIsImEiOiJja2sxenFnbHMwd2I5MzBuMjhqdGJxd3N6In0.dKEbWvhOsadDSfeYUnievg';
  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/bansajtest/ckk20h14m1j7417mzf0os2jq4', //Your mapbox style generated from Mapbox studio
    center: [82.4841966, 28.0392923], //coordinate in [longitude, latitude] format
    zoom: 10, //setting default zoom level on our map
  });
}

//add controls inside map
function addControls() {
  map.addControl(new mapboxgl.NavigationControl());
}

//add geojson fetched from the server to map
function loadGhoraiGeoJson() {
  $.getJSON(apiBaseUrl+"/ghorai.php", function(mapJson) {
    //To add features not present in the geojson properties, uncomment the code below
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
    //Adding source in the mapbox canvas. 
    map.addSource('ghorai', {
      'type': 'geojson',
      'data': mapJson
    });
    //To display the source we included, we need to add the source as layer.
    //Fill layer means the enclosing space of the polygon will be filled with the fill-color property
    //For chloropleth map we can use fill-color as an object & define the stops as shown below. The property must be included on the geojson property object
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
    //To display the ward boundaries, we add the same source but as line this time just to show the boundary
    map.addLayer({
      'id': 'ghorai-ward-border',
      'type': 'line',
      'source': 'ghorai',
      'paint': {
        'line-color': 'red',
        'line-width': 2
      }
    });

    //To display the text inside the enclosing polygon(ward in this case) centroid.
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

//Load Institution Markers
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
      //Push marker to global variable, so we can manipulate it in the future.
      activeMarkers.push(marker);
    }
  });
}

//To remove/hide markers, we manipulate the activeMarkers global variable where markers are stored in form of array. 
function removeInstitutionMarkers() {
  for(i=0;i<activeMarkers.length;i++) {
    //activeMarkers[i] points to a marker object. We are just calling it's remove method.
    activeMarkers[i].remove();
  }
}

// Load Statistics
function loadGhoraiAllWardStatistics() {
  //GET request to the url with paramter municipality=193, 193 being the id of the municipality in the database.
  $.getJSON(apiBaseUrl+"/read_statistic.php?municipality=193", function(json) {
    statisticsJson = json.results;
    //Start of Aggregation of all the statistics received from the server.
    for (let i = 0; i < statisticsJson.length; i++) {
      totalStatisticsJson.population = totalStatisticsJson.population+parseInt(statisticsJson[i].population);
      totalStatisticsJson.male_population = totalStatisticsJson.male_population+parseInt(statisticsJson[i].male_population);
      totalStatisticsJson.female_population = totalStatisticsJson.female_population+parseInt(statisticsJson[i].female_population);
      totalStatisticsJson.household = totalStatisticsJson.household+parseInt(statisticsJson[i].household);
    }
    //End of Aggregation

    //Call function to set the statistics in the flexbox div of our html file
    setActiveStatistics(totalStatisticsJson);
  });
}

//load mapevents
function loadWardMapEvents() {
   map.on('mouseenter', 'ghorai', onMouseEnter);
   map.on('mouseleave', 'ghorai', onMouseExit);
   map.on('mousemove', 'ghorai', onMouseMove);
}

function onMouseExit() {
  //set cursor back to drag inside map
  map.getCanvas().style.cursor = '';
  //remove popup
  popup.remove();
  //set the active statstics back to total aggregated value
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
    .setHTML(checkEmpty(e.features[0].properties))
    .addTo(map);
    setActiveStatistics(e.features[0].properties);
}

function checkEmpty(info) {
  activeStatistics = info;
  var popupInfo;
  if(activeStatistics){
    popupInfo = '<h3>'+activeStatistics.mun_title_en+'-'+activeStatistics.title_en+'</h3><p>Population:'+activeStatistics.population+'</p><p>Male:'+activeStatistics.male_population+'</p><p>Female:'+activeStatistics.female_population+'</p><p>Household:'+activeStatistics.household+'</p>';
  } else {  
    popupInfo = info;
  }
  return (popupInfo) ? popupInfo : "No data";
}


//set active statistics in the box and redraw chart
function setActiveStatistics(statistics) {
  console.log('setting active status');
  activeStatisticsJson = statistics;
  document.getElementById('household').innerHTML = statistics.household;
  document.getElementById('male_population').innerHTML = statistics.male_population;
  document.getElementById('female_population').innerHTML = statistics.female_population;
  drawChart();
}