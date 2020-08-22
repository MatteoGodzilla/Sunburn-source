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

export function getTypeStringName(type: noteTypes) {
	switch (type) {
		case noteTypes.TAP_G:
			return "Green Tap"
		case noteTypes.TAP_B:
			return "Blue Tap"
		case noteTypes.TAP_R:
			return "Red Tap"
		case noteTypes.SCR_G_UP:
			return "Scratch Green Up"
		case noteTypes.SCR_B_UP:
			return "Scratch Blue Up"
		case noteTypes.SCR_G_DOWN:
			return "Scratch Green Down"
		case noteTypes.SCR_B_DOWN:
			return "Scratch Blue Down"
		case noteTypes.SCR_G_ANYDIR:
			return "Scratch Green Anydir"
		case noteTypes.SCR_B_ANYDIR:
			return "Scratch Blue Anydir"
		case noteTypes.CROSS_B:
			return "Crossfade Blue"
		case noteTypes.CROSS_C:
			return "Crossfade Center"
		case noteTypes.CROSS_G:
			return "Crossfade Green"
		case noteTypes.FX_G:
			return "Effects Green"
		case noteTypes.FX_B:
			return "Effects Blue"
		case noteTypes.FX_R:
			return "Effects Red"
		case noteTypes.EUPHORIA:
			return "Euphoria"
		case noteTypes.FS_SAMPLES:
			return "Freestyle Samples"
		case noteTypes.FS_CROSS:
			return "Freestyle Crossfade"
		case noteTypes.SCR_G_ZONE:
			return "Scratch Zone Green"
		case noteTypes.SCR_B_ZONE:
			return "Scratch Zone Blue"
		case noteTypes.FX_ALL:
			return "Effects All"
		case noteTypes.CROSS_FORCE_CENTER:
			return "Crossfade Force Center"
		case noteTypes.BATTLE_MARKER:
			return "DJ Battle Marker"
		case noteTypes.CF_SPIKE_G:
			return "Crossfade Spike Green"
		case noteTypes.CF_SPIKE_B:
			return "Crossfade Spike Blue"
		case noteTypes.CF_SPIKE_C:
			return "Crossfade Spike Center"
		case noteTypes.MEGAMIX_TRANSITION:
			return "Megamix Marker"
		case noteTypes.FS_CF_G_MARKER:
			return "Freestyle Crossfade Green Marker"
		case noteTypes.FS_CF_B_MARKER:
			return "Freestyle Crossfade Blue Marker"
		case noteTypes.FX_FILTER:
			return "Effects Filter type"
		case noteTypes.FX_BEATROLL:
			return "Effects Beatroll type"
		case noteTypes.FX_BITREDUCTION:
			return "Effects Bit Reduction type"
		case noteTypes.FX_WAHWAH:
			return "Effects Wah Wah type"
		case noteTypes.FX_RINGMOD:
			return "Effects Ringmod type"
		case noteTypes.FX_STUTTER:
			return "Effects Stutter type"
		case noteTypes.FX_FLANGER:
			return "Effects Flanger type"
		case noteTypes.FX_ROBOT:
			return "Effects Robot type"
		case noteTypes.FX_BEATROLLAUTO:
			return "Effects Beatroll Auto-advance type"
		case noteTypes.FX_DELAY:
			return "Effects Delay type"
		case noteTypes.STRING:
			return "String Data"
		case noteTypes.BPM_FAKE:
			return "Bpm Change"
		case noteTypes.BPM:
			return "Base BPM"
		case noteTypes.REWIND:
			return "Rewind Marker"
		default:
			return "Unknown ID"
	}
}
