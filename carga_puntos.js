
var json_data = false;
var mapa = false;



tiempo_total= new time_calc();
$(document).ready(function() {



  // gmaps init
  gmap_load= new time_calc();
  load_gmap();

  google.maps.event.addListenerOnce(mapa, 'idle', function( ){

    $("#gmap_load").text( gmap_load.check() );  



    // load json
    carga_json= new time_calc();
    load_json();
    $("#carga_json").text( carga_json.check() );

    cluster_manager =  new MarkerClusterer_v3({
      map: mapa
    })

    cluster_manager.load_data(json_data);
    

    carga_arbol= new time_calc();
    cluster_manager.create_r_trees();
    $("#carga_arbol").text( carga_arbol.check() );

    procesado_clusters= new time_calc();
    cluster_manager.raw_cluster_points();
    $("#procesado_clusters").text( procesado_clusters.check() );

    aply_filters= new time_calc();
    cluster_manager.cluster_points();

    $("#aplicar_filtros").text(  aply_filters.check());

    carga_sobre_gmaps= new time_calc();
    cluster_manager.draw_markers();
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
      json_data = data;
    },
    async:false,
  });
}

function load_gmap() {
  var mapOptions = {
    zoom: 11,
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