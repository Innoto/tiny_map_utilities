var zoom_range= [12,17];
var group_radious = 10; // in pixels
var json_points = new Array();
var r_trees = new Array();
var raw_cluster_array = Array();
var mapa = false;

tiempo_total= new time_calc();

$(document).ready(function() {



  // load json
  carga_json= new time_calc();
  load_json();
  $("#carga_json").text( carga_json.check() );


  // gmaps init
  gmap_load= new time_calc();
  load_gmap();

  google.maps.event.addListenerOnce(mapa, 'idle', function( ){
    $("#gmap_load").text( gmap_load.check() );  

    carga_arbol= new time_calc();
    create_r_trees();
    $("#carga_arbol").text( carga_arbol.check() );

    procesado_clusters= new time_calc();
    raw_cluster_points();
    $("#procesado_clusters").text( procesado_clusters.check() );

    carga_sobre_gmaps= new time_calc();
    $("#carga_sobre_gmaps").text( carga_sobre_gmaps.check() );


    $("#tiempo_total").text( tiempo_total.check() );

  });
  
});

function load_json() {
  $.ajax({
    url: 'points.json',
    type: 'get',
    cache: false,
    success: function(data) { 

      $(data).each( function(i,e) {
        json_points[i] = e;
      });
    },
    async:false,
  });
}

function load_gmap() {
  var mapOptions = {
    zoom: zoom_range[0],
    center: new google.maps.LatLng(
      51.511688,
      -0.185094
    )
  };
  mapa = new google.maps.Map(document.getElementById('mapa'),
      mapOptions);
}



function create_r_trees() {

  mapProjection = mapa.getProjection();

  // init or reset r trees
  for(zoomlevel = zoom_range[0]; zoomlevel<=zoom_range[1] ;zoomlevel++) {
    r_trees[zoomlevel] = rbush($(json_points).length, ['.lat', '.lng', '.lat', '.lng']);
  }

  $(json_points).each(function(i,e){
    for(zoomlevel = zoom_range[0]; zoomlevel<=zoom_range[1] ;zoomlevel++) {
      var scale = Math.pow(2, zoomlevel);
      pixels_latlng =  mapProjection.fromLatLngToPoint( new google.maps.LatLng(e.latitude, e.longitude) );
      tree_row = { id: e.id, lat: parseInt(pixels_latlng.x*scale) , lng: parseInt(pixels_latlng.y*scale) };
      r_trees[zoomlevel].insert( tree_row );
    }
    //console.debug('lat:'+ parseInt(pixels_latlng.x*scale) + 'lng: '+parseInt(pixels_latlng.y*scale) );
  });
  
}


function raw_cluster_points() {

  for(zoomlevel = zoom_range[0]; zoomlevel<=zoom_range[1] ;zoomlevel++) {

    raw_cluster_array[zoomlevel] = [];
    $( r_trees[zoomlevel].data.children ).each(function(i,e){

      var result = r_trees[zoomlevel].search([ e.lat - group_radious, e.lng - group_radious, e.lat + group_radious, e.lng + group_radious]);

      var group= [];
      $( result ).each( function(i,ee){
          group.push(ee.id);
      });
      
      raw_cluster_array[zoomlevel][e.id] = group;

    });
  }
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