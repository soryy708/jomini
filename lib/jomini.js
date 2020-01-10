var tokenizer = require('./tokenizer');

/**
 * 
 * @param {String} inputStr 
 * @param {Object} options 
 * @param {Boolean} options.linkParents 
 * @returns {Object} {name: String, children: Array}
 */
function instrumentedParse(inputStr, options={}) {
    function makeNode(tokens, i = 0, parent = null) {
        function nodeCtor(parent = null, name = '') {
            const node = {};
            if (options.linkParents) {
                node.parent = parent;
            }
            node.name = name;
            node.children = [];
            return node;
        }

        const node = nodeCtor();

        if (i >= tokens.length || tokens.length === 0) {
            return node;
        }

        if (options.linkParents) {
            node.parent = parent;
        }

        if (tokens[i].type === tokenizer.tokenTypes.LABEL) {
            node.name = tokens[i].value;
        } else {
            throw new Error(`Expected LABEL`);
        }

        if (i + 2 < tokens.length) { // enough space for an EQUALS + LABEL/BLOCK
            if (tokens[i + 1].type === tokenizer.tokenTypes.EQUALS) {
                let blocks;
                switch (tokens[i + 2].type) { // What should `node` equal to?
                    case tokenizer.tokenTypes.LABEL: {
                        node.children.push(nodeCtor(node, tokens[i + 2].value));
                        break;
                    }
                    case tokenizer.tokenTypes.BLOCK_OPEN: {
                        blocks = 1;

                        // j is set to right after BLOCK_OPEN,
                        // runs until matching BLOCK_CLOSE, or there are no more tokens.
                        for (let j = i + 3; j < tokens.length && blocks > 0; ++j) {
                            // If tokens[j] is `node`s child, and isn't after an EQUALS
                            if (blocks === 1 && tokens[j].type === tokenizer.tokenTypes.LABEL && tokens[j-1].type !== tokenizer.tokenTypes.EQUALS) {
                                node.children.push(makeNode(tokens, j, node));
                            } else { // If tokens[j] isn't `node`s child
                                if (tokens[j].type === tokenizer.tokenTypes.BLOCK_OPEN) {
                                    ++blocks;
                                } else if (tokens[j].type === tokenizer.tokenTypes.BLOCK_CLOSE) {
                                    --blocks;
                                }
                            }
                        }

                        if (blocks > 0) {
                            throw new Error('A block was opened but not closed');
                        }
                        break;
                    }
                    default: {
                        throw new Error('LABEL EQUALS something unexpected');
                    }
                }

            } else {
                node.children.push(nodeCtor(node, ''));
            }
        }

        return node;
    }

    const tokens = tokenizer.tokenize(inputStr);
    return makeNode(tokens);
}

/**
 * 
 * @param {String} inputStr 
 */
function parse(inputStr) {
    function processTree(node) {
        const key = node.name;
        let children = node.children.map(child => processTree(child));
        if (children.length === 1) {
            children = children[0];
        }
        if (children.length === 0) {
            return key;
        }
        const obj = {};
        obj[key] = children;
        return obj;
    }

    const root = instrumentedParse(inputStr);
    return processTree(root);
}

module.exports = {
    parse,
};
