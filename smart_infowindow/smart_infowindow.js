
var overlay;
smart_infowindow.prototype = new google.maps.OverlayView();


/** @constructor */
function smart_infowindow(opts) {

  this.options = new Object({
    map : false,
  });
  $.extend(true, this.options, opts);

  this.div_ = null;
  this.setMap(this.options.map);
}


smart_infowindow.prototype.onAdd = function() {

  var div = document.createElement('div');
  div.style.borderStyle = 'none';
  div.style.borderWidth = '0px';
  div.style.position = 'absolute';

  $(div).html("<div style='background-color:white;'>ola mundo</div>");

  this.div_ = div;

  // Add the element to the "overlayLayer" pane.
  var panes = this.getPanes();
  panes.overlayLayer.appendChild(div);

  var overlayProjection = this.getProjection();

  var div = this.div_;
  div.style.left = 15 + 'px';
  div.style.top = 200 + 'px';
};

smart_infowindow.prototype.draw = function() {
};



