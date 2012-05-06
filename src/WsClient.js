(function(global) {
  var connection;
  
  var element = function(id) {
    return global.document.getElementById(id);
  };
  var accessorFor = function(elementId) {
    return function() {
      return element(elementId);
    };
  };
  var page = {
      connectButton: accessorFor('connect_button'),
      uploadButton: accessorFor('upload_file_button'),
      console: accessorFor('console'),
      selectedFile: function() { return element('selected_file').files[0]; }
  };
  var logMessage = function(text) {
    var currentText = page.console().value;
    
    if (currentText.length > 0) {
      currentText = currentText + '\n';
    }
    
    page.console().value = currentText + text;
  };
  var clearLog = function() {
    page.console().value = '';
  }; 
  var messageQueue = (function() {
    var messages = [];
    var taskId;
    
    var sendPendingMessages = function() {
      if (taskId && (messages.length <= 0)) {
        logMessage('Message Queue is empty.');
        global.clearInterval(taskId);
        taskId = undefined;
      } else if (connection.bufferedAmount <= 0) {
        logMessage('Sending next Message...');             
        connection.send(messages.shift());  
      }   
    };
    var appendMessage = function(message) {                        
      if (messages.push(message) === 1) {
        taskId = global.setInterval(sendPendingMessages, 15);
      }
    };
    
    return {
      send: function(message) { 
        appendMessage(message); 
      }, 
      reset: function() { 
        messageQueue.length = 0;
        
        if (taskId) {
          global.clearInterval(taskId);
          taskId = undefined;  
        } 
      }
    };
  })();
  var connect = function() {
    if (connection) {
      return;
    }
    
    page.connectButton().setAttribute('disabled', true);
    connection = new WebSocket("ws://perry:17500/ws-server");          
    connection.onopen = function(e) {
      page.connectButton().removeAttribute('disabled');
      page.connectButton().innerHTML = 'Disconnect from Server';
      logMessage('Connection to WebSockets Server established.');             
    };          
    connection.onclose = function(e) {
      page.connectButton().removeAttribute('disabled');
      page.connectButton().innerHTML = 'Connect to Server';
      logMessage('Connection to WebSockets Server closed.'); 
      connection = undefined; 
    };           
    connection.onmessage = function(e) {
      logMessage('--- Message from WebSockets Server:');
      logMessage(e.data);                              
    };
    connection.onerror = function(error) {
      logMessage('*** CONNECTION ERROR ***');                 
    };
  };
  var disconnect = function() {
    if (!connection) {
      return;
    }
    
    page.connectButton().setAttribute('disabled', true);
    logMessage("Waiting for Connection to be closed...");
    connection.close();
    connection = undefined;
  };        
  var uploadFile = function() {
    if (!connection) {
      logMessage('Cannot upload File. No Connection established!');
      
      return;
    }
  
    var file = page.selectedFile();
    
    if (!file) {
      logMessage('No File selected.');
    
      return;
    }
    
    messageQueue.send('-- START --');
    messageQueue.send(file);
    messageQueue.send('-- END --');                    
  };
  
  global.onload = function() {
    clearLog(); 
    page.connectButton().onclick = function() {                    
      if (!connection) {
        connect();
      } else {
        disconnect();
      }
    };
    page.uploadButton().onclick = function() {
      uploadFile();  
    };
  };
})(this);
