
var overlay;
smart_infowindow.prototype = new google.maps.OverlayView();


/** @constructor */
function smart_infowindow(opts) {

  this.options = new Object({
    map : false,

    background_color: '#fff',
    peak_image: false,
    max_height: 400,
    width: 300,
    allways_top: false, // when hover is locked, allways up direction
    marker_distance: [41,0] // [top, bottom]
  });
  $.extend(true, this.options, opts);

  this.div_ = false;
  this.setMap(this.options.map);
}


smart_infowindow.prototype.onAdd = function() {

  var div = document.createElement('div');
  $(div).css('display' , 'none');
  $(div).css('position' , 'absolute');

  this.div_ = div;

  // Add the element to the "overlayLayer" pane.
  var panes = this.getPanes();
  panes.overlayLayer.appendChild(this.div_);

};

smart_infowindow.prototype.draw = function() {
};


// hovers and clicks

smart_infowindow.prototype.openHover = function( marker, content ) {
  this.SetContent(content);
  this.SetPosition(marker, false);
  this.SetStyles();
};

smart_infowindow.prototype.openClick = function( marker, content ) {
  this.SetContent(content);
  this.SetPosition(marker, true);
  this.SetStyles();
};


//
// Private Setters
//
smart_infowindow.prototype.SetStyles = function() {
  $(this.div_).css('box-shadow', '0px 0px 10px #888' );
  $(this.div_).css('background-color', this.options.background_color );
  $(this.div_).css('width', this.options.width );
  $(this.div_).css('max-height', this.options.max_height );

  $(this.div_).show();

  s_i_that = this;
  google.maps.event.addListener(this.options.map, 'click', function(){  $(s_i_that.div_).hide(); })
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

  console.debug(
      //x_max+ ','+ y_max+' _ '+ x_min + ',' + y_min
      'esquerda:' + left + ',' +
      'dereita:' + right + ',' +
      'arriba:' + top + ',' +
      'abaixo:' + bottom + ','
    );

  // Y axis radious space
  var enought_top_space = ( ($(this.div_).height() + this.options.marker_distance[0]) < top ) ? true : false;
//  var enought_bottom_space = ( ($(this.div_).height() + this.options.marker_distance[1]) < bottom  ) ? true : false;

  // X axis radious space
  var enought_right_space = ( this.options.width < left ) ? true : false;
  var enought_left_space = ( this.options.width < right ) ? true : false;


  // decide Y position
  if( 
      this.options.allways_top == true || // hover is locked, allways up direction
      enought_top_space || // have enought space
      click_ev == true  // is a click event

  ){
    var final_peak_point_y = canvas_marker_point.y - $(this.div_).height() - this.options.marker_distance[0];
  }
  else {
    var final_peak_point_y = canvas_marker_point.y + this.options.marker_distance[1] ;
  }

  // decide X position
  if( 
    enought_left_space && enought_right_space
  ){
    console.debug("medio")
    var final_peak_point_x = canvas_marker_point.x - this.options.width/2 ;
  }
  else
  if(enought_right_space && !enought_left_space)
  {
    var final_peak_point_x = canvas_marker_point.x - this.options.width;
  }
  else
  {
    var final_peak_point_x = canvas_marker_point.x ;
  }



  // center map when is a click event
  if(click_ev == true) {
    if(!enought_top_space) {
      this.options.map.setCenter( 
        overlayProjection.fromContainerPixelToLatLng(
          new google.maps.Point(
            overlayProjection.fromLatLngToDivPixel( marker.getPosition() ).x, 
            overlayProjection.fromLatLngToDivPixel( marker.getPosition() ).y - $(this.div_).height()
          )
        )
      );
    }
  }

  // final infowindow position
  this.div_.style.top = final_peak_point_y + 'px';
  this.div_.style.left = final_peak_point_x + 'px';

};

smart_infowindow.prototype.SetContent = function(content) {
  $(this.div_).html(content);
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
