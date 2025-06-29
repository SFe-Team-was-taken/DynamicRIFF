
import { DRIFChunkType, writeDRIFChunk } from "./write_drif.js";
import * as fs from "node:fs";

const encoder = new TextEncoder();
const chunks = [
    new Uint8Array([31, ...encoder.encode("Dynamic RIFF Demonstration file")]),
    writeDRIFChunk(DRIFChunkType.utf8, "UTF-8 Chunk", encoder.encode("This is the first UTF-8 ←↓→ chunk.\nIt has a line break.")),
    writeDRIFChunk(DRIFChunkType.ascii, "Text Chunk", encoder.encode("This is a text chunk with an unspecified encoding.")),
    writeDRIFChunk(DRIFChunkType.binary, "Binary Chunk", new Uint8Array([46, 23, 54, 76 ,87, 12, 245, 123]))
]

const mainChunkData = new Uint8Array(chunks.reduce((length, chunk) => chunk.length + length, 0));
let offset = 0;
for(const chunk of chunks)
{
    mainChunkData.set(chunk, offset);
    offset += chunk.length;
}

const mainChunk = writeDRIFChunk(DRIFChunkType.binary, "DRIF", mainChunkData);

fs.writeFileSync("./example.drif", mainChunk);