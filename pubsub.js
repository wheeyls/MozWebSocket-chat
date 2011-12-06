/**
 * Bare-bones, fast publish/subscribe
 **/
(function(exports) {
  var pubsub = function(subject) {
    var me = {};
    subject = subject || {};
    me.functions = {};
    me.sub = function(topic, callback, u_id) {
      if(!me.functions[topic]) {
        me.functions[topic] = [];
      }
      me.functions[topic].push({callback: callback, u_id: u_id});
    };
    me.pub = function(topic, args) {
      var i, ii, funcs = me.functions[topic];

      if(!funcs) {return;}

      for(i = 0, ii = funcs.length; i<ii; i++) {
        funcs[i].callback.apply(me, args || []);
      }
    };
    me.clear = function(topic, id) {
      var i, funcs = me.functions[topic];
      if(!topic && !id) { 
        me.functions = {};
        return;
      } 
      
      // deal with case where user passes undefined as topic
      if(!topic){return;}

      if(!id || !funcs) {
        me.functions[topic] = [];
        return;
      }

      for(i in funcs) { if(funcs.hasOwnProperty(i)){
        if(id === funcs[i].u_id) {
          me.functions[topic].splice(i, 1);
          return;
        }
      }}
    };
    me.each = function(topic, callback) {
      var tops = me.functions[topic] || [];

      tops.forEach(callback);
    };

    subject.pub = me.pub;
    subject.sub = me.sub;
    subject.clear = me.clear;


    return me;
  };
  exports.pubsub = pubsub;
}(typeof exports !== undefined ? exports : window));
