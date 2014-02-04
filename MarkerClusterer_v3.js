

function  MarkerClusterer_v3( opts ) {
  that = this;
  this.json_data = false;
  this.json_points = [];
  this.r_trees = [];
  this.raw_cluster_array = [];
  this.cluster_array_tmp = [];
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

      $( that.r_trees[zoomlevel].data.children ).each(function(i,e){

        var result = that.r_trees[zoomlevel].search([ e.lat - that.options.group_radious, e.lng - that.options.group_radious, e.lat + that.options.group_radious, e.lng + that.options.group_radious]);

        group = [];
        $( result ).each( function(i,ee){
            group.push(ee.index);
        });

        that.raw_cluster_array[zoomlevel].push(group);

      });

    }
  };


  this.cluster_points = function( filter ) {

    var biggest_cluster;
    that = this;
    this.cluster_array_tmp = this.raw_cluster_array;


    for(var zoomlevel = this.options.zoom_range[0]; zoomlevel<=this.options.zoom_range[1] ;zoomlevel++) {
      
      this.cluster_array[zoomlevel] = [];

      while( this.cluster_array_tmp[zoomlevel].length != 0) {
        
          // get biggest cluster index
          biggest_cluster_index= this.biggest_cluster_index(this.cluster_array_tmp[ zoomlevel ]);
          
          biggest_cluster = this.cluster_array_tmp[zoomlevel][biggest_cluster_index];

          // push biggest tmp cluster to cluster array
          this.cluster_array[zoomlevel].push(biggest_cluster);


          // delete cluster 0 form tmp array
          if(this.cluster_array_tmp[zoomlevel].length > 1)
            this.cluster_array_tmp[zoomlevel].splice(biggest_cluster_index,1);
          else
            this.cluster_array_tmp[zoomlevel]=[];
          
          // deleting duplicates acording with first_cluster
          if( biggest_cluster.length > 1)
            this.cluster_array_tmp[zoomlevel] = this.clean_clusters(this.cluster_array_tmp[zoomlevel], biggest_cluster);

        }

    }



  };


  this.clean_clusters = function(point_clusters, cluster_to_compare) {

    var res_clusters = [];
    var cluster = []
    $(point_clusters).each( function(i,e){

      cluster = []

      $(e).each( function(i2,e2){
        if( $.inArray( e2, cluster_to_compare ) === -1 ) {
          cluster.push(e2);
        }
      });

      if(cluster.length>0) {
        res_clusters.push(cluster);
      }

    });

    return res_clusters;
  }

  this.biggest_cluster_index = function(point_clusters){
    var biggest_cluster_length=0;
    var biggest_cluster_index=0;

    $(point_clusters).each(function(i,e){

      if(e.length > biggest_cluster_length) {
        biggest_cluster_index=i;
        biggest_cluster_length = e.length;
      }
    });

    return biggest_cluster_index;
  }




  this.draw_markers = function() {

    //
    //  Establecer zooms de novo
    //  Visibilidade null para todos
    //  Reiniciar zoom mínimo a zoom máximo
    //

    that = this;
    var marker;
    var marker_latlng;

    //for(var zoomlevel = this.options.zoom_range[0]; zoomlevel<=this.options.zoom_range[1] ;zoomlevel++) {
      //console.debug("zoom:"+zoomlevel);
      //console.debug("elementos:"+that.cluster_array[zoomlevel].length);
      $(that.cluster_array[17]).each(function( i,cc ){

        //console.debug("subelementos:" + cc.length);
        console.debug(cc);

/*
        marker_latlng = new google.maps.LatLng( that.json_points[cc[0]].latitude, that.json_points[cc[0]].longitude );

        marker = new google.maps.Marker({
          position: marker_latlng,
          map: that.options.map,
          
          visible:true
        });

*/

        //console.debug(    i + ' _ ' +that.json_points[cc[0]].id + ' = ' +that.json_points[cc[0]].latitude +','+ that.json_points[cc[0]].longitude     );

        //console.debug(that.json_points[cc[0]].latitude  );

      });
    //}


/*
    for (var zoomlevel = 0; zoomlevel <= maxzoom; zoomlevel++) {

      $(this.point_clusters[zoomlevel]).each(function(i, cluster){
        if( $(cluster).length == 1 ) {

          // parámetros por extender
          this.markers[i].zoom_minimo = zoomlevel;
          this.markers[i].visible = true;

        }
      });
    }*/

  }


  this.remove_markers = function() {

  }



}
