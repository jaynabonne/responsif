define(['rif/response_processor'], function(RifResponseProcessor) {
    var interact;
    var world;
    var story_text;
    var processor;
    beforeEach(function() {
        interact  = {};
        world = {
            getResponseRuns: function(id) {
                return 0;
            },
            setResponseRuns: jasmine.createSpy('setResponseRuns'),
            addTopics: jasmine.createSpy('addTopics')
        };
        story_text = {};
        processor = new RifResponseProcessor('caller', interact, [], world, story_text);
    });
    describe('run count management', function() {
        it('loads the run count if not yet set', function() {
            world.getResponseRuns = function(id) {
                return 3;
            };
            var response = {id:1};
            processor.processResponse(response, 'responder');
            expect(response.run).toBe(4);
        });
        it('increments and saves the run count each time it is run', function() {
            var response = {id:101};

            processor.processResponse(response, 'responder');
            expect(response.run).toBe(1);
            expect(world.setResponseRuns).toHaveBeenCalledWith(101, 1);

            processor.processResponse(response, 'responder');
            expect(response.run).toBe(2);
            expect(world.setResponseRuns).toHaveBeenCalledWith(101, 2);

            processor.processResponse(response, 'responder');
            expect(response.run).toBe(3);
            expect(world.setResponseRuns).toHaveBeenCalledWith(101, 3);

        });
    });
    describe("says", function () {
        beforeEach(function() {
            story_text.say = jasmine.createSpy("say");
        });
        it("text for a matching response", function () {
            var response = {
                does: {common: [{says: {text: "Hello world!"}}]}
            };
            processor.processResponse(response, 'responder');
            expect(story_text.say).toHaveBeenCalledWith({text: "Hello world!"}, "responder", 'caller');
        });
        it("no text for no matching responses", function() {
            processor.processResponse([], 'responder');
            expect(story_text.say).not.toHaveBeenCalled();
        });
        it("text for all matching responses", function() {
            var response1 = { does: { common: [ {says: { text: "Hello world!"} } ] } };
            var response2 = { does: { common: [ {says: { text: "Goodnight moon!"} } ] } };
            processor.processResponse(response1, 'responder');
            processor.processResponse(response2, 'responder');
            expect(story_text.say.calls.count()).toEqual(2);
            expect(story_text.say.calls.all()[0].args).toEqual([{ text: "Hello world!" }, 'responder', 'caller']);
            expect(story_text.say.calls.all()[1].args).toEqual([{ text: "Goodnight moon!" }, 'responder', 'caller']);
        });
        it("text only for matching responses that have text", function() {
            var response1 = { };
            var response2 = { does: { common: [ {says: { text: "See ya later!"} } ] } };
            processor.processResponse(response1, 'responder');
            processor.processResponse(response2, 'responder');
            expect(story_text.say.calls.count()).toEqual(1);
            expect(story_text.say.calls.all()[0].args).toEqual([{ text: "See ya later!" }, 'responder', 'caller']);
        });
        it("text in proper sequence", function() {
            var response = {
                does: {
                    common: [ {says: { text: "See ya later!"} } ],
                    1: [ {says: { text: "Hello world!"} } ],
                    3: [ {says: { text: "I'm going"} } ]
                }
            };
            processor.processResponse(response, 'responder');
            processor.processResponse(response, 'responder');
            processor.processResponse(response, 'responder');
            processor.processResponse(response, 'responder');
            expect(story_text.say.calls.all()[0].args).toEqual([{ text: "Hello world!"}, 'responder', 'caller']);
            expect(story_text.say.calls.all()[1].args).toEqual([{ text: "See ya later!"}, 'responder', 'caller']);
            expect(story_text.say.calls.all()[2].args).toEqual([{ text: "I'm going"}, 'responder', 'caller']);
            expect(story_text.say.calls.all()[3].args).toEqual([{ text: "See ya later!"}, 'responder', 'caller']);
        });
    });
    describe("sets", function() {
        beforeEach(function() {
            world.setState = jasmine.createSpy("setState");
        });
        it("sets state for a single id with 'sets' attribute", function () {
            var response = { does: { common: [ { sets: {expression:"somestate" } } ] } };
            processor.processResponse(response);
            expect(world.setState).toHaveBeenCalledWith({expression:"somestate"}, "");
        });
        it("includes the responder if passed", function () {
            var response = { does: { common: [ { sets: {expression: ":somestate"} } ] } };
            processor.processResponse(response, 'aresponder');
            expect(world.setState).toHaveBeenCalledWith({expression: ":somestate"}, "aresponder");
        });
    });
    describe("uses all", function() {
        it("processes all the eligible child responses", function() {
            story_text.say = jasmine.createSpy("say");
            world.getState = function(id) { return  false;};
            var response1 = { does: { common: [ { says: {text: "Text 1"} } ] } };
            var response2 = { needs: "somestate", does: { common: [ { says: {text: "Text 2"} } ] } };
            var response3 = { does: { common: [ { says: {text: "Text 3"} } ] } };
            var response = {
                does: {
                    common: [ {
                        uses: {
                            all: [
                                response1,
                                response2,
                                response3
                            ]
                        }
                    } ]
                }
            };
            processor.processResponse(response, 'responder');
            expect(story_text.say.calls.count()).toEqual(2);
            expect(story_text.say.calls.all()[0].args).toEqual([{ text: "Text 1" }, 'responder', 'caller']);
            expect(story_text.say.calls.all()[1].args).toEqual([{ text: "Text 3" }, 'responder', 'caller']);
        });
    });
    describe("uses first", function() {
        it("processes up to the first eligible child responses", function() {
            story_text.say = jasmine.createSpy("say");
            world.getState = function(id) { return  false;};
            var response1 = { needs: "somestate", does: { common: [ { says: {text: "Text 1"} } ] } };
            var response2 = { does: { common: [ { says: {text: "Text 2"} } ] } };
            var response3 = { does: { common: [ { says: {text: "Text 3"} } ] } };
            var response = {
                does: {
                    common: [ {
                        uses: {
                            first: [
                                response1,
                                response2,
                                response3
                            ]
                        }
                    } ]
                }
            };
            processor.processResponse(response, 'responder');
            expect(story_text.say.calls.count()).toEqual(1);
            expect(story_text.say.calls.all()[0].args).toEqual([{ text: "Text 2" }, 'responder', 'caller']);
        });
        it('uses topics to determine child eligibility', function() {
            processor = new RifResponseProcessor('caller', interact, [{keyword: 'bar'}], world, story_text);
            story_text.say = jasmine.createSpy("say");
            world.getState = function(id) { return  false;};
            var response1 = { matches: [{keyword:'foo'}], does: { common: [ { says: {text: "Text 1"} } ] } };
            var response2 = { matches: [{keyword: 'bar'}], does: { common: [ { says: {text: "Text 2"} } ] } };
            var response3 = { does: { common: [ { says: {text: "Text 3"} } ] } };
            var response = {
                does: {
                    common: [ {
                        uses: {
                            first: [
                                response1,
                                response2,
                                response3
                            ]
                        }
                    } ]
                }
            };
            processor.processResponse(response, 'responder');
            expect(story_text.say.calls.count()).toEqual(1);
            expect(story_text.say.calls.all()[0].args).toEqual([{ text: "Text 2" }, 'responder', 'caller']);
        });
    });
    describe("uses random", function() {
        var response1, response2, response3;

        function getResponseForResponses(responses) {
            return {
                does: {
                    common: [{
                        uses: {
                            random: responses
                        }
                    }]
                }
            };
        }

        beforeEach(function() {
            response1 = { needs: ["cond1"], does: { common: [ { says: {text: "Text 1"} } ] } };
            response2 = { needs: ["cond2"], does: { common: [ { says: {text: "Text 2"} } ] } };
            response3 = { needs: ["cond3"], does: { common: [ { says: {text: "Text 3"} } ] } };
            world.getRandomInRange = jasmine.createSpy('getRandomInRange').and.returnValue(0);
            world.getState = function(id) { return true;};
        });
        it("processes a single response", function() {
            var response = getResponseForResponses([ response1 ]);
            story_text.say = jasmine.createSpy("say");
            processor.processResponse(response, 'responder');
            expect(story_text.say.calls.count()).toEqual(1);
            expect(story_text.say.calls.all()[0].args).toEqual([{ text: "Text 1" }, 'responder', 'caller']);
        });
        it("does not process an ineligible response", function() {
            world.getState = function(id) { return false;};

            var response = getResponseForResponses([ response1 ]);
            story_text.say = jasmine.createSpy("say");
            processor.processResponse(response, 'responder');
            expect(story_text.say.calls.count()).toEqual(0);
        });
        it("returns a randomly selected response", function() {
            var response = getResponseForResponses([ response1, response2 ]);
            story_text.say = jasmine.createSpy("say");

            world.getRandomInRange.and.returnValue(0);

            processor.processResponse(response, 'responder');
            expect(world.getRandomInRange).toHaveBeenCalledWith(0, 1);

            expect(story_text.say.calls.count()).toEqual(1);
            expect(story_text.say.calls.all()[0].args).toEqual([{ text: "Text 1" }, 'responder', 'caller']);

            world.getRandomInRange.and.returnValue(1);

            processor.processResponse(response, 'responder');
            expect(world.getRandomInRange).toHaveBeenCalledWith(0, 1);

            expect(story_text.say.calls.count()).toEqual(2);
            expect(story_text.say.calls.all()[1].args).toEqual([{ text: "Text 2" }, 'responder', 'caller']);
        });
        it("randomly chooses only among eligible responses", function() {
            var response = getResponseForResponses([ response1, response2, response3 ]);
            story_text.say = jasmine.createSpy("say");
            world.getState = function(id) { return id !== 'cond2';};

            world.getRandomInRange.and.returnValue(0);

            processor.processResponse(response, 'responder');
            expect(world.getRandomInRange).toHaveBeenCalledWith(0, 1);

            expect(story_text.say.calls.count()).toEqual(1);
            expect(story_text.say.calls.all()[0].args).toEqual([{ text: "Text 1" }, 'responder', 'caller']);

            world.getRandomInRange.and.returnValue(1);

            processor.processResponse(response, 'responder');
            expect(world.getRandomInRange).toHaveBeenCalledWith(0, 1);

            expect(story_text.say.calls.count()).toEqual(2);
            expect(story_text.say.calls.all()[1].args).toEqual([{ text: "Text 3" }, 'responder', 'caller']);
        });

    });
    describe("uses best", function() {
        it("processes the first child response with the best score", function() {
            story_text.say = jasmine.createSpy("say");
            world.getState = function(id) { return  parseFloat(id);};
            var response1 = { weights: "0.9", does: { common: [ { says: {text: "Priority"} } ] } };
            var response2 = { weights: "0.4", does: { common: [ { says: {text: "Not priority"} } ] } };
            var response3 = { weights: "0.9", does: { common: [ { says: {text: "Next Priority"} } ] } };
            var response = {
                does: {
                    common: [ {
                        uses: {
                            best: [
                                response1,
                                response2,
                                response3
                            ]
                        }
                    } ]
                }
            };
            processor.processResponse(response, 'responder');
            expect(story_text.say.calls.count()).toEqual(1);
            expect(story_text.say.calls.all()[0].args).toEqual([{ text: "Priority" }, 'responder', 'caller']);
        });
    });
    describe("uses priority", function() {
        it("processes the child responses with the best scores", function() {
            story_text.say = jasmine.createSpy("say");
            world.getState = function(id) { return  parseFloat(id);};
            var response1 = { weights: "0.9", does: { common: [ { says: {text: "Text 1"} } ] } };
            var response2 = { weights: "0.4", does: { common: [ { says: {text: "Text 2"} } ] } };
            var response3 = { weights: "0.9", does: { common: [ { says: {text: "Text 3"} } ] } };
            var response = {
                does: {
                    common: [ {
                        uses: {
                            priority: [
                                response1,
                                response2,
                                response3
                            ]
                        }
                    } ]
                }
            };
            processor.processResponse(response, 'responder');
            expect(story_text.say.calls.count()).toEqual(2);
            expect(story_text.say.calls.all()[0].args).toEqual([{ text: "Text 1" }, 'responder', 'caller']);
            expect(story_text.say.calls.all()[1].args).toEqual([{ text: "Text 3" }, 'responder', 'caller']);
        });
    });
    describe("calls", function () {
        it("should call the specified topics", function() {
            interact.call = jasmine.createSpy("call");
            var response = {
                does: { common: [ { calls: [ "aTopic", "bTopic", "cTopic" ] } ] }
            };
            processor.processResponse(response, 'responder');
            expect(interact.call).toHaveBeenCalledWith([ "aTopic", "bTopic", "cTopic" ]);
        });
    });
    describe("animates", function () {
        it("should animate", function() {
            story_text.animate = jasmine.createSpy("animate");
            var response = {
                does: { common: [ { animates: {selector: "aselector", transitions: [{to: "options", lasting: 1000} ] } } ] }
            };
            processor.processResponse(response, 'responder');
            expect(story_text.animate).toHaveBeenCalledWith( {selector: "aselector", transitions: [ {to: "options", lasting: 1000} ] } );
        });
    });
    describe("invokes", function () {
        it("should invoke the specified function", function() {
            interact.invoke = jasmine.createSpy("invoke");
            var response = {
                does: { common: [ { invokes: "some function body" } ] }
            };
            processor.processResponse(response, 'responder');
            expect(interact.invoke).toHaveBeenCalledWith('some function body', 'responder');
        });
    });
    describe("moves", function () {
        it("should set the specified object parent", function() {
            world.setParent = jasmine.createSpy("setParent");
            var response = {
                does: { common: [ { moves: { target: "thing", to: "room"} } ] }
            };
            processor.processResponse(response, 'responder');
            expect(world.setParent).toHaveBeenCalledWith("thing", "room");
        });
        it("should set the responder parent if no target is specified", function() {
            world.setParent = jasmine.createSpy("setParent");
            var response = {
                does: { common: [ { moves: { target: "", to: "room"} } ] }
            };
            processor.processResponse(response, 'responder');
            expect(world.setParent).toHaveBeenCalledWith("responder", "room");
        });
    });
    describe("suggests", function () {
        it("should suggest the topics", function() {
            world.suggestTopics = jasmine.createSpy("suggestTopics");
            var response = {
                does: { common: [ { suggests: {keywords: [{keyword: "topicA", weight: 0.8}, {keyword: "topicB", weight: 0.9}] } } ] }
            };
            processor.processResponse(response, 'responder');
            expect(world.suggestTopics).toHaveBeenCalledWith('responder', [{keyword: "topicA", weight: 0.8}, {keyword: "topicB", weight: 0.9}]);
        });
    });
    describe("addTopics", function () {
        it("should add the topics to the responder if a target is not specified", function() {
            var response = {
                does: { common: [ { adds: {keywords: [{keyword: "topicA", weight: 1}, {keyword: "topicB", weight: 1}, {keyword: "topicC", weight: 1}] } } ] }
            };
            processor.processResponse(response, 'responder');

            expect(world.addTopics).toHaveBeenCalledWith("responder", [{keyword: "topicA", weight: 1}, {keyword: "topicB", weight: 1}, {keyword: "topicC", weight: 1}], undefined);
        });
        it("should add the topics to the specified target", function() {
            var response = {
                does: { common: [ { adds: {keywords: [{keyword: "topicA", weight: 1}, {keyword: "topicB", weight: 1}, {keyword: "topicC", weight: 1}], actor: "aTarget" } }] }
            };
            processor.processResponse(response, 'responder');
            expect(world.addTopics).toHaveBeenCalledWith("aTarget", [{keyword: "topicA", weight: 1}, {keyword: "topicB", weight: 1}, {keyword: "topicC", weight: 1}], undefined);
        });
        it("should add the topics to the specified cluster", function() {
            var response = {
                does: { common: [ { adds: {keywords: [{keyword: "topicA", weight: 1}, {keyword: "topicB", weight: 1}, {keyword: "topicC", weight: 1}], cluster: "clusterA" } }] }
            };
            processor.processResponse(response, 'responder');
            expect(world.addTopics).toHaveBeenCalledWith("responder", [{keyword: "topicA", weight: 1}, {keyword: "topicB", weight: 1}, {keyword: "topicC", weight: 1}], "clusterA");
        });
    });
    describe("resets", function () {
        it("should reset the current response", function() {
            story_text.say = jasmine.createSpy("say");
            var response = {
                id: 314,
                does: {
                    1: [
                        { says: { text: "Hello world!" }}
                    ],
                    2: [
                        { resets: {} }
                    ]
                }
            };
            processor.processResponse(response, 'responder');
            expect(story_text.say.calls.count()).toBe(1);
            expect(world.setResponseRuns).not.toHaveBeenCalledWith(314, 0);
            processor.processResponse(response, 'responder');
            expect(story_text.say.calls.count()).toBe(1);
            expect(world.setResponseRuns).toHaveBeenCalledWith(314, 0);
            processor.processResponse(response, 'responder');
            expect(story_text.say.calls.count()).toBe(2);
        });
    });
    describe("clears", function () {
        it("should clear the screen", function() {
            story_text.clear = jasmine.createSpy("clear");
            var response = {
                does: { common: [ { clears: {} } ] }
            };
            processor.processResponse(response, 'responder');
            expect(story_text.clear).toHaveBeenCalledWith({});
        });
    });
    describe("adjusts", function () {
        var values = {
            var1: 0.0,
            target: 1,
            increment: 0.5
        };
        beforeEach(function() {
            world.getState = function(id, responder) {
                return values[id];
            };
            world.setState = jasmine.createSpy('setState');
        });
        it("should adjust the specified variable", function() {
            world.setParent = jasmine.createSpy("setParent");
            var response = {
                does: {
                    common: [
                        {
                            adjusts: {
                                variable: 'var1',
                                toward: 'target',
                                stepping: 'increment'
                            }
                        }
                    ]
                }
            };
            processor.processResponse(response, 'responder');
            expect(world.setState).toHaveBeenCalledWith({expression: 'var1=0.5'}, 'responder');
        });
        it("should set the responder parent if no target is specified", function() {
            world.setParent = jasmine.createSpy("setParent");
            var response = {
                does: { common: [ { moves: { target: "", to: "room"} } ] }
            };
            processor.processResponse(response, 'responder');
            expect(world.setParent).toHaveBeenCalledWith("responder", "room");
        });
    });

    describe("processResponses", function () {
        describe("general", function () {
            it("increments the response run count by one", function () {
                var candidate = { response: { }, score: 1 };
                var candidates = [candidate];
                processor.processResponses(candidates);
                expect(candidate.response.run).toBe(1);
                processor.processResponses(candidates);
                expect(candidate.response.run).toBe(2);
            });
            it("groups responses by type", function () {
                var output = "";
                story_text.say = function(says) { output += says.text; };
                var candidates = [
                    { response: { is:"c", does: { common: [ {says: { text: "C!"} } ] } }, score: 1 },
                    { response: { is:"b", does: { common: [ {says: { text: "B!"} } ] } }, score: 1 },
                    { response: { is:"a", does: { common: [ {says: { text:  "A!"} } ] } }, score: 1 },
                    { response: { is:"b", does: {common: [ {says: { text:  "B again!"} } ] } }, score: 1 }
                ];
                processor.processResponses(candidates, ["a","b","c"]);
                expect(output).toEqual("A!B!B again!C!");
            });
            it("orders responses", function () {
                var output = "";
                story_text.say = function(says) { output += says.text; };
                var candidates = [
                    { response: { orders:99, does: { common: [ {says: { text: "C!"} } ] } }, score: 1 },
                    { response: { does: { common: [ {says: { text: "B!"} } ] } }, score: 1 },
                    { response: { orders:10, does: { common: [ {says: { text:  "A!"} } ] } }, score: 1 },
                    { response: { does: {common: [ {says: { text:  "B again!"} } ] } }, score: 1 }
                ];
                processor.processResponses(candidates, ["a","b","c"]);
                expect(output).toEqual("B!B again!A!C!");
            });
        });
        describe("prompts", function () {
            it("shows prompts in a menu", function () {
                interact.choose = jasmine.createSpy("choose");
                var candidate1 = {response: {prompts: "Go north"}, score: 1};
                var candidate2 = {response: {prompts: "Go south"}, score: 1};
                processor.processResponses([candidate1, candidate2]);
                expect(interact.choose).toHaveBeenCalledWith(["Go north", "Go south"], jasmine.any(Function));
            });
            it("processes a single prompt as a normal response if forcesprompt is false", function () {
                story_text.say = jasmine.createSpy("say");
                interact.choose = jasmine.createSpy("choose");
                var candidate1 = { response: { prompts: "Go north", forcesprompt: false, does: { common: [ { says: { text: "something" } } ] } }, score: 1 };
                processor.processResponses([candidate1]);
                expect(interact.choose).not.toHaveBeenCalled();
                expect(story_text.say).toHaveBeenCalled();
            });
            it("processes a single prompt as a prompt if 'forcesprompt' is not set", function () {
                interact.choose = jasmine.createSpy("choose");
                var candidate1 = { response: { prompts: "Go north"}, score: 1 };
                processor.processResponses([candidate1]);
                expect(interact.choose).toHaveBeenCalledWith(["Go north"], jasmine.any(Function));
            });
            it("passes a callback function to be invoked when an item is chosen", function () {
                interact.choose = jasmine.createSpy("choose");
                story_text.say = jasmine.createSpy("say");
                var candidate1 = { response: { prompts: "Go north", does: { common: [ { says: { text: "North" } } ] } }, score: 1, responder: 'responder' };
                var candidate2 = { response: { prompts: "Go south", does: { common: [ { says: { text: "South" } } ] }  }, score: 1, responder: 'responder' };
                processor.processResponses([candidate1, candidate2]);
                var callback = interact.choose.calls.mostRecent().args[1];
                callback(1);
                expect(story_text.say).toHaveBeenCalledWith({text: "South"}, 'responder', 'caller');
            });
            it("does nothing if the menu callback is called with -1", function () {
                interact.choose = jasmine.createSpy("choose");
                story_text.say = jasmine.createSpy("say");
                var candidate1 = { response: { prompts: "Go north", does: { common: [ { says: { text: "North" } } ] } }, score: 1 };
                var candidate2 = { response: { prompts: "Go south", does: { common: [ { says: { text: "South" } } ] }  }, score: 1 };
                processor.processResponses([candidate1, candidate2]);
                var callback = interact.choose.calls.mostRecent().args[1];
                callback(-1);
                expect(story_text.say).not.toHaveBeenCalled();
            });
            it ("combines multiple responses with the same prompt under one menu choice", function () {
                interact.choose = jasmine.createSpy("choose");
                var candidate1 = { response: { prompts: "prompt1" }, score: 1 };
                var candidate2 = { response: { prompts: "prompt1" }, score: 1 };
                var candidate3 = { response: { prompts: "prompt2" }, score: 1 };
                processor.processResponses([candidate1, candidate2, candidate3]);
                expect(interact.choose).toHaveBeenCalledWith(["prompt1", "prompt2"], jasmine.any(Function));
            });
            it ("executes multiple responses with the same prompt when chosen", function () {
                interact.choose = jasmine.createSpy("choose");
                story_text.say = jasmine.createSpy("say");
                var candidate1 = {response: {prompts: "prompt1", does: {common: [ {says: { text: "North" } } ] } }, score: 1, responder: 'responder'};
                var candidate2 = {response: {prompts: "prompt1", does: {common: [ {says: { text: "North2" } } ] } }, score: 1, responder: 'responder'};
                var candidate3 = {response: {prompts: "prompt2", does: {common: [ {says: { text: "South" } } ] } }, score: 1, responder: 'responder'};
                processor.processResponses([candidate1, candidate2, candidate3]);
                var callback = interact.choose.calls.mostRecent().args[1];
                callback(0);
                expect(story_text.say.calls.count()).toEqual(2);
                expect(story_text.say.calls.all()[0].args).toEqual([{ text: "North" }, 'responder', 'caller']);
                expect(story_text.say.calls.all()[1].args).toEqual([{ text: "North2" }, 'responder', 'caller']);
            });
        });
    });
});
