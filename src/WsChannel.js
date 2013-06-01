(function(global, $) {
  var makeChannel = function(request) {
    var channelId,
        channel = {},
        closed = true;      
 
    var ensureChannelIsClosed = function() {
      if (!closed) {
        $.fm.core.raise('ChannelError', 'Channel is open!');
      }
    };
    
    var isOpen = function() {
      return (!closed && channelId);
    };
    
    var ensureChannelIsOpen = function() {
      if (!isOpen()) {
        $.fm.core.raise('ChannelError', 'Channel is closed!');
      }
    };

    var dissectArguments = function(args) {
      var args = Array.prototype.slice.call(args),
          responseHandler = args.pop();
            
      if (!responseHandler) {
        $.fm.core.raise('ArgumentError', 'Missing response handler!');
      }
      
      return [args, responseHandler];
    };
    
    channel.open = function() {
      var argsAndResponseHandler,
          args,
          responseHandler;
      
      ensureChannelIsClosed();
      argsAndResponseHandler = dissectArguments(arguments);
      args = argsAndResponseHandler[0];
      responseHandler = argsAndResponseHandler[1];
      args.unshift('open');
      args.push({
        onSuccess: function(result) {
          channelId = result;
          responseHandler.onSuccess(true);
        },
        onFailure: function(error) {
          closed = true;
          responseHandler.onFailure(error);  
        }  
      });
      closed = false;
      request.apply(this, args);
    };
    
    var transmitData = function(operation, args) {
      var argsAndResponseHandler,
          responseHandler;
            
      ensureChannelIsOpen();
      argsAndResponseHandler = dissectArguments(args);
      args = argsAndResponseHandler[0];
      responseHandler = argsAndResponseHandler[1];
      args.unshift(channelId);
      args.unshift(operation);
      args.push({
        onSuccess: function(result) { responseHandler.onSuccess(result); },
        onFailure: function(error) { responseHandler.onFailure(error); }  
      });
      request.apply(this, args);
    };
    
    channel.read = function() {
      transmitData('read', arguments);
    };
    
    channel.write = function() {
      transmitData('write', arguments);
    };
    
    channel.abort = function() {
      var argsAndResponseHandler,
          args,
          responseHandler;
            
      if (!isOpen()) {
        return false;
      }
            
      argsAndResponseHandler = dissectArguments(arguments);
      args = argsAndResponseHandler[0];
      responseHandler = argsAndResponseHandler[1];
      args.unshift(channelId);
      args.unshift('abort');
      args.push({
        onSuccess: function(result) { responseHandler.onSuccess(result); },
        onFailure: function(error) { responseHandler.onFailure(error); }  
      });
      closed = true;
      channelId = undefined;
      request.apply(this, args);

      return true;      
    };
    
    channel.close = function() {
      var argsAndResponseHandler,
          args,
          responseHandler;
            
      if (!isOpen()) {
        return false;
      }
            
      argsAndResponseHandler = dissectArguments(arguments);
      args = argsAndResponseHandler[0];
      responseHandler = argsAndResponseHandler[1];
      args.unshift(channelId);
      args.unshift('close');
      args.push({
        onSuccess: function(result) { responseHandler.onSuccess(result); },
        onFailure: function(error) { responseHandler.onFailure(error); }  
      });
      closed = true;
      channelId = undefined;
      request.apply(this, args);
      
      return true;
    };
    
    return channel;
  };
  
  $.fm.core.ns('fm.ws').makeChannel = makeChannel;
})(this, (this.jQuery || this));

