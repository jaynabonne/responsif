describe("rifParse", function () {
    it("should return an empty result for an empty input", function () {
        expect(rifParse([])).toEqual({});
    });
    it("should parse a single object", function () {
        var rif = rifParse( [ {token: "object", value: "anObject"} ] );
        expect(rif.objects).toEqual( { anObject: {} } );
    });
    it("should parse an empty responses set", function () {
        var rif = rifParse(
            [
                {token: "responses", value: "someObject"},
                {token: "end", value: ""}
            ]
        );
        expect(rif.responses).toEqual( { someObject: [] } );
    });
    it("should parse multiple objects", function () {
        var rif = rifParse(
            [
                {token: "object", value: "anObject"},
                {token: "object", value: "anotherObject"}
            ] );
        expect(rif.objects).toEqual(
            {
                anObject: {},
                anotherObject: {}
            } );
    });
    it("should parse multiple responses sets", function () {
        var rif = rifParse(
            [
                {token: "responses", value: "anObject"},
                {token: "end", value: ""},
                {token: "responses", value: "anotherObject"},
                {token: "end", value: ""}
            ] );
        expect(rif.responses).toEqual(
            {
                anObject: [],
                anotherObject: []
            } );
    });
    xit("should parse a responses set with one response", function () {
        var rif = rifParse(
            [
                {token: "responses", value: "someObject"},
                {token: "response", value: ""},
                {token: "end", value: ""}
            ]
        );
        expect(rif.responses).toEqual( { someObject: [{}] } );
    });
});
