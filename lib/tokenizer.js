const tokenTypes = {
    'WHITESPACE': 'WHITESPACE',
    'BLOCK_OPEN': 'BLOCK_OPEN',
    'BLOCK_CLOSE': 'BLOCK_CLOSE',
    'OPERATOR': 'OPERATOR',
    'EQUALS': 'EQUALS',
    'LABEL': 'LABEL',
    'INVALID': 'INVALID',
};

/**
 * Tokenize a string which doesn't contain newlines
 * @param {String} inputStr 
 */
function tokenizeLine(inputStr) {
    const regex = /\s*(?:\n|(#[^\n]*)|(\{)|(\})|(<[=>]?|>=?)|(=)|([^{}=\t\r\n]+))/gu;
    function deduceType(match) {
        if (match[1]) {
            return tokenTypes.WHITESPACE;
        }
        if (match[2]) {
            return tokenTypes.BLOCK_OPEN;
        }
        if (match[3]) {
            return tokenTypes.BLOCK_CLOSE;
        }
        if (match[4]) {
            return tokenTypes.OPERATOR;
        }
        if (match[5]) {
            return tokenTypes.EQUALS;
        }
        if (match[6]) {
            return tokenTypes.LABEL;
        }
        return tokenTypes.INVALID;
    }
    const matches = inputStr.matchAll(regex);

    const tokens = [];
    for(let match of matches) {
        let value = match[0];
        if (!value.includes('"')) {
            value = value.replace(/[ \t\r\n]/gu, '');
        }
        tokens.push({
            type: deduceType(match),
            value: value,
        });
    };
    return tokens;
}

/**
 * Tokenize a string
 * @param {String} inputStr 
 */
function tokenize(inputStr) {
    const lines = inputStr.split('\n');
    const lineTokens = lines.map(line => tokenizeLine(line))
    const tokens = lineTokens.reduce((prev, cur) => prev.concat(cur));
    return tokens;
}

module.exports = {
    tokenizeLine,
    tokenize,
    tokenTypes,
};
