

function  MarkerClusterer_v3( opts ) {
  that = this;
  this.json_data = false;
  this.json_points = [];
  this.r_trees = [];
  this.raw_cluster_array_keys = [];
  this.raw_cluster_array = [];
  this.cluster_array_keys = [];
  this.cluster_array_tmp_keys = [];
  this.cluster_array = [];

  
  this.markers = [];
  this.cluster_markers = [];
  

  this.options = new Object({
    zoom_range : [12,18],
    group_radious : 5, // in pixels
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
        tree_row = { index: i, lat: parseInt(pixels_latlng.x*scale) , lng: parseInt(pixels_latlng.y*scale) };
        that.r_trees[zoomlevel].insert( tree_row );
      }

    });
    
  };


  this.raw_cluster_points = function() {
    that = this;

    for(zoomlevel = this.options.zoom_range[0]; zoomlevel<=this.options.zoom_range[1] ;zoomlevel++) {

      that.raw_cluster_array[zoomlevel] = [];
      that.raw_cluster_array_keys[zoomlevel] = [];
      $( that.r_trees[zoomlevel].data.children ).each(function(i,e){

        var result = that.r_trees[zoomlevel].search([ e.lat - that.options.group_radious, e.lng - that.options.group_radious, e.lat + that.options.group_radious, e.lng + that.options.group_radious]);

        var group = [];
        $( result ).each( function(i,ee){
            group.push(ee.index);
        });

        that.raw_cluster_array[zoomlevel][i] = new Int32Array(group);
        that.raw_cluster_array_keys[zoomlevel].push(i);

      });

    }
  }


  this.cluster_points = function( filter ) {
    var  biggest_cluster;
    this.cluster_array = this.raw_cluster_array;
    this.cluster_array_keys = this.raw_cluster_array_keys;
    this.cluster_array_tmp_keys = this.raw_cluster_array_keys;

    for(zoomlevel = this.options.zoom_range[0]; zoomlevel<=this.options.zoom_range[1] ;zoomlevel++) {
      while(this.cluster_array_tmp_keys[zoomlevel].length > 0){
        //console.debug(this.cluster_array_tmp_keys[zoomlevel].length);
        biggest_cluster_index = this.biggest_cluster_index(this.cluster_array_tmp_keys[zoomlevel], this.cluster_array[zoomlevel]);
        this.cluster_array_tmp_keys[zoomlevel].splice(biggest_cluster_index, 1);
        this.clean_clusters( zoomlevel , this.cluster_array[zoomlevel][biggest_cluster_index]);
      }
    }
  }


  this.clean_clusters = function(zoom, cluster_to_compare) {
    that = this;

    $(that.cluster_array_tmp_keys[zoom]).each(function(i,e){
      if( $.inArray(e, cluster_to_compare)  !== 1 ) {
        that.cluster_array_keys[zoom].splice(e,1)
        that.cluster_array_tmp_keys[zoom].splice(e,1)
      }


      var group = [];
      $(that.cluster_array[zoomlevel][e]).each(function(i2,e2){ 
        if( $.inArray(e2, cluster_to_compare)  === 1) {
          group.push(e2);
        }
      });

      if(group.length != 0){
        that.cluster_array[zoom][i] = new Int32Array(group);
      }
      else{
        that.cluster_array_keys[zoom].splice(e,1)
        that.cluster_array_tmp_keys[zoom].splice(e,1)
      }

    });

  }

  this.biggest_cluster_index = function(point_cluster_keys, point_cluster_array){
    var biggest_cluster_length=0;
    var biggest_cluster_index=0;

    $(point_cluster_keys).each(function(i,e){
      if(point_cluster_array[e].length > biggest_cluster_length) {
        biggest_cluster_index=i;
        biggest_cluster_length = point_cluster_array[e].length;
      }
    });

    return biggest_cluster_index;
  }



  this.draw_markers = function() {

  }


}
