function InvokeRecharge() {
    //For Web
    window.parent.postMessage(JSON.stringify({ jumpType: 'RECHARGE' }), '*');
    if (window.jsBridge) {
      //For Android
      window.jsBridge.triggerFunction(JSON.stringify({ jumpType: 'RECHARGE' }));
    } else if (window.webkit) {
      //For iOS
      window.webkit.messageHandlers.dictionaryFunction.postMessage({ jumpType: 'RECHARGE' });
    } else {
      console.error('The jsBridge and webkitMessageHandlers interface is not available.');
    }
  }
