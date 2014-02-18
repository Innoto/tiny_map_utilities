
var overlay;
smart_infowindow.prototype = new google.maps.OverlayView();


/** @constructor */
function smart_infowindow(opts) {

  // obtain paths
  var current_path = $('script[src$="/smart_infowindow.js"]').attr('src').replace("smart_infowindow.js", "");

  this.options = new Object({
    map : false,

    background_color: '#fff',
    box_shadow: '0px 0px 9px #888',
    peak_image: false,
    max_height: 400,
    width: 300,
    allways_top: false, // when hover is locked, allways up direction
    corner_distance:30,
    marker_distance: [30,-10], // [top, bottom]

    peak_img: current_path + 'img/peak.png',
    peak_img_width: 13,
    peak_img_height: 11
  });
  $.extend(true, this.options, opts);

  this.div_ = false;
  this.setMap(this.options.map);

}


smart_infowindow.prototype.onAdd = function() {

  var div = document.createElement('div');
  $(div).addClass('smart_infowindow');
  $(div).css('display' , 'none');
  $(div).css('position' , 'absolute');
  $(div).html(  "<div class='top-space'></div>" +
                "<div class='box'>asdf</div>" +
                "<div class='bottom-space'></div>"
              );

  this.div_ = div;

  // Add the element to the "overlayLayer" pane.
  var panes = this.getPanes();
  panes.floatPane.appendChild(this.div_);

};

smart_infowindow.prototype.draw = function() {
};


// hovers and clicks
smart_infowindow.prototype.MarkerEvent = function(marker, evento, content) {

  s_i_that = this;

  google.maps.event.addListener(marker, evento, function( ){
    if(evento === 'click') {
      is_on_inwfowindow = false;


      // enter on infowindow and set true
      $(s_i_that.div_).one('mouseenter', function(){
          is_on_inwfowindow = true;
      });
     
      // exit infowindow and set false
      $(s_i_that.div_).mouseleave(function(){
          is_on_inwfowindow = false;
      });
      
      // if click on map check if is mouse is now on infowindow
      if(typeof map_click_event != 'undefined')  google.maps.event.removeListener(map_click_event);
      map_click_event = google.maps.event.addListener(s_i_that.options.map, 'click', function(){
        if(!is_on_inwfowindow) {
          s_i_that.close();
        }
      });
    }
    else
    if(evento === 'mouseover') {
      marker_mouseout_event = google.maps.event.addListenerOnce(marker, 'mouseout', function(){
        s_i_that.close();
      });
      // init event when mouse enter into infowindow
      $(s_i_that.div_).one('mouseenter' , function(){
        google.maps.event.removeListener(marker_mouseout_event);
        $(s_i_that.div_).one('mouseleave', function(){
          s_i_that.close();
        })
      });
    }

    s_i_that.open(marker, evento, content);
  });

}

smart_infowindow.prototype.open = function( marker, evento, content ) {

  var click = false

  if(evento == 'click')
    var click = true;

  this.SetContent(content);
  this.SetPosition(marker, click);
  this.SetStyles();
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
  $(this.div_).css('cursor', 'default' );
  $(this.div_).css('width', this.options.width );
  $(this.div_).find('.box').css('max-height', this.options.max_height );
  $(this.div_).show();

  s_i_that = this;
  //google.maps.event.addListener(this.options.map, 'click', function(){  $(s_i_that.div_).hide(); })
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

  // X axis radious space
  var enought_left_space = ( this.options.width/2 < left ) ? true : false;
  var enought_right_space = ( this.options.width/2 < right ) ? true : false;


  var peak_v = -1;
  var peak_h = 0;

  // decide Y position
  if( 
      this.options.allways_top == true || // hover is locked, allways up direction
      enought_top_space || // have enought space
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
  $(this.div_).find('.box').html( content );
};


//
// Public Setters
//

// @distances_array : [top, bottom]
smart_infowindow.prototype.SetMarkerDistances = function( distances_array ) {
  this.options.marker_distance = marker_distance; 
};

smart_infowindow.prototype.SetWidth = function( width ) {
  this.options.width = width;
};

smart_infowindow.prototype.SetMaxHeight = function( max_height ) {
  this.options.max_height = max_height;
};
