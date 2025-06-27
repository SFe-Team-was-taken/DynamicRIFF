import * as fs from "node:fs";
import { readDRIFChunk } from "./read_drif.js";
import { DRIFChunkType } from "./write_drif.js";

try
{
    const file = fs.readFileSync("example.drif");
    const mainChunk = readDRIFChunk(file, 0);
    /**
     * @type {{
     *     type: DRIFChunkType,
     *     name: string,
     *     data: Uint8Array,
     *     totalSize: number,
     * }[]}
     */
    let innerChunks = [];
    // skip the type LPString
    let offset = mainChunk.data[0] + 1;
    while(offset < mainChunk.data.length)
    {
        const chunk = readDRIFChunk(mainChunk.data, offset);
        offset += chunk.totalSize;
        innerChunks.push(chunk);
    }
    console.log("Read data:");
    console.group(`Type: ${mainChunk.type}, name: ${mainChunk.name}`);
    for(const chunk of innerChunks)
    {
        console.group(`Type: ${chunk.type}, name: ${chunk.name}`);
        switch (chunk.type)
        {
            default:
            case DRIFChunkType.binary:
                // print out hex string of the binary data
                console.log("Binary data:", Array.from(chunk.data).map(num => num.toString(16)).join(" "));
                break;
            
            case DRIFChunkType.utf8:
            case DRIFChunkType.ascii:
                console.log(new TextDecoder("utf-8").decode(chunk.data));
        }
        console.groupEnd();
    }
    console.groupEnd();
    
}
catch (e)
{
    console.error("'example.drif' not found.");
}