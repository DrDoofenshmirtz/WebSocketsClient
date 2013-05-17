(function(global, $) {
  var makeChannel = function(request) {
    var channelId;      
 
    var open = function() {
    };
    
    var read = function() {
    };
    
    var write = function() {
    };
    
    var abort = function() {
    };
    
    var close = function() {
    };
    
    return {open: open, read: read, write: write, abort: abort, close: close};
  };
  
  $.fm.core.ns('fm.ws').makeChannel = makeChannel;
})(this, (this.jQuery || this));

