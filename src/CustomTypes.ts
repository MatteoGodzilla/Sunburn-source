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
	BATTLE_SWITCH = 26,
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
	FX_DELAY = 0x60000009,
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
