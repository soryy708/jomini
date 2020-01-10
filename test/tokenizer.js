var expect = require('chai').expect;
var tokenizer = require('../lib/tokenizer');

describe('tokenizer', function() {
    describe('tokenTypes', function() {
        it('should have all different values', function() {
            function checkKey(key) {
                const withoutKey = {...tokenizer.tokenTypes};
                delete withoutKey[key];
                expect(Object.values(withoutKey)).to.not.include(key);
            }

            Object.keys(tokenizer.tokenTypes).forEach(checkKey);
        });
    });

    describe('tokenizeLine', function() {
        it('recognizes block opening', function() {
            expect(tokenizer.tokenizeLine('{')).to.deep.equal([{type: tokenizer.tokenTypes.BLOCK_OPEN, value: '{'}]);
        });
        it('recognizes block closing', function() {
            expect(tokenizer.tokenizeLine('}')).to.deep.equal([{type: tokenizer.tokenTypes.BLOCK_CLOSE, value: '}'}]);
        });
        it('recognizes equals sign', function() {
            expect(tokenizer.tokenizeLine('=')).to.deep.equal([{type: tokenizer.tokenTypes.EQUALS, value: '='}]);
        });
        it('recognizes labels', function() {
            expect(tokenizer.tokenizeLine('foo')).to.deep.equal([{type: tokenizer.tokenTypes.LABEL, value: 'foo'}]);
        });
        it('recognizes operator: <', function() {
            expect(tokenizer.tokenizeLine('<')).to.deep.equal([{type: tokenizer.tokenTypes.OPERATOR, value: '<'}]);
        });
        it('recognizes operator: >', function() {
            expect(tokenizer.tokenizeLine('>')).to.deep.equal([{type: tokenizer.tokenTypes.OPERATOR, value: '>'}]);
        });
        it('recognizes operator: <=', function() {
            expect(tokenizer.tokenizeLine('<=')).to.deep.equal([{type: tokenizer.tokenTypes.OPERATOR, value: '<='}]);
        });
        it('recognizes operator: >=', function() {
            expect(tokenizer.tokenizeLine('>=')).to.deep.equal([{type: tokenizer.tokenTypes.OPERATOR, value: '>='}]);
        });

        it('handles multiple tokens in succession', function() {
            expect(tokenizer.tokenizeLine('foo=bar')).to.deep.equal([
                {type: tokenizer.tokenTypes.LABEL, value: 'foo'},
                {type: tokenizer.tokenTypes.EQUALS, value: '='},
                {type: tokenizer.tokenTypes.LABEL, value: 'bar'},
            ]);
        });
        
        it('differentiates operators from equals', function() {
                expect(tokenizer.tokenizeLine('< = <= > = >=')).to.deep.equal([
                    {type: tokenizer.tokenTypes.OPERATOR, value: '<'},
                    {type: tokenizer.tokenTypes.EQUALS, value: '='},
                    {type: tokenizer.tokenTypes.OPERATOR, value: '<='},
                    {type: tokenizer.tokenTypes.OPERATOR, value: '>'},
                    {type: tokenizer.tokenTypes.EQUALS, value: '='},
                    {type: tokenizer.tokenTypes.OPERATOR, value: '>='},
                ]);
        });

        it('groups words in quotes to one label', function() {
            expect(tokenizer.tokenizeLine('value="foo bar"')).to.deep.equal([
                {type: tokenizer.tokenTypes.LABEL, value: 'value'},
                {type: tokenizer.tokenTypes.EQUALS, value: '='},
                {type: tokenizer.tokenTypes.LABEL, value: '"foo bar"'},
            ]);
        });
    });

    describe('tokenize', function() {
        it('should agree with tokenizeLine', function() {
            expect(tokenizer.tokenize('foo=bar')).to.deep.equal(tokenizer.tokenizeLine('foo=bar'));
        });

        it('should handle newlines', function() {
            expect(tokenizer.tokenize('foo\n=\nbar')).to.deep.equal(tokenizer.tokenizeLine('foo=bar'));
        });

        it('should handle whitespace', function() {
            expect(tokenizer.tokenize('foo = {\n\tbar=42\n}')).to.deep.equal(tokenizer.tokenizeLine('foo={bar=42}'));
        });
    });
});
