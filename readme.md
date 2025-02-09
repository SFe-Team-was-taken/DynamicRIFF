# Dynamic RIFF

Dynamic RIFF is the RIFF-like format that allows flexible choice of bit width. 

By using a new field, RIFF scales up to 2048-bit.

However, the main advantage is that you can use a 40-bit or 48-bit system that is significantly more efficient than just skipping straight to 64-bit.

---

# Specification

## The new RIFF chunk
The dynamic RIFF format changes the RIFF header with one byte.

### Original RIFF header
```c
typedef struct {
   CHAR[4] fourCC;      // the regular FourCC code
   DWORD ckSize;       // the RIFF chunk size
   BYTE[ckSize] data;   // the RIFF chunk data
} Riff;
```

- `fourCC` - the four-letter character code, identifier of the chunk.
- `ckSize` - chunk size, in bytes.
- `data` - the chunk's data.

### Dynamic RIFF Header
```c
typedef struct {
   CHAR[4] fourCC;            // the regular FourCC code
   BYTE ckSizeLength;         // the length of the size field in bytes
   CHAR[ckSizeLength] ckSize; // the RIFF chunk size
   BYTE[ckSize] data;         // the RIFF chunk data
} RiffDynamic;
```

- `fourCC` - the four-letter character code, identifier of the chunk.
- `ckSizeLength` - the chunk size number's length in bytes.
- `ckSize` - chunk size, in bytes.
- `data` - the chunk's data.


This adds a new byte called `ckSizeLength.` 
As the name suggests, this describes the length in bytes of the ckSize field,
 rather than being fixed at four bytes. 

Other than this change, this format behaves exactly like the regular RIFF format.

**IMPORTANT EXCEPTION:** The `ckSize` field is not required to be even.

### Reading and writing the Dynamic RIFF format
#### Example chunk
```js
/* 0. */ 0x72   // "R"
/* 1. */ 0x69   // "I"
/* 2. */ 0x66   // "F"
/* 3. */ 0x66   // "F"
/* 4. */ 0x01   // ckSizeLength: 1 byte
/* 5. */ 0x64   // ckSize: 100 bytes
/* 6. */ "data" // the chunk data here: 100 bytes with some data
```

This saves two bytes from the original RIFF implementation.
Regular RIFF would use a total of eight bytes for header (fourCC + ckSize), while this approach only uses 6.

#### Larger chunk
```js
/* 0. */ 0x72   // "R"
/* 1. */ 0x69   // "I"
/* 2. */ 0x66   // "F"
/* 3. */ 0x66   // "F"
/* 4. */ 0x04   // ckSizeLength: 4 bytes
/* 5. */ 0xFF   // }
/* 6. */ 0xFF   // } ckSize: 1099511627775 bytes
/* 7. */ 0xFF   // }
/* 8. */ 0xFF   // }
/* 9. */ "data" // the chunk data here: 1,099,511,627,775 bytes with some data
```

### Example reading function

```js
function readDynamicRIFFChunk(dataArray)
{
    let header = readBytesAsString(dataArray, 4);
    let ckSizeLength = dataArray[4];
    let ckSize = 0;
    for (let i = 0; i < bytesAmount; i++)
    {
        ckSize |= (dataArray[i + 5] << i * 8);
    }
    const dataStartOffset = 5 + ckSizeLength;
    let chunkData = new Uint8Array(dataArray.buffer.slice(dataStartOffset, dataStartOffset + ckSize));
    return new RiffChunk(header, ckSize, chunkData);
}
```

### Example writing function
```js
function writeDynamicRIFFChunk(chunk)
{
    const ckSize = chunk.data.length;
    const numBits = Math.floor(Math.log2(ckSize)) + 1;
    const ckSizeLength = Math.ceil(numBits / 8);
    const outArray = new Uint8Array(5 + ckSizeLength + ckSize);
    writeStringAsBytes(outArray, chunk.header);
    outArray[4] = ckSizeLength;
    for (let i = 0; i < ckSizeLength; i++)
    {
        dataArray[5 + i] = (ckSize >> (i * 8)) & 0xFF;
    }
    outArray.set(chunk.data, 5 + ckSizeLength);
    return outArray;
}
```

The maximum allowed size of `ckSizeLength` is 255.

---

Designed and written by Spessasus, brought to life by the SFe Team