

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
    zoom_range : [10,15],
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
    var  bc;
    that = this;


    for( var zoomlevel = this.options.zoom_range[0]; zoomlevel<=this.options.zoom_range[1] ;zoomlevel++) {

      // clone arrays
      this.cluster_array[zoomlevel] = $.merge( [],this.raw_cluster_array[zoomlevel] );
      this.cluster_array_tmp_keys[zoomlevel] = $.merge( [],this.raw_cluster_array_keys[zoomlevel] );
      this.cluster_array_keys[zoomlevel] = [];

      while(this.cluster_array_tmp_keys[zoomlevel].length > 0){

        bc = this.biggest_cluster_index(this.cluster_array_tmp_keys[zoomlevel], this.cluster_array[zoomlevel]);

        this.cluster_array_tmp_keys[zoomlevel].splice(bc.key_index , 1); // remove from key array
        this.cluster_array_keys[zoomlevel].push(bc.index);
        
        this.clean_clusters( zoomlevel , this.cluster_array[zoomlevel][bc.index] );

      }


    }
    //console.debug(comparacion);
  }


comparacion = 0;

  this.clean_clusters = function(zoom, cluster_to_compare) {
    that = this;
    var e;

    for(var i=0 ; that.cluster_array_tmp_keys[zoom].length>i ; i++) {
        
      e = that.cluster_array_tmp_keys[zoom][i];

      if( $.inArray(e, cluster_to_compare) !== -1)
      {
        that.cluster_array_tmp_keys[zoom][i] = -1;
      }
      else
      {  
        group = [];
        jQuery.grep(that.cluster_array[zoom][e], function(el) {
                if (jQuery.inArray(el, cluster_to_compare) == -1) group.push(el);
        });

        if(group.length!=0){
          that.cluster_array[zoom][e] = group;
        }
        else {
          that.cluster_array_tmp_keys[zoom][i] = -1;
        }   
      }

    }

    var tmp_array = []
    $(that.cluster_array_tmp_keys[zoom]).each(function(i,el){
      if(el > 0)
        tmp_array.push(el);
    });
    that.cluster_array_tmp_keys[zoom] = $.merge([],tmp_array);


  }

tot=0;

  this.biggest_cluster_index = function(point_cluster_tmp_keys, point_cluster_array){
    var biggest_cluster_length=0;
    var b_c_i=0;
    var b_c_k=0;

    $(point_cluster_tmp_keys).each(function(i,e){

      if(point_cluster_array[e].length > biggest_cluster_length) {
        b_c_i=e;
        b_c_k=i;
        biggest_cluster_length = point_cluster_array[e].length;
      }
    });

    return {index: b_c_i, key_index: b_c_k};
  }


  this.draw_markers = function() {
    that=this;
    var zoomlevel = 12;

    console.debug("Numero de comparacions: "+ comparacion);
    console.debug("representados: "+ this.cluster_array_keys[zoomlevel].length);
    $(this.cluster_array_keys[zoomlevel]).each(function( i,cc ){

      //console.debug(that.cluster_array[zoomlevel][cc]);
      marker_latlng = new google.maps.LatLng( that.json_points[cc].latitude, that.json_points[cc].longitude );
      

      //console.debug(cc+ ": "+that.cluster_array[zoomlevel][cc].length);
      
      tot += that.cluster_array[zoomlevel][cc].length;
      
      marker = new google.maps.Marker({
        title: $(cc).toString(),
        position: marker_latlng,
        map: that.options.map,
        visible:true
      });
    });

    console.debug("Totales agregados: "+ tot);
  }





}
