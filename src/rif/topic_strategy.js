define(['rif/fuzzy'], function(RifFuzzy) {
    "use strict";
    var strategy = { };

    strategy.mergeTopicsInto = function(topic, new_topics) {
        for (var i = 0; i < new_topics.length; ++i) {
            var new_topic = new_topics[i];
            if (new_topic.keyword === topic.keyword) {
                topic.weight = Math.max(new_topic.weight, topic.weight);
                new_topics.splice(i, 1);
                return;
            }
        }
    };

    strategy.mergeTopics = function(a, b, scale) {
        scale = scale || 1.0;
        var merged = a.slice();
        $.each(b, function(index, value) {
            var keyword = value.keyword;
            var i = 0;
            var scaled_weight = value.weight*scale;
            var new_topic = { keyword: keyword, weight: scaled_weight};
            for (; i < merged.length; ++i) {
                if (merged[i].keyword === keyword) {
                    if (merged[i].weight < scaled_weight) {
                        merged[i] = new_topic;
                    }
                    break;
                }
            }
            if (i === merged.length) {
                merged.push(new_topic);
            }
        });
        return merged;
    };

    strategy.mergeCurrentTopics = function(called, current) {
        return this.mergeTopics(called, current);
    };

    strategy.decayTopics = function(topics) {
        var new_topics = [];
        $.each(topics, function(index, topic) {
            var new_topic = $.extend({}, topic);
            new_topic.weight = RifFuzzy.adjust(new_topic.weight, 0, 0.2);
            new_topics.push(new_topic);
        });
        return new_topics;
    };
    return strategy;
});
