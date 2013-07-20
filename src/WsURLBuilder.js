(function(global, $) {
  
  var buildServiceURL = function(spec) {
    var host = (spec.host || 'localhost').toString(),
        port = (spec.port || 40) * 1,
        serviceName = (spec.serviceName || '').toString(),
        serviceURL = host + ':' + port; 
        
    if (serviceName.length > 0) {
      serviceURL = serviceURL + '/' + serviceName;
    }
    
    return serviceURL;
  };
 
  var buildQueryString = function(args) {
    var queryString = '',
        argName,
        argValue;
 
    if (args == null) {
      return queryString;
    }
    
    for (var entry in Iterator(args)) {
      argName = (entry[0] || '').toString();
      
      if (argName.length > 0) {
        argValue = (entry[1] || '').toString();
        
        if (argValue.length > 0) {
          if (queryString.length > 0) {
            queryString += '&';
          }
          
          queryString = 
            queryString + 
            global.encodeURIComponent(argName) + 
            '=' +
            global.encodeURIComponent(argValue);
        }
      }
    }
    
    if (queryString.length > 0) {
      queryString = '?' + queryString;
    }
    
    return queryString;
  };
  
  $.fm.core.ns('fm.ws').buildURL = function(spec) {
    
    // If the spec is a non-empty string, it'll be taken as the WebSocket url.
    if ((typeof spec === 'string') || (spec instanceof String)) {
      if (spec.length <= 0) {
        $.fm.core.raise('ArgumentError', 'Empty service url!');  
      }
      
      return spec;
    }
    
    // Use an empty object as default if the given spec is falsy.
    spec = (spec || {});
    
    return 'ws://' + buildServiceURL(spec) + buildQueryString(spec.args);                 
  };
})(this, (this.jQuery || this));

