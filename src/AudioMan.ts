export enum sourceID {
    AUDIO_G,
    AUDIO_R,
    AUDIO_B
}

export class AudioMan {
    context: AudioContext
    sources: AudioBufferSourceNode[] = []
    buffers: AudioBuffer[] = []
    gains: GainNode[] = []
    playing: number[] = []
    startingTimes: number[] = []

    constructor() {
        this.context = new window.AudioContext()
        console.log(this.context)
        for (let i = 0; i < 3; ++i) {
            let volume = this.context.createGain()
            this.gains.push(volume)
            this.playing.push(0)
            this.startingTimes.push(0)
        }
    }

    loadFile(arrayBuffer: ArrayBuffer, destination: sourceID) {
        this.context.decodeAudioData(arrayBuffer).then((buffer) => {
            this.buffers[destination] = buffer
        })
    }

    tick() {
        for (let i = 0; i < this.playing.length; ++i) {
            if (this.startingTimes[i] > 0) {
                this.playing[i] = this.context.currentTime - this.startingTimes[i]
            }
        }
    }

    playSource(destination: sourceID, startTime: number) {
        if (this.playing[destination] == 0 && this.buffers[destination]) {
            let source = this.context.createBufferSource()
            this.sources[destination] = source
            this.startingTimes[destination] = this.context.currentTime
            source.buffer = this.buffers[destination]
            source.connect(this.gains[destination]).connect(this.context.destination)
            if (startTime >= 0) source.start(0, startTime)
            else {
                source.start(this.context.currentTime + startTime * -1, 0)
            }
        }
    }

    stopSource(destination: sourceID) {
        if (this.playing[destination] > 0) {
            this.sources[destination].stop()
            this.startingTimes[destination] = 0
            this.playing[destination] = 0
        }
    }

    isSourcePlaying(id: sourceID) {
        return this.playing[id] > 0
    }

    getSourceTime(id: sourceID) {
        return this.playing[id]
    }

    setSourceGain(id: sourceID, gain: number) {
        this.gains[id].gain.value = gain
    }
}
