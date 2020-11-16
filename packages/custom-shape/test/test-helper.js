
const assert = chai.assert;

export function assertVectorCloseTo(v, e, delta) {
    if(v.length !== e.length){
        assert.fail(e.length, v.length, `Vectors doesn't have the same length, ${v.length} != ${e.length}'`);
    }
    v.forEach((c, idx) => assert.closeTo(c, e[idx], delta, `Difference is more than delta at index ${idx}`));
}
