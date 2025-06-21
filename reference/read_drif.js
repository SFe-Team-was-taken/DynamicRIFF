/**
 * @param data {Uint8Array}
 * @param offset {number}
 * @returns {{
 *     type: (DRIFChunkType),
 *     name: string,
 *     data: Uint8Array,
 *     totalSize: number,
 * }}
 */
export function readDRIFChunk(data, offset)
{
    let currentIndex = offset;
    const nameLength = data[currentIndex++];
    let name = String.fromCharCode(...data.slice(currentIndex, currentIndex + nameLength));
    currentIndex += nameLength;
    const type = data[currentIndex++];
    let size = 0;
    while (true)
    {
        const byte = data[currentIndex++];
        size = (size << 7) | (byte & 127);
        if ((byte >> 7) !== 1)
        {
            break;
        }
    }
    const chunkData = data.slice(currentIndex, currentIndex + size);
    let totalSize = size + currentIndex - offset;
    if(totalSize % 2 !== 0)
    {
        totalSize++;
    }
    return {
        type,
        name,
        totalSize,
        data: chunkData,
    }
}