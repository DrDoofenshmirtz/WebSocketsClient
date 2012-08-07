(function(global, $) {
  var makeClient = function(host, port, serviceName, connectionHandler) {
    var client = {},
        responseHandlers = {},
        closed = true,
        connectionId,
        connection = $.fm.ws.makeConnection(host, port, serviceName, {
          onError: function(error) {
            if (!closed) {
              handleError(error);
            }
          },
          onConnectionOpened: function() {
            if (!closed) {
              handleConnectionOpened();
            }
          },
          onMessageSent: function(message) {          
            // TODO: how to utilize this? May be obsolete!
          },
          onMessageReceived: function(message) {
            if (!closed) {
              handleMessageReceived(message);
            }                       
          },
          onConnectionClosed: function() {
            if (!closed) {
              handleConnectionClosed();
            }
          }        
        });
        
    var Receiver = function(receiver) {
      this.receive = function() {
        if (!closed) {
          receiver.apply(client, arguments);
        }
      };
    };
       
    var resetResponseHandlers = function() {
      var handlers = responseHandlers;
      
      responseHandlers = {};
      
      return handlers;
    };
    
    var disposeResponseHandlers = function(responseHandlers) {
      for each (var handler in responseHandlers) {
        if (handler.dispose) {
          try { 
            handler.dispose(); 
          } catch (ignored) {}                    
        }
      }
    };
       
    var handleError = function(error) {
      disposeResponseHandlers(resetResponseHandlers());      
      connectionHandler.onError(error);
    };    
    
    var handleConnectionOpened = function() {
      connectionId = undefined;
      disposeResponseHandlers(resetResponseHandlers());
    };
        
    var handleMessageReceived = function(message) {
      var responseData;
            
      message = (message || '').toString();

      if (message.length < 1) {
        return;
      }

      try { 
        responseData = JSON.parse(message); 
      } catch (ignored) { 
        return; 
      }
                        
      if (responseData.id) {
        handleResponse(responseData);        
      } else {
        handleNotification(responseData);
      }      
    };
    
    var handleNotification = function(notification) {
      var receiver = client[notification.method];
      
      if (receiver instanceof Receiver) {
        receiver.receive(notification.params);
      }            
    };
    
    var handleResponse = function(response) {
      var responseHandler = responseHandlers[response.id];
      
      delete responseHandlers[response.id];

      if (!responseHandler) {
        return;
      }

      if (response.result) {
        responseHandler.onSuccess(response.result);
      } else if (response.error) {
        responseHandler.onFailure(response.error);
      }
    };
    
    var handleConnectionClosed = function() {
      connectionId = undefined;
      disposeResponseHandlers(resetResponseHandlers());
      connectionHandler.onClose();
    };
                            
    client.open = function() {
      if (!closed) {
        return;
      }
            
      closed = false;
      connectionId = undefined;
      connection.open();            
    };
    
    client.close = function() {
      var responseHandlers;
      
      if (closed) {
        return;
      }
      
      closed = true;
      connectionId = undefined;
      responseHandlers = resetResponseHandlers();      
                       
      try {
        connection.close();
      } catch (ignored) {}
      
      disposeResponseHandlers(responseHandlers);
      connectionHandler.onClose();
    };
    
    var validateSlotName = function(name) {
      name = (name || '').toString();
      
      if (name.length < 1) {
        $.fm.core.raise('ArgumentError', 'Invalid request name!');
      }
      
      return name;
    };
    
    var ensureIsConnected = function() {
      if (closed || !connectionId) {
        $.fm.core.raise('ConnectionError', 'Client is disconnected!');
      }
    };
    
    var nextRequestId = (function() {
      var requestId = 0;
      
      return function() {
        var nextId = requestId.toString();
        
        requestId = requestId + 1;
        
        return nextId;
      };
    })();
        
    client.defRequest = function(name) {
      this[validateSlotName(name)] = function() {
        ensureIsConnected();
        
        var args = Array.prototype.slice.call(arguments),
            responseHandler = args.pop(),
            requestId = connectionId + '.' + nextRequestId(),
            requestData = {id: requestId, method: name, params: args};
            
        if (!responseHandler) {
          $.fm.core.raise('ArgumentError', 'Missing response handler!');
        }
        
        requestData = JSON.stringify(requestData);
        responseHandlers[requestId] = responseHandler;
        connection.send(requestData);        
      };      
    };
    
    client.defNotification = function(name) {
      this[validateSlotName(name)] = function() {
        ensureIsConnected();
        
        var args = Array.prototype.slice.call(arguments),
            requestData = {id: null, method: name, params: args};
            
        requestData = JSON.stringify(requestData);        
        connection.send(requestData);        
      };     
    };
    
    client.defReceiver = function(name, receiver) {      
      if (!receiver) {
        $.fm.core.raise('ArgumentError', 'Missing receiver!');
      }
      
      name = validateSlotName(name);
      
      if (name === 'connectionAcknowledged') {
        $.fm.core.raise('ArgumentError', 'Illegal name for receiver slot!');
      }
      
      this[name] = new Receiver(receiver);  
    };
    
    client.connectionAcknowledged = new Receiver(function(id) {
      connectionId = id;
      connectionHandler.onOpen();
    });
        
    return client;                
  };
  
  $.fm.core.ns('fm.ws').makeClient = makeClient;
})(this, (this.jQuery || this));
