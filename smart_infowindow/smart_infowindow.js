
var overlay;
smart_infowindow.prototype = new google.maps.OverlayView();


/** @constructor */
function smart_infowindow(opts) {

  this.options = new Object({
    map : false,
    max_height: 200,
    width: 100,
    lock_on_hover: false,
    distance_on_click: [],
    distance_on_hover: []
  });
  $.extend(true, this.options, opts);

  this.div_ = null;
  this.setMap(this.options.map);
}


smart_infowindow.prototype.onAdd = function() {

  var div = document.createElement('div');
  div.style.borderStyle = 'none';
  div.style.display = 'none';
  div.style.borderWidth = '0px';
  div.style.position = 'absolute';

  $(div).html("<div style='background-color:white;box-shadow: 0px 0px 10px #888;'>ola mundo</div>");

  this.div_ = div;

  // Add the element to the "overlayLayer" pane.
  var panes = this.getPanes();
  panes.overlayLayer.appendChild(this.div_);

};

smart_infowindow.prototype.draw = function() {
};


// hovers and clicks

smart_infowindow.prototype.openHover = function( marker ) {
  var overlayProjection = this.getProjection();
  var canvas_point = overlayProjection.fromLatLngToDivPixel( marker.getPosition() );
  this.div_.style.left = canvas_point.x + 'px';
  this.div_.style.top = canvas_point.y + 'px';
  $(this.div_).show();
};

smart_infowindow.prototype.openClick = function( marker ) {
  this.options.map.setCenter(marker.getPosition());
  var overlayProjection = this.getProjection();
  var canvas_point = overlayProjection.fromLatLngToDivPixel( marker.getPosition() );
  this.div_.style.left = canvas_point.x + 'px';
  this.div_.style.top = canvas_point.y + 'px';
  $(this.div_).show();
};

//
// Setters
//

smart_infowindow.prototype.SetDistanceOnClick = function( distances_array ) {
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
