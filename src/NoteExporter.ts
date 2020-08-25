import { noteData, noteTypes } from "./CustomTypes"
import { saveAs } from "file-saver"

export class NoteExporter {
    static exportToFile(arr: noteData[]) {
        this.cleanupNotes(arr)

        let size = (arr.length + 1) * 16

        let buffer = new ArrayBuffer(size)
        let uintView = new Uint8Array(buffer)

        let offset = 16

        for (let i = 0; i < arr.length; ++i) {
            this.writeNote(arr[i], uintView, i * 16 + offset)
        }

        uintView[3] = 2

        let lengthBuf = this.intToBuffer(arr.length)

        uintView[8] = lengthBuf[0]
        uintView[9] = lengthBuf[1]
        uintView[10] = lengthBuf[2]
        uintView[11] = lengthBuf[3]

        //console.log(this.intToBuffer(512))
        let startByte = 8
        let endByte = 16 + 16 * arr.length + 0 //stringLength
        let crcTest = new Uint8Array(endByte - startByte)
        for (let i = startByte; i < endByte; ++i) {
            crcTest[i - startByte] = uintView[i]
        }

        let crcBuf = this.makeCRC(crcTest)

        uintView[4] = crcBuf[0]
        uintView[5] = crcBuf[1]
        uintView[6] = crcBuf[2]
        uintView[7] = crcBuf[3]

        let blob = new Blob([buffer], { type: "application/octet-stream" })
        saveAs(blob, "chart.xmk")
    }

    static writeNote(note: noteData, buffer: Uint8Array, index: number) {
        let bpmTimeBuf = this.floatToBuffer(note.time)
        let typebuf = this.intToBuffer(note.type)
        let lengthBuf = this.floatToBuffer(note.length)
        let extraBuf = this.floatToBuffer(note.extra)

        buffer[index + 0] = bpmTimeBuf[0]
        buffer[index + 1] = bpmTimeBuf[1]
        buffer[index + 2] = bpmTimeBuf[2]
        buffer[index + 3] = bpmTimeBuf[3]
        buffer[index + 4] = typebuf[0]
        buffer[index + 5] = typebuf[1]
        buffer[index + 6] = typebuf[2]
        buffer[index + 7] = typebuf[3]
        buffer[index + 8] = lengthBuf[0]
        buffer[index + 9] = lengthBuf[1]
        buffer[index + 10] = lengthBuf[2]
        buffer[index + 11] = lengthBuf[3]
        buffer[index + 12] = extraBuf[0]
        buffer[index + 13] = extraBuf[1]
        buffer[index + 14] = extraBuf[2]
        buffer[index + 15] = extraBuf[3]
    }

    static floatToBuffer(n: number) {
        let buffer = new Float32Array(1)
        let result = new Uint8Array(4)
        let bufferAsUI8 = new Uint8Array(buffer.buffer)

        buffer[0] = n

        result[0] = bufferAsUI8[3]
        result[1] = bufferAsUI8[2]
        result[2] = bufferAsUI8[1]
        result[3] = bufferAsUI8[0]

        return result
    }

    static intToBuffer(n: number) {
        let buffer = new Int32Array(1)
        let result = new Uint8Array(4)
        let bufferAsUI8 = new Uint8Array(buffer.buffer)

        buffer[0] = n

        result[0] = bufferAsUI8[3]
        result[1] = bufferAsUI8[2]
        result[2] = bufferAsUI8[1]
        result[3] = bufferAsUI8[0]

        return result
    }

    static generateTable() {
        let table: number[] = []
        let poly = 0xedb88320

        for (let i = 0; i < 256; ++i) {
            let c = i
            for (let bit = 0; bit < 8; ++bit) {
                let lsb = c & 1
                c >>>= 1
                if (lsb) {
                    c = c ^ poly
                }
            }
            table[i] = c
        }
        return table
    }

    static makeCRC(buffer: Uint8Array) {
        let table = this.generateTable()
        let crc = 0xffffffff

        for (let i = 0; i < buffer.length; ++i) {
            let number = buffer[i]
            let index = (crc & 0xff) ^ number // lower byte of crc with (& 0xff)
            crc = (crc >>> 8) ^ table[index]
        }
        let result = new Uint8Array(4)
        let resBuffer = new Uint32Array(1)
        let resBufferAsUI8 = new Uint8Array(resBuffer.buffer)

        resBuffer[0] = ~crc

        result[0] = resBufferAsUI8[3]
        result[1] = resBufferAsUI8[2]
        result[2] = resBufferAsUI8[1]
        result[3] = resBufferAsUI8[0]

        return result
    }

    static cleanupNotes(notes: noteData[]) {
        notes.sort((a, b) => a.time - b.time)

        let lastCross: noteData | undefined = undefined
        let lastSpike: noteData | undefined = undefined
        for (let i = 0; i < notes.length; ++i) {
            let n = notes[i]
            if (n.type === noteTypes.TAP_G || n.type === noteTypes.TAP_B || n.type === noteTypes.TAP_R) {
                if (n.length === 0) n.length = 0.03125
            } else if (n.type === noteTypes.SCR_G_UP || n.type === noteTypes.SCR_B_UP || n.type === noteTypes.SCR_G_DOWN || n.type === noteTypes.SCR_B_DOWN || n.type === noteTypes.SCR_G_ANYDIR || n.type === noteTypes.SCR_B_ANYDSCR_G_ANYDIR) {
                if (n.length === 0) n.length = 1 / 32
            } else if (n.type === noteTypes.CROSS_B || n.type === noteTypes.CROSS_C || n.type === noteTypes.CROSS_G) {
                if (lastCross) {
                    if (lastSpike) {
                        if (lastCross.time > lastSpike.time) {
                            //update crossfade
                            lastCross.length = n.time - lastCross.time
                        } else {
                            //place crossfade after + set length
                        }
                    } else {
                        //there's only the crossfade that you can update
                        lastCross.length = n.time - lastCross.time
                    }
                }
                lastCross = n
            } else if (n.type === noteTypes.CF_SPIKE_G || n.type === noteTypes.CF_SPIKE_B || n.type === noteTypes.CF_SPIKE_C) {
                n.length = 1 / 16
                if (lastCross) {
                    if (lastSpike) {
                        if (lastCross.time > lastSpike.time) {
                            //update crossfade
                            lastCross.length = n.time - lastCross.time
                        } else if (n.time - lastSpike.time > 0.0625) {
                            //add crossfade if distance > 1/16
                            let start = lastSpike.time + lastSpike.length
                            let data: noteData = {
                                time: start,
                                type: lastCross.type,
                                length: n.time - start,
                                lane: 1,
                                extra: 0
                            }

                            lastCross = data
                            let index = notes.indexOf(lastSpike) + 1
                            notes.splice(index, 0, data)
                            i = index
                        }
                    } else {
                        //n is the first spike
                        lastCross.length = n.time - lastCross.time
                    }
                }

                lastSpike = n
            }
        }
        if (lastCross) {
            if (lastSpike && lastCross.time > lastSpike.time) {
                let lastNote = notes[notes.length - 1]
                lastCross.length = lastNote.time - lastCross.time + 1
            } else {
                let lastNote = notes[notes.length - 1]
                lastCross.length = lastNote.time - lastCross.time + 1
            }
        }
    }
}
