(function(global) {
    var raise = function(errorType, message) {
      var errorToString = errorType + ': ' + message;
      
      throw {
        errorType: errorType,
        message: message,
        toString: function() { 
          return errorToString; 
        }
      };
    };    
    var namespace = function(path) {
      path = (path || '').toString();
      
      if (path.length <= 0) {
        raise('ArgumentError', 'Namespace path must be a non-empty string!');        
      }
      
      var createNamespace = function(parent, elements) {
        if (elements.length <= 0) {
          return parent;
        }
        
        var next = elements.shift(),
            child = parent[next];
        
        if (child) {
          if (typeof child !== 'object') {
            raise('NamespaceError', 'Namespace exists and is not an object!');              
          }
        } else {
          child = {};
          parent[next] = child;
        }
        
        return createNamespace(child, elements);
      };
      
      return createNamespace(global, path.split(/\s*\.\s*/));            
    };
    
    namespace('fm.core').namespace = namespace;
    namespace('fm.core').raise = raise;
})(this);

