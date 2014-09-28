var base = require('./base');
var mixin = require('utils-merge');

var chapter = {
    identifier: 'chapter'
};

/**
 * Data tree that is represented chapter-by-chapter.
 *
 * @param {Object} data Meta data pertaining to the data tree.
 * 
 * @return {Chapter} Object representing chapter data tree.
 */
function createChapterTree(data){
    // Configure the data tree.
    var config = {
        appliers: [ base.APPLIERS.AVERAGE, base.APPLIERS.COMPLETION ],
        prioritizers: [ base.PRIORITIZERS.EXPOSURE, base.PRIORITIZERS.PERCENTAGE ],
        puller: base.PULLER.RELATIVE
    };

    // Merge our base.js with this object.
    mixin(chapter, base);

    // Call our inherited initialization.
    chapter.init(config, data);

    return chapter;
}

module.exports = exports = createChapterTree;