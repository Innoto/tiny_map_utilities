

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
    zoom_range : [9,18],
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
    for(var zoomlevel = this.options.zoom_range[0]; zoomlevel<=this.options.zoom_range[1] ;zoomlevel++) {
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

        that.raw_cluster_array[zoomlevel][i] = group;
        that.raw_cluster_array_keys[zoomlevel].push(i);

      });

    }
  }












  this.cluster_points = function( filter ) {
    var  bc_index;
    that = this;



    for( var zoomlevel = this.options.zoom_range[0]; zoomlevel<=this.options.zoom_range[1] ;zoomlevel++) {

      // clone arrays
      this.cluster_array[zoomlevel] = $.merge( [],this.raw_cluster_array[zoomlevel] );
      this.cluster_array_keys[zoomlevel] = $.merge( [],this.raw_cluster_array_keys[zoomlevel] );
      this.cluster_array_tmp_keys[zoomlevel] = $.merge( [],this.raw_cluster_array_keys[zoomlevel] );


      while(this.cluster_array_tmp_keys[zoomlevel].length > 0){


        this.cluster_array_tmp_keys[zoomlevel].splice(3,1);

        this.cluster_array_tmp_keys[zoomlevel] =[];
        //bc_index = this.biggest_cluster_index(this.cluster_array_tmp_keys[zoomlevel], this.cluster_array[zoomlevel]);

        //this.cluster_array_tmp_keys[zoomlevel].splice($.inArray(bc_index, this.cluster_array_tmp_keys[zoomlevel]));
        
  

        //this.cluster_array_keys[zoomlevel].splice($.inArray(bc_index, this.cluster_array_keys[zoomlevel]));
        
        //this.clean_clusters( zoomlevel , this.cluster_array[zoomlevel][bc_index]);


        console.debug( this.cluster_array_keys[zoomlevel] );

      }


    }
  }


  this.clean_clusters = function(zoom, cluster_to_compare) {
    that = this;

    $(that.cluster_array_tmp_keys[zoom]).each(function(i,e){


        var group = [];

        $(that.cluster_array[zoom][e]).each(function(i2,e2){ 

          if( $.inArray(e2, cluster_to_compare)  === -1) {
            group.push(e2);
          }

        });

        if(group.length != 0){
          that.cluster_array[zoom][i] =  group;
        }


   

    });

  }

  this.biggest_cluster_index = function(point_cluster_tmp_keys, point_cluster_array){
    var biggest_cluster_length=0;
    var b_c_i=0;

    $(point_cluster_tmp_keys).each(function(i,e){
      if(point_cluster_array[e].length > biggest_cluster_length) {
        b_c_i=e;
        biggest_cluster_length = point_cluster_array[e].length;
      }
    });

    return b_c_i;
  }


  this.draw_markers = function() {

    var zoomlevel = this.options.map.getZoom();


  }


}
