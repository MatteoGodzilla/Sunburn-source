export enum noteTypes {
    TAP_G,
    TAP_B,
    TAP_R,
    SCR_G_UP,
    SCR_B_UP,
    SCR_G_DOWN,
    SCR_B_DOWN,
    SCR_G_ANYDIR,
    SCR_B_ANYDIR,
    CROSS_B,
    CROSS_C,
    CROSS_G,
    FX_G,
    FX_B,
    FX_R,
    EUPHORIA,
    FS_SAMPLES,
    FS_CROSS,
    SCR_G_ZONE = 20,
    SCR_B_ZONE,
    FX_ALL,
    CROSS_FORCE_CENTER,
    BATTLE_MARKER = 26,
    CF_SPIKE_G,
    CF_SPIKE_B,
    CF_SPIKE_C,
    MEGAMIX_TRANSITION,
    FS_CF_G_MARKER,
    FS_CF_B_MARKER,
    FX_FILTER = 0x05ffffff,
    FX_BEATROLL,
    FX_BITREDUCTION,
    FX_WAHWAH,
    FX_RINGMOD,
    FX_STUTTER,
    FX_FLANGER,
    FX_ROBOT,
    FX_BEATROLLAUTO,
    FX_DELAY = 0x06000009,
    STRING = 0x0affffff,
    BPM_FAKE = 0x0b000001,
    BPM,
    REWIND = 0x09ffffff
}

export interface noteData {
    type: noteTypes
    time: number
    lane: number
    length: number
    extra: number
    selected?: boolean
}

const typeToString: Record<noteTypes, string> = {
    [noteTypes.TAP_G]: "Green Tap",
    [noteTypes.TAP_B]: "Blue Tap",
    [noteTypes.TAP_R]: "Red Tap",
    [noteTypes.SCR_G_UP]: "Scratch Green Up",
    [noteTypes.SCR_B_UP]: "Scratch Blue Up",
    [noteTypes.SCR_G_DOWN]: "Scratch Green Down",
    [noteTypes.SCR_B_DOWN]: "Scratch Blue Down",
    [noteTypes.SCR_G_ANYDIR]: "Scratch Green Anydir",
    [noteTypes.SCR_B_ANYDIR]: "Scratch Blue Anydir",
    [noteTypes.CROSS_B]: "Crossfade Blue",
    [noteTypes.CROSS_C]: "Crossfade Center",
    [noteTypes.CROSS_G]: "Crossfade Green",
    [noteTypes.FX_G]: "Effects Green",
    [noteTypes.FX_B]: "Effects Blue",
    [noteTypes.FX_R]: "Effects Red",
    [noteTypes.EUPHORIA]: "Euphoria",
    [noteTypes.FS_SAMPLES]: "Freestyle Samples",
    [noteTypes.FS_CROSS]: "Freestyle Crossfade",
    [noteTypes.SCR_G_ZONE]: "Scratch Zone Green",
    [noteTypes.SCR_B_ZONE]: "Scratch Zone Blue",
    [noteTypes.FX_ALL]: "Effects All",
    [noteTypes.CROSS_FORCE_CENTER]: "Crossfade Force Center",
    [noteTypes.BATTLE_MARKER]: "DJ Battle Marker",
    [noteTypes.CF_SPIKE_G]: "Crossfade Spike Green",
    [noteTypes.CF_SPIKE_B]: "Crossfade Spike Blue",
    [noteTypes.CF_SPIKE_C]: "Crossfade Spike Center",
    [noteTypes.MEGAMIX_TRANSITION]: "Megamix Marker",
    [noteTypes.FS_CF_G_MARKER]: "Freestyle Crossfade Green Marker",
    [noteTypes.FS_CF_B_MARKER]: "Freestyle Crossfade Blue Marker",
    [noteTypes.FX_FILTER]: "Effects Filter type",
    [noteTypes.FX_BEATROLL]: "Effects Beatroll type",
    [noteTypes.FX_BITREDUCTION]: "Effects Bit Reduction type",
    [noteTypes.FX_WAHWAH]: "Effects Wah Wah type",
    [noteTypes.FX_RINGMOD]: "Effects Ringmod type",
    [noteTypes.FX_STUTTER]: "Effects Stutter type",
    [noteTypes.FX_FLANGER]: "Effects Flanger type",
    [noteTypes.FX_ROBOT]: "Effects Robot type",
    [noteTypes.FX_BEATROLLAUTO]: "Effects Beatroll Auto-advance type",
    [noteTypes.FX_DELAY]: "Effects Delay type",
    [noteTypes.STRING]: "String Data",
    [noteTypes.BPM_FAKE]: "Bpm Change",
    [noteTypes.BPM]: "Base BPM",
    [noteTypes.REWIND]: "Rewind Marker"
}

export function getTypeStringName(type: noteTypes) {
    let ids = []
    for (let elm in noteTypes) {
        ids.push(elm)
    }
    return ids.includes(type.toString()) ? typeToString[type] : "Unknown ID"
}
