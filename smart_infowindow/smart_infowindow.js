
var overlay;
smart_infowindow.prototype = new google.maps.OverlayView();


/** @constructor */
function smart_infowindow(opts) {

  // obtain paths
  var current_path = $('script[src$="/smart_infowindow.js"]').attr('src').replace("smart_infowindow.js", "");

  this.options = new Object({
    map : false,
    box_id: false,
    map_scrollwhell_is_enabled: true,
    background_color: '#fff',
    box_shadow: '0px 0px 9px #888',
    peak_image: false,
    max_height: 200,
    border_height: 0,
    width: 200,
    allways_top: false, // when hover is locked, allways up direction
    corner_distance:30,
    marker_distance: [40,-10], // [top, bottom]
    peak_img: current_path + 'img/peak.png',
    peak_img_width: 13,
    peak_img_height: 11
  });
  $.extend(true, this.options, opts);

  this.div_ = false;
  this.setMap(this.options.map);
}


smart_infowindow.prototype.onAdd = function() {

  if(this.options.box_id)
    var box_id=" id='"+this.options.box_id+"' ";
  else
    var box_id=" ";

  var div = document.createElement('div');
  $(div).addClass('smart_infowindow');
  $(div).css('display' , 'none');
  $(div).css('position' , 'absolute');
  $(div).html(  "<div class='top-space'></div>" +
                "<div class='box' " + box_id + ">" +
                  "<div class='innerbox' style='overflow:auto;'></div>" +
                "</div>" +
                "<div class='bottom-space'></div>"
              );

  this.div_ = div;

  // Add the element to the "overlayLayer" pane.
  var panes = this.getPanes();
  panes.floatPane.appendChild(this.div_);

  // stop propagation of all events when into infowindow
  google.maps.event.addDomListener(this.div_, 'mousedown', function(e){if (e.stopPropagation) e.stopPropagation();});   // cancels drag/click
  google.maps.event.addDomListener(this.div_, 'click', function(e){if (e.stopPropagation) e.stopPropagation();});      // cancels click
  google.maps.event.addDomListener(this.div_, 'dblclick', function(e){if (e.stopPropagation) e.stopPropagation();});    // cancels double click
  google.maps.event.addDomListener(this.div_, 'contextmenu', function(e){if (e.stopPropagation) e.stopPropagation();}); // cancels double right click 
  google.maps.event.addDomListener(this.div_, 'mouseout', function(e){if (e.stopPropagation) e.stopPropagation();}); // cancels double right click 
  google.maps.event.addDomListener(this.div_, 'mouseleave', function(e){if (e.stopPropagation) e.stopPropagation();}); // cancels double right click 


  s_i_that = this;

  //
  // Here disable wheel zoom into infobox, create too the variable "is_on_infowindow", that makes
  
  is_on_infowindow = false;

  // enter on infowindow and set true
  $(s_i_that.div_).bind('mouseenter', function(){
    is_on_infowindow = true;
    s_i_that.options.map.setOptions({scrollwheel: false});
  });
  
  click_event_opened = false;

  // exit infowindow and set false
  $(s_i_that.div_).bind('mouseleave',function(){
    s_i_that.options.map.setOptions({scrollwheel: s_i_that.options.map_scrollwhell_is_enabled});
    is_on_infowindow = false;
    if(click_event_opened == false)
      s_i_that.close();
  });

  //
  //  when change zoom close infowindow
  google.maps.event.addListener(this.options.map, 'zoom_changed', function(){s_i_that.close()});

};

smart_infowindow.prototype.draw = function() {
};


// hovers and clicks
smart_infowindow.prototype.MarkerEvent = function(marker, evento, content) {
  google.maps.event.addListener(marker, evento, function( ){
    s_i_that.open(marker, evento, content);
  });
}

smart_infowindow.prototype.open = function( marker, evento, content ) {

  var click = false

  if(evento === 'click' ) {
    click_event_opened = true;
    var click = true;
    // if click on map check if is mouse is now on infowindow
    map_click_event = google.maps.event.addListenerOnce(s_i_that.options.map, 'click', function(){
      s_i_that.close();
      click_event_opened = false;
    });
  }
  else
  if(evento === 'mouseover' ) {

    marker_mouseout_event = google.maps.event.addListenerOnce(marker, 'mouseout', function(){
      if(is_on_infowindow == false )
        s_i_that.close();
    });
  }


  if( is_on_infowindow == false) {
    // lets open infowindow 
    this.close();
    this.SetContent(content);
    this.SetStyles();
    this.SetPosition(marker, click);
    $(this.div_).show();
  }

};


smart_infowindow.prototype.close = function( ) {
  $(this.div_).hide();
}


//
// Private Setters
//
smart_infowindow.prototype.SetStyles = function() {
  $(this.div_).find('.box').css('box-shadow', this.options.box_shadow );
  $(this.div_).find('.box').css('background-color', this.options.background_color );
//  $(this.div_).find('.box .innerbox').css('padding', '5px');
  $(this.div_).css('cursor', 'default' );
  $(this.div_).css('width', this.options.width );
  $(this.div_).find('.box .innerbox').css('height', 'auto')

  if( $(this.div_).height()-this.options.border_height > this.options.max_height ) {
    $(this.div_).find('.box .innerbox').height(this.options.max_height)
  }




  s_i_that = this;
};

