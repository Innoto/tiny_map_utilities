

function smart_infowindow(opts) {

  s_i_that = this;
  this.prototype = new google.maps.OverlayView();
  this.prototype.constructor = this;
  this.options = new Object({
    map : false,

  });
  $.extend(true, this.options, opts);



  // init
  google.maps.event.addListenerOnce(this.options.map, 'idle', function( ){
    s_i_that.setMap(this.options.map);
    s_i_that.create_infowindow();
  });


  this.create_infowindow = function() {

    var panes = this.getPanes();

    this.infowindow = document.createElement('div');
    panes.overlayLayer.appendChild(this.infowindow);
  }

  this.open = function( marker ) {

    var overlayProjection = this.getProjection();

    var point = overlayProjection.fromLatLngToDivPixel(marker);

    $(this.infowindow).css('display' , 'true');
    $(this.infowindow).css('position' , 'absolute');
    $(this.infowindow).css('left', point.x + 'px');
    $(this.infowindow).css('top', point.y + 'px');
    $(this.infowindow).css('width', '100px';
    $(this.infowindow).css('height', '100px' ); 

  }

  this.close = function() {
    $(this.infowindow).css('display' , 'none');
  }


}