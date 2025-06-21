/**
 * @enum {number}
 */
export const DRIFChunkType = {
    binary: 0,
    list: 1,
    numeric: 2,
    utf8: 3,
    ascii: 4
}

/**
 * @param type {DRIFChunkType}
 * @param name {string}
 * @param data {Uint8Array}
 */
export function writeDRIFChunk(type, name, data)
{
    // type
    let header = [];
    // LPString name
    header.push(name.length)
    for (let i = 0; i < name.length; i++)
    {
        header.push(name.charCodeAt(i));
    }
    // type
    header.push(type);
    
    // convert size to VLQ
    let writtenSize = data.length;
    let ckSize = [writtenSize & 127];
    writtenSize >>= 7;
    while (writtenSize > 0)
    {
        ckSize.unshift((writtenSize & 127) | 128);
        writtenSize >>= 7;
    }
    header.push(...ckSize);
    const headerLength = header.length;
    // combine
    let fullSize = headerLength + data.length;
    if(fullSize % 2 !== 0)
    {
        fullSize++;
    }
    const binary = new Uint8Array(fullSize);
    binary.set(header, 0);
    binary.set(data, headerLength);
    return binary;
}