smart_infowindow.prototype.SetPosition = function( marker, click_ev ) {
  var overlayProjection = this.getProjection();
  var canvas_marker_point = overlayProjection.fromLatLngToDivPixel( marker.getPosition() );
  var bounds = this.options.map.getBounds();

  var x_max = overlayProjection.fromLatLngToDivPixel( bounds.getNorthEast() ).x;
  var y_max = overlayProjection.fromLatLngToDivPixel( bounds.getNorthEast() ).y;
  var x_min = overlayProjection.fromLatLngToDivPixel( bounds.getSouthWest() ).x;
  var y_min = overlayProjection.fromLatLngToDivPixel( bounds.getSouthWest() ).y;

  var left =  canvas_marker_point.x - x_min;
  var right = x_max - canvas_marker_point.x;
  var top = Math.abs(y_max - canvas_marker_point.y);
  var bottom = Math.abs(canvas_marker_point.y - y_min);
/*
  console.debug(
      //x_max+ ','+ y_max+' _ '+ x_min + ',' + y_min
      'esquerda:' + left + ',' +
      'dereita:' + right + ',' +
      'arriba:' + top + ',' +
      'abaixo:' + bottom + ','
    );
*/

  // Y axis radious space
  var enought_top_space = ( ($(this.div_).height() + this.options.marker_distance[0]) < top ) ? true : false;
  var enought_bottom_space = ( ($(this.div_).height() + this.options.marker_distance[0]) < bottom ) ? true : false;

  // X axis radious space
  var enought_left_space = ( this.options.width/2 < left ) ? true : false;
  var enought_right_space = ( this.options.width/2 < right ) ? true : false;


  var peak_v = -1;
  var peak_h = 0;

  // decide Y position
  if( 
      this.options.allways_top == true || // hover is locked, allways up direction
      enought_top_space || // have enought space
      !enought_bottom_space ||
      click_ev == true  // is a click event
  ){
    $(this.div_).find('.bottom-space').css('height', this.options.peak_img_height);
    var final_peak_point_y = canvas_marker_point.y - $(this.div_).height() - this.options.marker_distance[0] ;
    peak_v = -1; // peak vertical on bottom
  }
  else {
    $(this.div_).find('.top-space').css('height', this.options.peak_img_height);
    var final_peak_point_y = canvas_marker_point.y + this.options.marker_distance[1] ;
    peak_v = 1; // peak vertical on top
  }

  // decide X position
  if( 
    (enought_right_space && enought_left_space) ||
    click_ev == true  // is a click event
  ){
    var final_peak_point_x = canvas_marker_point.x - this.options.width/2 ;
  }
  else
  if(enought_left_space && !enought_right_space)
  {
    var final_peak_point_x = canvas_marker_point.x - this.options.width + this.options.corner_distance ;
    peak_h = -1; // peak on left
  }
  else
  {
    var final_peak_point_x = canvas_marker_point.x - this.options.corner_distance ;
    peak_h = 1; // peak on right
  }

  // set peak position
  this.SetPeak(peak_v, peak_h);


  // center map when is a click event
  if(click_ev == true) {
    if(!enought_top_space) {
      this.options.map.setCenter( 
        overlayProjection.fromContainerPixelToLatLng(
          new google.maps.Point(
            overlayProjection.fromLatLngToDivPixel( marker.getPosition() ).x , 
            overlayProjection.fromLatLngToDivPixel( marker.getPosition() ).y - $(this.div_).height()
          )
        )
      );
    }
    if(!enought_right_space) {
      this.options.map.setCenter( 
        overlayProjection.fromContainerPixelToLatLng(
          new google.maps.Point(
            overlayProjection.fromLatLngToDivPixel( marker.getPosition() ).x + $(this.div_).width()/1.5 , 
            overlayProjection.fromLatLngToDivPixel( marker.getPosition() ).y 
          )
        )
      );
    }
    if(!enought_left_space) {
      this.options.map.setCenter( 
        overlayProjection.fromContainerPixelToLatLng(
          new google.maps.Point(
            overlayProjection.fromLatLngToDivPixel( marker.getPosition() ).x - $(this.div_).width()/1.5 , 
            overlayProjection.fromLatLngToDivPixel( marker.getPosition() ).y 
          )
        )
      );
    }
  }

  // final infowindow position
  this.div_.style.top = final_peak_point_y + 'px';
  this.div_.style.left = final_peak_point_x + 'px';

};


smart_infowindow.prototype.SetPeak = function(v, h) {

  var peak_img = document.createElement('img');
  $(peak_img).attr('src', this.options.peak_img);

  $(this.div_).find('.top-space').html("");
  $(this.div_).find('.bottom-space').html("");

  // set to or bottom position (and rotate with jquery rotate library)
  if(v===1){
    var current_peak_container = $(this.div_).find('.top-space');
    current_peak_container.css('height:default')
    current_peak_container.html(peak_img)

    current_peak_container.find('img').rotate(180);
  }
  else{
    var current_peak_container = $(this.div_).find('.bottom-space');
    current_peak_container.css('height:default')
    current_peak_container.html(peak_img);
  }

  // set horizontal position
  if( h == -1 ){
    var peak_margin_left = this.options.width - this.options.corner_distance - this.options.peak_img_width/2;
  }
  else 
  if( h == 1)
  {
    var peak_margin_left = this.options.corner_distance - this.options.peak_img_width/2;
  }
  else {
    var peak_margin_left = this.options.width/2  - this.options.peak_img_width/2;
  }

  current_peak_container.find('img').css('margin-left', peak_margin_left+'px');
};


smart_infowindow.prototype.SetContent = function(content) {
  $(this.div_).find('.box .innerbox').html( content );
};


//
// Public Setters
//

// @distances_array : [top, bottom]
smart_infowindow.prototype.SetMarkerDistances = function( marker_distance ) {
  this.options.marker_distance = marker_distance; 
};

smart_infowindow.prototype.SetWidth = function( width ) {
  this.options.width = width;
};

smart_infowindow.prototype.SetMaxHeight = function( max_height ) {
  this.options.max_height = max_height;
};
