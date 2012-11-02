(function(global, $) {  
  var defaultOnSlice = function(slice) {
    if (slice.endOfFile) {
      global.console.log('EOF');
    } else {
      global.console.log('onSlice: ' + slice.data);      
      slice.next();
    }        
  };  
  var defaultOnError = function(error) {
    global.console.log('onError: ' + error);
  };      
  var slice = function(file, options) {
    options = options || {};
    
    var onSlice = (options.onSlice || defaultOnSlice),
        onError = (options.onError || defaultOnError),
        fileSize, size, reader, position;

    try {
      fileSize = file.size;
    } catch (fileReadError) {
      onError($.fm.core.makeError('FileReadError', 'Reading of file failed!'));
      
      return;
    }
    
    size = (options.size || fileSize),        
    reader = new FileReader(),
    position = 0;
                    
    var readNextSlice = function() {
      var start = position;
      
      if (start >= fileSize) {
        onSlice({endOfFile: true});
      } else {
        position = Math.min(start + size, fileSize);
        
        try {
          reader.readAsBinaryString(file.slice(start, position));
        } catch (fileReadError) {
          position = start;
          onError($.fm.core.makeError(
            'FileReadError', 
            'Reading of file failed!'));     
        }                        
      }
    };
    var toByteArray = function(string) {
      string = (string || '').toString();
      
      var byteArray = [],
          length = string.length;
      
      for (var i = 0; i < length; ++i) {
        byteArray.push(string.charCodeAt(i));
      }
      
      return byteArray;
    };
    
    reader.onloadend = function(event) {
      if (event.target.readyState == FileReader.DONE) {        
        onSlice({data: toByteArray(event.target.result), next: readNextSlice});                       
      }
    };
    reader.onerror = function(event) {
      var errorMessage;
      
      switch(event.target.error.code) {
        case event.target.error.NOT_FOUND_ERR:
          errorMessage = 'File not found!';
          
          break;
        case event.target.error.NOT_READABLE_ERR:
          errorMessage = 'File is not readable!';
          
          break;
        case event.target.error.ABORT_ERR:
          errorMessage = 'Reading of file has been aborted!';
                    
          break;
        default:
          errorMessage = 'Reading of file failed for an unknown reason!';
          
          break;
      }
      
      onError($.fm.core.makeError('FileReadError', errorMessage));      
    };    
    readNextSlice();
  };
  
  $.fm.core.ns('fm.files').slice = slice;
})(this, (this.jQuery || this));
