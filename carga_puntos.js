
var json_data = false;
var mapa = false;



$(document).ready(function() {



  // gmaps init
  load_gmap();

    // load json
  carga_json= new time_calc();
  load_json();


  cluster_manager =  new MarkerClusterer_v3({
     map: mapa,
     json_data: json_data,
    zoom_range : [10,14],
  })



});

function load_json() {
  $.ajax({
    url: 'points.json',
    type: 'get',
    cache: false,
    success: function(data) { 
      json_data = data;
    },
    async:false,
  });
}

function load_gmap() {
  var mapOptions = {
    zoom: 12,
    center: new google.maps.LatLng(
      51.511688,
      -0.185094
    )
  };
  mapa = new google.maps.Map(document.getElementById('mapa'),
      mapOptions);
}







function time_calc() {

  this.getdate= function() {
    return new Date().getTime() ;
  }

  this.check = function() {
    return  this.getdate() - this.started_at;
  }

  this.started_at = false;
  this.started_at =  this.getdate()
}