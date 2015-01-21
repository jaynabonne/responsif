var RifWorld = (function() {
    "use strict";
    var RifWorld = function() {
        this.values = {};
    };

    var proto = RifWorld.prototype;
    proto.getValue = function(id) {
        return this.values[id];
    };
    proto.setValue = function(id, value) {
        this.values[id] = value;
    };

    return RifWorld;
})();