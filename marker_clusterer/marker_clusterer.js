


function  marker_clusterer( opts ) {
  var that = this;


  // obtain paths
  var current_path = $('script[src$="/marker_clusterer.js"]').attr('src').replace("marker_clusterer.js", "");

  that.options = new Object({
    json_data : false,
    data_structure: {id: 'id', lat: 'latitude', lng: 'longitude'},
    zoom_range : [10,19],
    nocluster_zoom_range: [100,100],
    map : false,
    filter_list: {enabled_list: false, categories: []},
    show_disabled_points: true,
    cluster_radious : 15, // in pixels

    icon_path : current_path + "img/",
    icon_big_elements: 6, // use this icon when cluster more than x elements
    icon_big_diameter: 20,
    icon_big: "point_big.png",
    icon_medium_diameter: 15,
    icon_medium: "point_medium.png", 
    icon_small_diameter: 10,
    icon_small: "point_small.png",
    icon_disabled_diameter: 10,    
    icon_disabled: "point_small_disabled.png",

    zIndex:10,

    hover_event: function(marker, data){},
    click_event: function(marker, data){},

    debug: false
  });

  // zoom ranges are compatible
  if( that.options.zoom_range[1] > that.options.nocluster_zoom_range[0] ) {
    console.log('Marker_clusterer.js: nocluster_zoom_range must be greater than zoom_range');
  }

  $.extend(true, that.options, opts);


  that.json_data = false;
  that.json_points = [];
  that.r_trees = [];

  that.raw_cluster_array_keys = [];
  that.raw_cluster_array = [];

  that.disabled_array_keys = [];
  that.cluster_array_keys = [];
  that.cluster_array_tmp_keys = [];
  that.cluster_array = [];

  that.nocluster_array = [];
  that.nocluster_array_keys = [];
  that.nocluster_disabled_array = [];

  that.markers = [];
  that.marker_categories = [];
  that.markers_are_hidden = false;
  // ICONS

  that.icon_disabled = { 
        url: that.options.icon_path + that.options.icon_disabled, 
        anchor: new google.maps.Point( 
          that.options.icon_disabled_diameter/2-1, 
          that.options.icon_disabled_diameter/2
        ) 
  };
  that.icon_small = { 
        url: that.options.icon_small, 
        anchor: new google.maps.Point( 
          that.options.icon_small_diameter/2-1, 
          that.options.icon_small_diameter/2
        )
       /* origin: new google.maps.Point( 
          this.options.icon_small_diameter/2, 
          this.options.icon_small_diameter/2
        ),*/

  };
  that.icon_medium = { 
        url: that.options.icon_medium , 
        anchor: new google.maps.Point( 
          that.options.icon_medium_diameter/2-1, 
          that.options.icon_medium_diameter/2
        ) 
  };
  that.icon_big = { 
        url: that.options.icon_big, 
        anchor: new google.maps.Point( 
          that.options.icon_big_diameter/2-1, 
          that.options.icon_big_diameter/2
        )
  };
  



  // init
/*  google.maps.event.addListenerOnce(this.options.map, 'idle', function( ){


  });*/
  
  google.maps.event.addListener(that.options.map, 'zoom_changed', function( ){
    that.show_markers()
  });

  // end init


  that.reload_data = that.load_data = function(new_json_data, dont_recluster) {
    var that = this;

    if(typeof dont_recluster == "undefined" || dont_recluster == false) {

      that.json_data = false;
      that.json_points = [];
      that.r_trees = [];

      that.raw_cluster_array_keys = [];
      that.raw_cluster_array = [];

      that.disabled_array_keys = [];
      that.cluster_array_keys = [];
      that.cluster_array_tmp_keys = [];
      that.cluster_array = [];

      $(that.markers).each(function(i,e){
        e.setMap(null);
      });
      that.markers = [];


      that.json_data = that.options.json_data;

      that.json_points = [];
      $( that.json_data ).each( function(i,e) {
            that.json_points[i] = e;
            that.add_marker(i);
      });

      that.create_r_trees();
      that.raw_cluster_points();

      that.ghost_cluster_points();

      that.debug_set_initial_time();

      that.filter(that.options.filter_list); 
      //that.cluster_points(); 
      //that.show_markers()    
    }
    else {
      that.json_data = new_json_data;

      that.json_points = [];
      $( that.json_data ).each( function(i,e) {
            that.json_points[i] = e;
            //that.add_marker(i);
      });      
    }


  };

  that.find_by_id = function( id ) {
    var real_id = false;
    $.each( that.json_points, function(i, e) {

      e_id = eval("e." + that.options.data_structure.id); // know id dinamically
      if( id == e_id) {
        real_id = i;
        return false;
      }
    });

    return real_id;
  };

  that.create_r_trees = function() {
    var that = this;

    mapProjection = that.options.map.getProjection();

    // init or reset r trees
    for(var zoomlevel = that.options.zoom_range[0]; zoomlevel<=that.options.zoom_range[1] ;zoomlevel++) {
      that.r_trees[zoomlevel] = rbush($(that.json_points).length, ['.lat', '.lng', '.lat', '.lng']);
    }

    $.each( that.json_points, function(i,e){
      for(zoomlevel = that.options.zoom_range[0]; zoomlevel<=that.options.zoom_range[1] ;zoomlevel++) {
        var scale = Math.pow(2, zoomlevel);
        eval("pixels_latlng =  mapProjection.fromLatLngToPoint( new google.maps.LatLng(e."+that.options.data_structure.lat+", e."+that.options.data_structure.lng+") );");
        tree_row = { index: i, lat: parseInt(pixels_latlng.x*scale) , lng: parseInt(pixels_latlng.y*scale) };
        that.r_trees[zoomlevel].insert( tree_row );
      }

    });
    
  };


  that.raw_cluster_points = function() {

    var that = this;

    for(zoomlevel = that.options.zoom_range[0]; zoomlevel<=that.options.zoom_range[1] ;zoomlevel++) {

      that.raw_cluster_array[zoomlevel] = [];
      that.raw_cluster_array_keys[zoomlevel] = [];
      $.each( that.r_trees[zoomlevel].data.children, function(i,e){

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

  // filtering by cluster id. You must obtain the ids with find_by_id method
  that.fastfilter = function(filter_obj){
    /*
      // FILTER OBJECT STRUCTURE
      enabled_list: [ids array],
      categories:[
        {id: 'custom_name_1', important: true, elements: [ids_array1], hide:true },
        {id: 'custom_name_2', important: false, elements: [ids_array2] }
      ]
    */

    var that=this;

    // reset dbug timer
    that.debug_reset_timer();

    // convert into real array keys
    that.options.filter_list = [];
    that.marker_categories = filter_obj.categories;

    if(!filter_obj.enabled_list || typeof filter_obj.enabled_list == "undefined") { // all markers
      $.each( that.json_points, function(i, e) {
          that.options.filter_list.push( i );
      });
    }
    else { // filter list
      that.options.filter_list = filter_obj.enabled_list;
    }


    this.debug_line("Convert ids");
    that.cluster_points();
    this.debug_line("Cluster points");
    that.show_markers();
    this.debug_line("Print markers");
    that.debug_line_separator();

  }


  // if newlist == false show all markers
  that.filter = function(filter_obj){

    /*
      // FILTER OBJECT STRUCTURE
      enabled_list: [ids array],
      categories:[
        {id: 'custom_name_1', important: true, elements: [ids_array1], hide:true },
        {id: 'custom_name_2', important: false, elements: [ids_array2] }
      ]
    */

    var that=this;

    // reset dbug timer
    that.debug_reset_timer();

    // convert into real array keys
    that.options.filter_list = [];
    that.marker_categories = filter_obj.categories;

    if(!filter_obj.enabled_list || typeof filter_obj.enabled_list == "undefined") { // all markers
      $.each(that.json_points, function(i, e) {
          that.options.filter_list.push( i );
      });
    }
    else { // filter list
      $.each( filter_obj.enabled_list, function(i,e) {
        that.options.filter_list.push( that.find_by_id(e) );
      });
    }


    this.debug_line("Convert ids");
    that.cluster_points();
    this.debug_line("Cluster points");
    that.show_markers();
    this.debug_line("Print markers");
    that.debug_line_separator();

  }


  that.exclude_hiden_categories = function(cluster_array){

    var that = this;
    var return_cluster_array = [];
    var process_the_array = false;
    var compare_array = [];


    $.each(that.marker_categories, function(i,e) {
      if(typeof e.hide != "undefined" && e.hide == true){
        process_the_array = true;
        compare_array = $.merge( compare_array, e.elements );
      }
    });

    if(process_the_array)
    {

      if( $.isArray( cluster_array[0] ) ) // one dimension array
      {

//        return_cluster_array = cluster_array;

        $.each( cluster_array, function(i,e){
          return_cluster_array[i] = [];
          $.each( e, function(i2,e2){
            eval("var search_id = that.json_data[e2]."+ that.options.data_structure.id +";");
            if($.inArray(search_id, compare_array ) == -1){
              return_cluster_array[i].push(e2);
            }
          });
        });
      }
      else  // two dimension array
      {
        $.each(cluster_array, function(i,e) {
          eval("var search_id = that.json_data[e]."+ that.options.data_structure.id +";");
          if($.inArray(search_id, compare_array ) == -1){
            return_cluster_array.push(e);
          }
        });
      }
    }
    else 
    {
      return_cluster_array = cluster_array;
    }


    return return_cluster_array;
  }

  that.ghost_cluster_points = function( ) {

    var  bc;
    var that = this;




    // Make clusters
    for( var zoomlevel = that.options.zoom_range[0]; zoomlevel<=that.options.zoom_range[1] ;zoomlevel++) {


      that.cluster_array[zoomlevel] = $.merge( [], that.exclude_hiden_categories(that.raw_cluster_array[zoomlevel]) );
      that.cluster_array_tmp_keys[zoomlevel] = $.merge( [], that.exclude_hiden_categories(that.raw_cluster_array_keys[zoomlevel]) );
      that.cluster_array_keys[zoomlevel] = [];
      that.disabled_array_keys[zoomlevel] = [];

      while(that.cluster_array_tmp_keys[zoomlevel].length > 0){

        bc = that.biggest_cluster_index(that.cluster_array_tmp_keys[zoomlevel], that.cluster_array[zoomlevel]);

        that.cluster_array_tmp_keys[zoomlevel].splice(bc.key_index , 1); // remove from key array
        that.cluster_array_keys[zoomlevel].push(bc.index);



        if(that.cluster_array[zoomlevel][bc.index].length == 1)
          that.disabled_array_keys[zoomlevel].push(bc.index);
        

        that.clean_clusters( zoomlevel , that.cluster_array[zoomlevel][bc.index] );

      }


    }
  }


  that.cluster_points = function( ) {

    var  bc;
    var that = this;

    //nocluster list
    that.nocluster_points();

    // apply filters or simply clone arrays

    for( var zoomlevel = that.options.zoom_range[0]; zoomlevel<=that.options.zoom_range[1] ;zoomlevel++) {

      that.cluster_array_tmp_keys[zoomlevel] = $.merge( [], that.exclude_hiden_categories(that.options.filter_list) );
      that.cluster_array[zoomlevel] = $.merge( [], that.exclude_hiden_categories(that.raw_cluster_array[zoomlevel]) );
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

    // Make clusters
    for( var zoomlevel = that.options.zoom_range[0]; zoomlevel<=that.options.zoom_range[1] ;zoomlevel++) {


      while(that.cluster_array_tmp_keys[zoomlevel].length > 0){

        bc = that.biggest_cluster_index(that.cluster_array_tmp_keys[zoomlevel], that.cluster_array[zoomlevel]);

        that.cluster_array_tmp_keys[zoomlevel].splice(bc.key_index , 1); // remove from key array
        that.cluster_array_keys[zoomlevel].push(bc.index);
        
        that.clean_clusters( zoomlevel , that.cluster_array[zoomlevel][bc.index] );

      }


    }
  }



  that.nocluster_points = function() {
    var that = this;
    var point = false;
    var points_enabled = false;

    that.nocluster_array = [];
    that.nocluster_array_keys = [];
    that.nocluster_disabled_array = [];



    if(typeof that.options.filter_list.enabled_list != "undefined") {
      points_enabled = that.options.filter_list.enabled_list;
    }
    else {
      points_enabled = that.options.filter_list;
    }

    $.each(that.options.json_data, function(i,e) {
      eval('point = e.'+that.options.data_structure.id);

      if( $.inArray( that.find_by_id(point) , points_enabled) !== -1 ) {
        that.nocluster_array[i] = [i];
        that.nocluster_array_keys.push( i );
      }
      else {
        //that.nocluster_disabled_array.push(point);
      }

    });

  }


  that.clean_clusters = function(zoom, cluster_to_compare) {
    var that = this;
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



  that.biggest_cluster_index = function(point_cluster_tmp_keys, point_cluster_array){
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


  that.add_marker = function( marker_id ) {
    var that = this;
    eval("var marker_latlng = new google.maps.LatLng( that.json_points[marker_id]."+that.options.data_structure.lat+", that.json_points[marker_id]."+that.options.data_structure.lng+" );");
      
    var marker = new google.maps.Marker({
      position: marker_latlng,
      map: that.options.map,
      visible:false,
      zIndex:that.options.zIndex
    });


    google.maps.event.addListener(marker, 'click', function(){
      // set zoomlevels
      var zoomlevel = that.get_zoomlevel();

      marker_click_return = [];
      if(zoomlevel != -1) {
        $(that.cluster_array[zoomlevel][marker_id]).each( function(i,e) {
          marker_click_return.push(that.json_points[e]);
        });
      }
      else {
        marker_click_return.push( that.json_points[marker_id] );
      }

      that.options.click_event(marker, marker_click_return);
    });

    google.maps.event.addListener(marker, 'mouseover', function(){
      // set zoomlevels
      var zoomlevel = that.get_zoomlevel();

      marker_click_return = [];
      if(zoomlevel != -1) {
        $(that.cluster_array[zoomlevel][marker_id]).each( function(i,e) {
          marker_click_return.push(that.json_points[e]);
        });
      }
      else {
        marker_click_return.push( that.json_points[marker_id] );
      }

      that.options.hover_event(marker, marker_click_return);
    });

    that.markers[marker_id] = marker;
  }




  that.show_markers = function() {

    var that = this;
    if(that.markers_are_hidden)
      return false;


    var zoomlevel = that.get_zoomlevel();

    // hide all markers
    $.each( that.markers, function(i, e) {
      e.setVisible(false);
    });

    $(that.cluster_markers).each( function(i, e) {
      e.setVisible(false);
    });
  
    // disabled markers
    if(that.options.show_disabled_points == true){
      $.each(that.disabled_array_keys[zoomlevel], function(i,e){
        //console.debug(that.cluster_array[zoomlevel][e])
        if(that.cluster_array[zoomlevel][e].length > 0) {
          that.markers[e].setIcon(that.icon_disabled);
          that.markers[e].setVisible(true);
        }
      });


    }

    // enabled markers
    if(zoomlevel == -1){
      var cluster_keys = that.nocluster_array_keys;
      //console.log(cluster_keys.length);
    }
    else{
      var cluster_keys = that.cluster_array_keys[zoomlevel];
      //console.log(cluster_keys);
    }
    
    $.each( cluster_keys, function(i, e) {
        that.choose_icon(e, zoomlevel);
    });
    
  }

  that.choose_icon = function(id, zoomlevel){
    var that = this;

    var icon_category = '';
    var cluster = false;

    if(zoomlevel == -1) {
      cluster = that.nocluster_array[id];
    }
    else {
      cluster = that.cluster_array[zoomlevel][id];
    }

    // sets icon category
    $.each( that.marker_categories, function(i_category, category) {
      var coincidences = 0;

      $.each(cluster, function(i,e){

        eval("var search_id = that.json_data[e]."+ that.options.data_structure.id +";");
        if($.inArray(search_id, category.elements) != -1){
          coincidences++;
          if(category.important == true)
            return false;
        }
      });


      if( category.important == true && coincidences > 0 || coincidences == cluster.length )
      {
        icon_category = category.id + '_';
        if(category.important == true)
          return false;
      }

    });



    if( cluster.length > 1 ){
      if( cluster.length > that.options.icon_big_elements ) {
      that.markers[id].setIcon( {url:that.options.icon_path + icon_category + that.options.icon_big, anchor:that.icon_big.anchor}); // SMALL ICON
      }
      else {
      that.markers[id].setIcon( {url:that.options.icon_path + icon_category + that.options.icon_medium, anchor:that.icon_medium.anchor}); // SMALL ICON
      }
    }
    else{
      that.markers[id].setIcon( {url:that.options.icon_path + icon_category + that.options.icon_small, anchor:that.icon_small.anchor}); // SMALL ICON
    }

    that.markers[id].setVisible(true);
  }




  that.hide_all_markers = function(id, zoomlevel){
    var that = this;

    that.markers_are_hidden = true;
    $.each(that.markers, function(i,e){
      e.setVisible(false);
    });
  }

  that.show_all_markers = function(id, zoomlevel){
    var that = this;

    that.markers_are_hidden = false;
    that.show_markers();
  }


  that.get_zoomlevel = function() {

    var zoomlevel = that.options.map.getZoom();

    if(zoomlevel > that.options.zoom_range[1]) {
      if(zoomlevel >= that.options.nocluster_zoom_range[0] && zoomlevel <= that.options.nocluster_zoom_range[1]) {
        zoomlevel = -1;
      }
      else {
        zoomlevel = that.options.zoom_range[1];
      }
    }
    else
    if(zoomlevel < that.options.zoom_range[0]) {
      zoomlevel = that.options.zoom_range[0];
    }

    return zoomlevel;
  }

  /***********************
   *    DEBUG SUB-CLASS
   ***********************/

  that.debug_timer = function() {
    var that = this;
        
    if(that.options.debug == true) {

      that.debug_debugDiv = document.createElement('div');
      that.debug_debugTitle = document.createElement('h2');
      that.debug_mainTimes = document.createElement('div');      
      that.debug_clusteringTimes = document.createElement('div');            

      $(that.debug_debugTitle).html("Marker clusterer debug");

      $(that.debug_debugDiv).append(that.debug_debugTitle);
      $(that.debug_debugDiv).append(that.debug_mainTimes);
      $(that.debug_debugDiv).append(that.debug_clusteringTimes);
      $("body").append(that.debug_debugDiv);



      $(that.debug_debugDiv).addClass("marker_clusterer_debug");
      $(that.debug_mainTimes).addClass("marker_clusterer_debug");      


      $(that.debug_debugDiv).css('width','180px');
      $(that.debug_debugDiv).css('max-height','400px');
      $(that.debug_debugDiv).css('min-height', '100px');
      $(that.debug_debugDiv).css('position','absolute');
      $(that.debug_debugDiv).css('right','0px');
      $(that.debug_debugDiv).css('bottom','0px');
      $(that.debug_debugDiv).css('z-index','1110');
      $(that.debug_debugDiv).css('padding','10px');
      $(that.debug_debugDiv).css('font-size','0.7em');
      $(that.debug_debugDiv).css('overflow','auto');
      $(that.debug_debugDiv).find('div').css('margin-top', '4px');

      $(that.debug_debugDiv).css('background-color','white');

      console.log("marker clusterer: debug_enabled")
      that.debug_started_at = false;
      that.debug_started_at = that.debug_getdate();

    }
  }

  that.debug_reset_timer = function(){
    if(that.options.debug == true)
      that.debug_started_at = that.debug_getdate();
  }

  that.debug_line_separator = function(){
    if(that.options.debug == true)
      $(that.debug_clusteringTimes).prepend("<br>");
  }  

  that.debug_line = function(desc) {
    var that = this;
    if(that.options.debug == true){
      $(that.debug_clusteringTimes).prepend("<b>"+desc+": </b>"+ that.debug_checktime()+"ms<br>");
      that.debug_reset_timer();
    }
  }

  that.debug_set_initial_time = function() {
    var that = this;
    if(that.options.debug == true){
      $(that.debug_mainTimes).html("<b>First load: </b>"+ that.debug_checktime()+"ms");
      that.debug_reset_timer();
    }
  }
  
  that.debug_getdate= function() {
    return new Date().getTime() ;
  }

  that.debug_checktime = function() {
    var that = this;
    return that.debug_getdate() - that.debug_started_at;
  }


  // debug timer
  that.debug_timer();
  
  // first load ! 
  that.load_data();
}
