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
      var argsAndRequestHandler,
          args,
          requestHandler;
      
      ensureChannelIsClosed();
      argsAndRequestHandler = dissectArguments(arguments);
      args = argsAndRequestHandler[0];
      requestHandler = argsAndRequestHandler[1];
      args.unshift('open');
      args.push({
        onSuccess: function(result) {
          channelId = result;
          requestHandler.onSuccess(true);
        },
        onFailure: function(error) {
          closed = true;
          requestHandler.onFailure(error);  
        }  
      });
      closed = false;
      request.apply(this, args);
    };
    
    channel.read = function() {
      var argsAndRequestHandler,
          args,
          requestHandler;
            
      ensureChannelIsOpen();
      argsAndRequestHandler = dissectArguments(arguments);
      args = argsAndRequestHandler[0];
      requestHandler = argsAndRequestHandler[1];
      args.unshift(channelId);
      args.unshift('read');
      args.push({
        onSuccess: function(result) { requestHandler.onSuccess(result); },
        onFailure: function(error) { requestHandler.onFailure(error); }  
      });
      request.apply(this, args);
    };
    
    channel.write = function() {
      var argsAndRequestHandler,
          args,
          requestHandler;
            
      ensureChannelIsOpen();
      argsAndRequestHandler = dissectArguments(arguments);
      args = argsAndRequestHandler[0];
      requestHandler = argsAndRequestHandler[1];
      args.unshift(channelId);
      args.unshift('write');
      args.push({
        onSuccess: function(result) { requestHandler.onSuccess(result); },
        onFailure: function(error) { requestHandler.onFailure(error); }  
      });
      request.apply(this, args);
    };
    
    channel.abort = function() {
      var argsAndRequestHandler,
          args,
          requestHandler;
            
      if (!isOpen()) {
        return;
      }
            
      argsAndRequestHandler = dissectArguments(arguments);
      args = argsAndRequestHandler[0];
      requestHandler = argsAndRequestHandler[1];
      args.unshift(channelId);
      args.unshift('abort');
      args.push({
        onSuccess: function(result) { requestHandler.onSuccess(result); },
        onFailure: function(error) { requestHandler.onFailure(error); }  
      });
      closed = true;
      channelId = undefined;
      request.apply(this, args);      
    };
    
    channel.close = function() {
      var argsAndRequestHandler,
          args,
          requestHandler;
            
      if (!isOpen()) {
        return;
      }
            
      argsAndRequestHandler = dissectArguments(arguments);
      args = argsAndRequestHandler[0];
      requestHandler = argsAndRequestHandler[1];
      args.shift(channelId);
      args.shift('close');
      args.push({
        onSuccess: function(result) { requestHandler.onSuccess(result); },
        onFailure: function(error) { requestHandler.onFailure(error); }  
      });
      closed = true;
      channelId = undefined;
      request.apply(this, args);
    };
    
    return channel;
  };
  
  $.fm.core.ns('fm.ws').makeChannel = makeChannel;
})(this, (this.jQuery || this));

