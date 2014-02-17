
var overlay;
smart_infowindow.prototype = new google.maps.OverlayView();


/** @constructor */
function smart_infowindow(opts) {

  this.options = new Object({
    map : false,

    background_color: '#fff',
    peak_image: false,
    max_height: 200,
    width: 100,
    lock_on_hover: true, // when hover is locked, allways up direction
    distance_on_click: 5,
    distance_on_hover: [5,5]
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
  var up = Math.abs(y_max - canvas_marker_point.y);
  var down = Math.abs(canvas_marker_point.y - y_min);

  console.debug(
      //x_max+ ','+ y_max+' _ '+ x_min + ',' + y_min
      'esquerda:' + left + ',' +
      'dereita:' + right + ',' +
      'arriba:' + up + ',' +
      'abaixo:' + down + ','
    );

  // Y axis radious space
  var enought_top_space = ( true ) ? true : false;
  var enought_bottom_space = ( true ) ? true : false;

  // X axis radious space
  var enought_right_space = ( true ) ? true : false;
  var enought_left_space = ( true ) ? true : false;


  // decide Y position
  if( 
      this.options.lock_on_hover == true || // hover is locked, allways up direction
      click_ev == true || // is a click event
      enought_top_space
  ){

  }
  else
  if(
      enought_bottom_space
  ){

  }

  // decide X position



  // center map when is a click event
  if(click_ev == true) {
      this.options.map.setCenter( marker.getPosition() );
  }


  this.div_.style.top = ( canvas_marker_point.y - $(this.div_).height() ) + 'px';
  this.div_.style.left = ( canvas_marker_point.x - this.options.width/2 ) + 'px';

};

smart_infowindow.prototype.SetContent = function(content) {
  $(this.div_).html(content);
};


//
// Public Setters
//

smart_infowindow.prototype.SetDistanceOnClick = function( distances ) {
  this.options.distance_on_click = distances_array; 
};

smart_infowindow.prototype.SetDistanceOnHover = function( distances_array ) {
  this.options.distance_on_hover = distances_array;
};

smart_infowindow.prototype.SetWidth = function( width ) {
  this.options.width = width;
};

smart_infowindow.prototype.SetMaxHeight = function( max_height ) {
  this.options.max_height = max_height;
};
