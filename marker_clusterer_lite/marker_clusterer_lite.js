


function  MarkerClusterer_v3( opts ) {
  that = this;


  // obtain paths
  var current_path = $('script[src$="/marker_clusterer_lite.js"]').attr('src').replace("marker_clusterer_lite.js", "");

  // load r-bush lib
  $.getScript( current_path+ 'vendor/rbush.js');

  this.options = new Object({
    json_data : false,
    zoom_range : [10,19],
    map : false,
    filter_list: [],
    show_disabled_points: true,
    cluster_radious : 18, // in pixels

    icon_big_elements: 7, // use this icon when cluster more than x elements
    icon_big_radious: 20,
    icon_big: current_path+"img/point_big.png",
    icon_medium_radious: 15,
    icon_medium: current_path+"img/point_medium.png", 
    icon_small_radious: 10,
    icon_small: current_path+"img/point_small.png",
    icon_small_disabled: current_path+"img/point_small_disabled.png"

  });
  $.extend(true, this.options, opts);


  this.json_data = false;
  this.json_points = [];
  this.r_trees = [];

  this.raw_cluster_array_keys = [];
  this.raw_cluster_array = [];

  this.disabled_array_keys = [];
  this.cluster_array_keys = [];
  this.cluster_array_tmp_keys = [];
  this.cluster_array = [];


  this.markers = [];

  this.icon_small_disabled = { url: this.options.icon_small_disabled };
  this.icon_small = { url: this.options.icon_small };
  this.icon_medium = { url: this.options.icon_medium };
  this.icon_big = { url: this.options.icon_big };
  



  // init
  google.maps.event.addListenerOnce(this.options.map, 'idle', function( ){

    that.load_data();
    that.create_r_trees();
    that.raw_cluster_points();
    that.ghost_cluster_points();
    that.cluster_points();
    that.show_markers()

  });
  
  google.maps.event.addListener(this.options.map, 'zoom_changed', function( ){
    that.show_markers()
  });

  // end init


  this.reload_data = this.load_data = function() {

    that = this;
    that.json_data = that.options.json_data;
    $( that.json_data ).each( function(i,e) {
          that.json_points[i] = e;
          that.add_marker(i);
    });
  };

  this.find_by_id = function( id ) {
    var real_id = false;
    $(this.json_points).each( function(i, e) {
      if( id == e.id) {
        real_id = i;
        return false;
      }
    });

    return real_id;
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

        var result = that.r_trees[zoomlevel].search([ e.lat - that.options.cluster_radious, e.lng - that.options.cluster_radious, e.lat + that.options.cluster_radious, e.lng + that.options.cluster_radious]);

        var group = [];
        $( result ).each( function(i,ee){
            group.push(ee.index);
        });

        that.raw_cluster_array[zoomlevel][i] = group;
        that.raw_cluster_array_keys[zoomlevel].push(i);

      });

    }
  }


  this.filter = function(newList){
    that=this;
    // convert into real array keys
    this.options.filter_list = [];

    // filtered points
    $(newList).each( function(i,e) {
      that.options.filter_list.push( that.find_by_id(e) );
    });


    this.cluster_points();
    this.show_markers();
  }


  this.ghost_cluster_points = function( ) {

    var  bc;
    that = this;




    // Make clusters
      for( var zoomlevel = this.options.zoom_range[0]; zoomlevel<=this.options.zoom_range[1] ;zoomlevel++) {

        that.cluster_array[zoomlevel] = $.merge( [],this.raw_cluster_array[zoomlevel] );
        that.cluster_array_tmp_keys[zoomlevel] = $.merge( [],this.raw_cluster_array_keys[zoomlevel] );
        that.cluster_array_keys[zoomlevel] = [];
        that.disabled_array_keys[zoomlevel] = [];

        while(this.cluster_array_tmp_keys[zoomlevel].length > 0){

          bc = this.biggest_cluster_index(this.cluster_array_tmp_keys[zoomlevel], this.cluster_array[zoomlevel]);

          this.cluster_array_tmp_keys[zoomlevel].splice(bc.key_index , 1); // remove from key array
          this.cluster_array_keys[zoomlevel].push(bc.index);



          if(that.cluster_array[zoomlevel][bc.index].length == 1)
            this.disabled_array_keys[zoomlevel].push(bc.index);
          

          this.clean_clusters( zoomlevel , this.cluster_array[zoomlevel][bc.index] );

        }


      }
  }


  this.cluster_points = function( ) {

    var  bc;
    that = this;


    // apply filters or simply clone arrays
    if(this.options.filter_list.length){

      for( var zoomlevel = this.options.zoom_range[0]; zoomlevel<=this.options.zoom_range[1] ;zoomlevel++) {


        that.cluster_array_tmp_keys[zoomlevel] = $.merge( [],that.options.filter_list);
        that.cluster_array[zoomlevel] = $.merge( [],this.raw_cluster_array[zoomlevel] );
        that.cluster_array_keys[zoomlevel] = [];


        $(that.cluster_array_tmp_keys[zoomlevel]).each( function(index, val) {
          if(that.cluster_array[zoomlevel][val].length > 1) {
            var group = [];

            $(that.cluster_array[zoomlevel][val]).each( function(i, e) {
              if($.inArray(e, that.options.filter_list) !== -1)
                group.push(e);
            });

            that.cluster_array[zoomlevel][val] = group;

          }
        });

      }

    }
    else {
      for( var zoomlevel = this.options.zoom_range[0]; zoomlevel<=this.options.zoom_range[1] ;zoomlevel++) {
        that.cluster_array[zoomlevel] = $.merge( [],this.raw_cluster_array[zoomlevel] );
        that.cluster_array_tmp_keys[zoomlevel] = $.merge( [],this.raw_cluster_array_keys[zoomlevel] );
        that.cluster_array_keys[zoomlevel] = [];
      }
    }




    // Make clusters
    for( var zoomlevel = this.options.zoom_range[0]; zoomlevel<=this.options.zoom_range[1] ;zoomlevel++) {


      while(this.cluster_array_tmp_keys[zoomlevel].length > 0){

        bc = this.biggest_cluster_index(this.cluster_array_tmp_keys[zoomlevel], this.cluster_array[zoomlevel]);

        this.cluster_array_tmp_keys[zoomlevel].splice(bc.key_index , 1); // remove from key array
        this.cluster_array_keys[zoomlevel].push(bc.index);
        
        this.clean_clusters( zoomlevel , this.cluster_array[zoomlevel][bc.index] );

      }


    }
  }






  this.clean_clusters = function(zoom, cluster_to_compare) {
    that = this;
    var e;
    var group=[];

    for(var i=0 ; that.cluster_array_tmp_keys[zoom].length>i ; i++) {
        
      e = that.cluster_array_tmp_keys[zoom][i];

      if( $.inArray(e, cluster_to_compare) !== -1 )
      {
        that.cluster_array_tmp_keys[zoom][i] = -1;
      }
      else
      {  
        group = [];
        jQuery.grep(that.cluster_array[zoom][e], function(el) {
            if ($.inArray(el, cluster_to_compare) == -1) group.push(el);
        });

        if(group.length != 0){
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


  //
  //  Markers methods
  //


  this.add_marker = function( marker_id ) {

    var marker_latlng = new google.maps.LatLng( this.json_points[marker_id].latitude, this.json_points[marker_id].longitude );
      
    var marker = new google.maps.Marker({
      position: marker_latlng,
      map: this.options.map,
      visible:false
    });

    this.markers[marker_id] = marker;
  }




  this.show_markers = function() {
    that=this;
    var zoomlevel = cluster_manager.options.map.getZoom();
    


    if(zoomlevel > this.options.zoom_range[1])  
      zoomlevel = this.options.zoom_range[1];
    else
    if(zoomlevel < this.options.zoom_range[0])  
      zoomlevel = this.options.zoom_range[0];


    // hide all markers
    $(this.markers).each( function(i, e) {
      e.setVisible(false);
    });

    $(this.cluster_markers).each( function(i, e) {
      e.setVisible(false);
    });


    // disabled markers
    if(this.options.show_disabled_points == true){

      $(this.disabled_array_keys[zoomlevel]).each(function(i,e){
        
        that.markers[e].setIcon(that.icon_small_disabled);
        that.markers[e].setVisible(true);

      });
    }

    // enabled markers
    $(this.cluster_array_keys[zoomlevel]).each( function(i, e) {

      if( that.cluster_array[zoomlevel][e].length > 1 ){
        if( that.cluster_array[zoomlevel][e].length > that.options.icon_big_elements ) {
          that.markers[e].setIcon(that.icon_big);
        }
        else {
          that.markers[e].setIcon(that.icon_medium);      
        }
      }
      else{
        that.markers[e].setIcon(that.icon_small);
      }

      that.markers[e].setVisible(true);
    });


  }





}
