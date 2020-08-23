import { noteData, noteTypes } from "./CustomTypes"

export class NoteLoader {
    static parseChart(f: File, arr: noteData[]) {
        return this.readerPromise(f).then((result) => {
            arr.splice(0, arr.length)
            if (result !== null) {
                let buffer = new ArrayBuffer(result.toString().length)
                let binaryDataAsUInt = new Uint8Array(buffer)

                for (let i = 0; i < result.toString().length; i++) {
                    binaryDataAsUInt[i] = result.toString().charCodeAt(i)
                }

                //const checksum = this.parseBinaryInt(buffer, 4)
                const length = this.parseBinaryInt(buffer, 8)
                const stringLength = this.parseBinaryInt(buffer, 12)

                //console.log(length)

                if (length && stringLength) {
                    let bpm = 120
                    let spikeCenter = false
                    let spikeChainStarted = false
                    let spikeChainTime = 0
                    let lastNote: noteData = { time: 0, lane: 1, length: 0, type: -1, extra: 0 }

                    let lastFakeBPMMeasure = 0
                    let lastFakeBPMTime = 0
                    let lastFakeBPMValue = 120
                    for (let i = 0; i < length; i++) {
                        let bpmTime = this.parseBinaryFloat(buffer, 16 * (i + 1) + 0)
                        let type = this.parseBinaryInt(buffer, 16 * (i + 1) + 4)
                        let length = this.parseBinaryFloat(buffer, 16 * (i + 1) + 8)
                        let extra = this.parseBinaryFloat(buffer, 16 * (i + 1) + 12)

                        if (type === noteTypes.BPM) {
                            bpm = extra ? extra : 120
                            lastFakeBPMValue = bpm
                        }

                        if (type === noteTypes.BPM_FAKE && bpmTime != undefined && extra != undefined) {
                            let ticks = this.parseBinaryInt(buffer, 16 * (i + 1) + 12)
                            extra = ticks ? Math.round(60000000 / ticks) : 500000

                            let ratio = bpm / lastFakeBPMValue
                            let deltaMeasure = bpmTime - lastFakeBPMMeasure
                            let t = lastFakeBPMTime + deltaMeasure * ratio

                            lastFakeBPMMeasure = bpmTime
                            lastFakeBPMValue = extra

                            bpmTime = t
                            lastFakeBPMTime = t
                        }

                        if ((type === noteTypes.CF_SPIKE_B || type === noteTypes.CF_SPIKE_G) && bpmTime !== undefined) {
                            if (!spikeChainStarted) {
                                spikeChainStarted = true
                                spikeChainTime = bpmTime
                            } else if (!spikeCenter) {
                                spikeCenter = true
                                let data: noteData = {
                                    time: lastNote.time,
                                    type: noteTypes.CROSS_C,
                                    lane: 1,
                                    length: lastNote.length,
                                    extra: lastNote.extra
                                }
                                arr.push(data)
                            }
                        }

                        if (type === noteTypes.CROSS_G || type === noteTypes.CROSS_C || type === noteTypes.CROSS_B) {
                            spikeCenter = false
                            spikeChainStarted = false
                        }

                        //time === 0 and type == 0 are valid
                        if (bpmTime !== undefined && type !== undefined) {
                            if (type === noteTypes.REWIND) extra = 0

                            let data: noteData = {
                                time: bpmTime,
                                type: type,
                                lane: 1,
                                length: length ? length : 0,
                                extra: extra ? extra : 0
                            }
                            arr.push(data)
                            lastNote = data
                        }
                    }
                    arr.sort((a, b) => a.time - b.time)

                    for (let d of arr) {
                        d.lane = NoteLoader.getCrossAtTime(d.time, arr)
                        if (d.type === noteTypes.FX_G || d.type === noteTypes.FX_B || d.type === noteTypes.FX_R || d.type === noteTypes.FX_ALL) {
                            //check if fx type is specified
                            let present = false
                            let fxTypes = [noteTypes.FX_FILTER, noteTypes.FX_BEATROLL, noteTypes.FX_BITREDUCTION, noteTypes.FX_WAHWAH, noteTypes.FX_RINGMOD, noteTypes.FX_STUTTER, noteTypes.FX_FLANGER, noteTypes.FX_ROBOT, noteTypes.FX_BEATROLLAUTO, noteTypes.FX_DELAY]
                            for (let check of arr) {
                                if (fxTypes.includes(check.type) && check.time === d.time) {
                                    present = true
                                    break
                                }
                            }
                            if (!present) {
                                let data: noteData = {
                                    time: d.time,
                                    type: noteTypes.FX_FILTER,
                                    lane: d.lane,
                                    length: d.length,
                                    extra: 0
                                }
                                arr.push(data)
                            }
                        }
                    }
                    arr.sort((a, b) => a.time - b.time)
                    //console.log("Loaded chart", arr)
                    return bpm
                }
            }
        })
    }

    static parseBinaryInt(buffer: ArrayBuffer, startIndex: number) {
        if (startIndex + 3 < buffer.byteLength) {
            let numBuffer = new ArrayBuffer(4)
            let bufferByteView = new Uint8Array(buffer)
            let numByteView = new Uint8Array(numBuffer)
            let numIntView = new Int32Array(numBuffer)

            numByteView[0] = bufferByteView[startIndex + 3]
            numByteView[1] = bufferByteView[startIndex + 2]
            numByteView[2] = bufferByteView[startIndex + 1]
            numByteView[3] = bufferByteView[startIndex + 0]

            return numIntView[0]
        }
    }

    static parseBinaryFloat(binary: ArrayBuffer, startIndex: number) {
        if (startIndex + 3 < binary.byteLength) {
            let binaryAsChars = new Uint8Array(binary)
            let resBuffer = new ArrayBuffer(4)
            let resultAsChars = new Uint8Array(resBuffer)
            let resultAsFloat = new Float32Array(resBuffer)

            resultAsChars[0] = binaryAsChars[startIndex + 3]
            resultAsChars[1] = binaryAsChars[startIndex + 2]
            resultAsChars[2] = binaryAsChars[startIndex + 1]
            resultAsChars[3] = binaryAsChars[startIndex + 0]

            return resultAsFloat[0]
        }
    }

    static getCrossAtTime(time: number, arr: noteData[]): number {
        let cross = 1
        for (let note of arr) {
            if (note.time <= time) {
                if (note.type === noteTypes.CROSS_G) cross = 0
                else if (note.type === noteTypes.CROSS_C) cross = 1
                else if (note.type === noteTypes.CROSS_B) cross = 2
            } else if (note.time > time) break
        }
        return cross
    }

    static readerPromise(blob: Blob) {
        return new Promise<String | ArrayBuffer | null>((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsBinaryString(blob)
            reader.onloadend = (event) => resolve(reader.result)
            reader.onabort = (event) => reject()
        })
    }
}
