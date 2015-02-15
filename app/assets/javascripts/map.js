//= require polyline

      var directionsDisplay;
      var directionsService = new google.maps.DirectionsService();
      var map;

      function initialize() {
        directionsDisplay = new google.maps.DirectionsRenderer();

        var mapOptions = {
          // optional zoom and center
        };

        map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
        directionsDisplay.setMap(map);

        calcRoute();
      }

      function calcRoute() {

        var start = new google.maps.LatLng(41.953819, -87.654750); // Chicago
        var end = new google.maps.LatLng(38.637548, -90.205010); // St. Louis
        var waypts = [];
        var checkboxArray = document.getElementById('waypoints');

        for (var i = 0; i < checkboxArray.length; i++) {
          if (checkboxArray.options[i].selected == true) {
            waypts.push({
              location:checkboxArray[i].value,
              stopover:true});
          }
        }

        var request = {
          origin: start,
          destination: end,
          waypoints: waypts,
          optimizeWaypoints: true,
          travelMode: google.maps.TravelMode.DRIVING
        };

        directionsService.route(request, function(response, status){

          if (status == google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);

            var polyline = decodePolyline(response);
            var polygonGeoJsonObject = createPolygonFromPolyline(polyline);

// comment this line out to prevent drawing of polygon
            var polygonCoords = processPolygonCoordsIntoLatLong(polygonGeoJsonObject)
          }
        });
      }

//------------------------------------------------------------

  // Define the LatLng coordinates for the polygon's path.
  function processPolygonCoordsIntoLatLong(polygonGeoJsonObject) {
    var polygonCoords = createLatLongObjects(polygonGeoJsonObject);
    drawPolygon(polygonCoords)
    return polygonCoords

  }

  function createLatLongObjects(geoJsonObject){
    var latLongArray = []
    var coordArray = geoJsonObject.features[0].geometry.coordinates[0]

    console.log(coordArray)

    coordArray.forEach(function(coord){
      console.log(coord)
      latLongArray.push(new google.maps.LatLng(coord[1], coord[0]))
      return latLongArray
    })
    return latLongArray
  }

  // // Construct the polygon.
  function drawPolygon(coordsToDraw){
    bufferedPolygon = new google.maps.Polygon({
      paths: coordsToDraw,
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF0000',
      fillOpacity: 0.35
    });
    bufferedPolygon.setMap(map);
  }

//-------------------------------------------------------------

      function decodePolyline(response) {
        var coord_array = polyline.decode(response.routes[0].overview_polyline);
        return coord_array.map(function(coordinate) {
          return [coordinate[1], coordinate[0]];
        })
      }

      function createPolygonFromPolyline(polyline) {
        var line = {
            type:"Feature",
            geometry:{
              type:"LineString",
              coordinates: polyline,
           },
           properties:{}
         }

        var polygon = turf.buffer(line, 25, 'miles')

        $.ajax({
          url: '/maps/search',
          type: 'post',
          beforeSend: function(xhr) { xhr.setRequestHeader('X-CSRF-Token', $('meta[name=csrf-token]').attr('content'))},
          contentType: "application/json",
          dataType: "json",
          data: JSON.stringify(polygon),
        })
        .success(function(response){
          console.log(response.attractions)
          loadMarkers(response.attractions)
        })

        return polygon
      }

google.maps.event.addDomListener(window, 'load', initialize);

function loadMarkers(markerObjects){

    $.each(markerObjects, function(i,item){
      loadMarker(item);
    });
  }

function loadMarker(markerObject){

  var latitude = markerObject.longlat.coordinates[1];
  var longitude = markerObject.longlat.coordinates[0];
  var coords = new google.maps.LatLng(latitude, longitude)

  var marker = new google.maps.Marker({
    position: coords,
    map: map
  });
}