

function  MarkerClusterer_v3( opts ) {
  that = this;
  this.json_data = false;
  this.json_points = [];
  this.r_trees = [];
  this.raw_cluster_array = [];
  this.cluster_array =  [];
  

  this.options = new Object({
    zoom_range : [12,17],
    group_radious : 10, // in pixels
    map : false
  });
  $.extend(true, this.options, opts);



  this.reload_data = this.load_data = function(json_data) {
    that = this;
    that.json_data = json_data;
    $( that.json_data ).each( function(i,e) {
          that.json_points[i] = e;
    });
  };



  this.create_r_trees = function() {
    that = this;

    mapProjection = mapa.getProjection();

    // init or reset r trees
    for(zoomlevel = this.options.zoom_range[0]; zoomlevel<=this.options.zoom_range[1] ;zoomlevel++) {
      that.r_trees[zoomlevel] = rbush($(that.json_points).length, ['.lat', '.lng', '.lat', '.lng']);
    }

    $(that.json_points).each(function(i,e){
      for(zoomlevel = that.options.zoom_range[0]; zoomlevel<=that.options.zoom_range[1] ;zoomlevel++) {
        var scale = Math.pow(2, zoomlevel);
        pixels_latlng =  mapProjection.fromLatLngToPoint( new google.maps.LatLng(e.latitude, e.longitude) );
        tree_row = { id: e.id, lat: parseInt(pixels_latlng.x*scale) , lng: parseInt(pixels_latlng.y*scale) };
        that.r_trees[zoomlevel].insert( tree_row );
      }
      //console.debug('lat:'+ parseInt(pixels_latlng.x*scale) + 'lng: '+parseInt(pixels_latlng.y*scale) );
    });
    
  };


  this.raw_cluster_points = function() {
    that = this;

    for(zoomlevel = this.options.zoom_range[0]; zoomlevel<=this.options.zoom_range[1] ;zoomlevel++) {

      that.raw_cluster_array[zoomlevel] = [];

      $( that.r_trees[zoomlevel].data.children ).each(function(i,e){

        var result = that.r_trees[zoomlevel].search([ e.lat - that.options.group_radious, e.lng - that.options.group_radious, e.lat + that.options.group_radious, e.lng + that.options.group_radious]);

        group = [];
        $( result ).each( function(i,ee){
            group.push(ee.id);
        });

        that.raw_cluster_array[zoomlevel].push(group);

      });

    }
  };


  this.cluster_points = function( filter ) {
    that = this;
    this.cluster_array = this.raw_cluster_array;
    conta =0;
    for(zoomlevel = this.options.zoom_range[0]; zoomlevel<=this.options.zoom_range[1] ;zoomlevel++) {
      $(this.cluster_array[zoomlevel]).each( function(i,e){
        conta++;
      }
      );
      console.debug(conta);
      //console.debug(this.order_clusters( this.cluster_array[zoomlevel]));

    }
  };


/*

function create_clusters() {

  while(x) {


    for (var i=0; point_clusters.lenght <= i; i++) {

      point_clusters[x] = create_clusters_clean( 
                this.point_clusters[x]
                create_clusters_order(this.point_clusters[x]),
                i
              );

    }
  }


  // xa fora do bucle de zooms
  refresh_markers();

}*/

/*

this.create_clusters_clean = function( all_clusters, clusters_by_size, recursion_num ) {
  var result_array = [];
  var current_cluster = [];

  $( clusters_by_size ).each( function(i,e) {
    
    // fisrt (recursion_num) elements are ready
    if( i<= recursion_num ) {
      result_array[e] = all_clusters[e];
      all_clusters[e].remove();

      // load current node to compare with next others
      if( i == recursion_num ) {
        current_cluster = all_clusters[e];
      }
    }
    else { // now, search for duplicates in the rest of items
      $(current_cluster).each( function(i2,current_cluster_val) {
        if(current_cluster_val == e){ //looking for duplicated 1st dimension keys. 
          all_clusters[e].remove();
        }
        else { //looking for duplicated 2st dimension keys
          $(all_clusters[e]).each( function(i3, iteration_cluster_2st_val){
            if(iteration_cluster_2st_val == current_cluster_val) {
              all_clusters[e][i3].remove();
            }
          });
        }

      });

    }


  });

  result_array.push(all_clusters)

  return result_array;
}
*/


  this.order_clusters = function(point_clusters, n_elements){

    var ord_array = [];
    var largest_index = false;
    var largest_value = 0;


    //console.debug(culsters_n);
/*
    do {
      largest_value = 0;

      $(point_clusters ).each( function(i,e) {
        if( $(point_clusters).lenght > largest_value ) {
          largest_value = $(point_clusters).lenght;
          largest_index = i;
        }
      });

      ord_array.push(largest_index);
      point_clusters[largest_index].remove();

    } while( culsters_n != 0 );
*/

    return ord_array;
  }



  /*
    Establecemos de cero os markers e os clustermarkers se non existen 
    poñendo máximo e minimo zoom permitido nos rangos e sempre invisibles
    posteriormente e despois de cada debuxado de filtro, collemos e imos 
    acotando por encima máis por debaixo;
  */
  this.refresh_markers = function() {

    //
    //  Establecer zooms de novo
    //  Visibilidade null para todos
    //  Reiniciar zoom mínimo a zoom máximo
    //


    for (var zoomlevel = 0; zoomlevel <= maxzoom; zoomlevel++) {

      $(this.point_clusters[zoomlevel]).each(function(i, cluster){
        if( $(cluster).lenght == 1 ) {

          // parámetros por extender
          this.markers[i].zoom_minimo = zoomlevel;
          this.markers[i].visible = true;

        }
      });
    }

  }






}