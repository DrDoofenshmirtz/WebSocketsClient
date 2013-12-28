(function(global, $) {    
  var log,
      eventLogger,
      defaultEventHandler,
      completeEventHandler,
      startUpload;
      
  /* Prepends a namespace prefix to the given message 
   * and logs it to the console.
   */
  log = function(message) {
    global.console.log('[fm.fileupload] ' + message);
  };
 
  /* Creates a default event handler method that just logs a message.
   */
  eventLogger = function(message) {
    return function() {
      log(message);  
    };
  };
  
  /* A default event handler to be used as a "no op" handler or as a template 
   * for the completion of an incomplete handler.
   */
  defaultEventHandler = {
    onProgress: eventLogger('onProgress'),
    onError: eventLogger('onError'),
    onAbort: eventLogger('onAbort'),
    onDone: eventLogger('onDone')
  };
  
  /* Completes the given event handler, replacing all missing methods with
   * methods from the default event handler.  
   */
  completeEventHandler = function(eventHandler) {
    eventHandler = (eventHandler || {});
    eventHandler.onProgress = (eventHandler.onProgress || 
                               defaultEventHandler.onProgress);
    eventHandler.onError = (eventHandler.onError || 
                            defaultEventHandler.onError);
    eventHandler.onAbort = (eventHandler.onAbort || 
                            defaultEventHandler.onAbort);
    eventHandler.onDone = (eventHandler.onDone || defaultEventHandler.onDone);
    
    return eventHandler;
  };

  /* Reads the given file in slices of the specified size, uploading each slice
   * through the given WebSockets channel. Sends the following events to the
   * optionally given event handler (if the corresponding slots are defined):
   *
   * onProgress(sliceIndex, sliceCount)
   * onError(error)
   * onAbort()
   * onDone()
   *
   * Returns a function that can be called to abort the upload.
   */
  startUpload = function(file, channel, sliceSize, eventHandler) {
    var fileName,
        sliceIndex,
        uploadNextSlice,
        abortUpload,
        failUpload,
        abortSlicing;
        
    if (!file) {
      $.fm.core.raise('ArgumentError', 'Missing value for "file"!');  
    }
    
    if (!channel) {
      $.fm.core.raise('ArgumentError', 'Missing value for "channel"!');  
    }
        
    eventHandler = completeEventHandler(eventHandler);
    fileName = file.name;
    sliceIndex = -1;
    
    uploadNextSlice = function(slice) {
      var close;
      
      if (!channel) {
        return;
      }
      
      if (slice.endOfFile) {
        log('Finishing upload of file "' + fileName + '"...');
        close = channel.close;
        channel = null;
        close({
          onSuccess: function(result) {
            log('Upload of file "' + fileName + '" finished.');
            eventHandler.onDone();
          },
          onFailure: function(error) {
            log('Operation failed (file: ' + fileName + ', error: ' 
                + error.message + ')!');
            eventHandler.onError(error);
          }            
        });
      } else {
        ++sliceIndex;
        
        if (sliceIndex === 0) {
          log('Starting upload of file "' + fileName + '"...');
          channel.open(fileName, slice.data, {
            onSuccess: function(result) {
              log('Upload of file "' + fileName + '" started.');
              eventHandler.onProgress(sliceIndex, slice.sliceCount);
              slice.next();                                
            },
            onFailure: function(error) {
              log('Operation failed (file: ' + fileName + ', error: ' 
                  + error.message + ')!');
              channel = null;
              eventHandler.onError(error);
            }            
          });
        } else {
          log('Uploading slice no. ' + sliceIndex + ' of file "' 
              + fileName + '"...');
          channel.write(slice.data, {
            onSuccess: function(result) {
              global.console.log('Uploaded slice no. ' + sliceIndex + 
                                 ' of file "' + fileName + '".');
              eventHandler.onProgress(sliceIndex, slice.sliceCount);
              slice.next();                                
            },
            onFailure: function(error) {
              log('Operation failed (file: ' + fileName + ', error: ' 
                  + error.message + ')!');
              channel = null;
              eventHandler.onError(error);
            }            
          });            
        }            
      }                    
    };
    
    abortUpload = function() {
      var abort;
      
      if (!channel) {
        return;
      }
      
      log('Aborting upload of file "' + fileName + '"...');
      abort = channel.abort;
      channel = null;
      abortSlicing();
      
      if (sliceIndex < 0) {
        log('Upload of file "' + fileName + '" aborted.');
        
        return;
      }
            
      abort({
        onSuccess: function(result) {
          log('Upload of file "' + fileName + '" aborted.');
          eventHandler.onAbort();
        },
        onFailure: function(error) {
          log('Operation failed (file: ' + fileName + 
              ', error: ' + error.message + ')!');
          eventHandler.onError(error);          
        }            
      });
    };
    
    failUpload = function(error) {
      var abort;
      
      if (!channel) {
        return;
      }
      
      abort = channel.abort;
      channel = null;
      
      log('Aborting upload because slicing of file failed (file: ' + 
          fileName + ', error: ' + error.message + ').');
      eventHandler.onError(error);
      abort({
        onSuccess: function() {},
        onFailure: function() {}            
      });
    };
    
    abortSlicing = $.fm.files.slice(file, {
      size: sliceSize, 
      onSlice: uploadNextSlice,
      onError: failUpload
    });
    
    return abortUpload;
  };

  $.fm.core.ns('fm.fileupload').startUpload = startUpload;  
})(this, (this.jQuery || this));

