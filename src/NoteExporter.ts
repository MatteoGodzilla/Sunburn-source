import { noteData } from "./CustomTypes"
import { saveAs } from "file-saver"

export class NoteExporter {
	static exportToFile(arr: noteData[]) {
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
}
