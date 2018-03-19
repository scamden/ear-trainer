require('midi/inc/shim/Base64.js');
(window as any).Base64Binary = require('midi/inc/shim/Base64binary.js');
require('midi/inc/shim/WebAudioAPI.js');

require('midi/js/midi/audioDetect.js');
require('midi/js/midi/gm.js');
require('midi/js/midi/loader.js');
require('midi/js/midi/plugin.audiotag.js');
require('midi/js/midi/plugin.webaudio.js');
require('midi/js/midi/plugin.webmidi.js');

require('midi/js/util/dom_request_xhr.js');
require('midi/js/util/dom_request_script.js');



let midiLoaded: Promise<void>;

export const setInstrument = (instrument: string) => {
  midiLoaded = new Promise<void>((r) => {
    MIDI.loadPlugin({
      soundfontUrl: "http://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/",
      instrument,
      onprogress: function (state: any, progress: any) {
        console.log(state, progress);
      },
      onsuccess: function () {
        MIDI.programChange(0, MIDI.GM.byName[instrument].number);
        // play the note
        MIDI.setVolume(0, 127);
        r();
      }
    });
  });
}

setInstrument('acoustic_grand_piano')


export async function playNote(note: number, delay: number = 0) {
  await midiLoaded;
  var velocity = 127; // how hard the note hits
  MIDI.noteOn(0, note, velocity, delay);
  MIDI.noteOff(0, note, delay + 1);
}

export const INSTRUMENTS = [
  "accordion",
  "acoustic_bass",
  "acoustic_grand_piano",
  "acoustic_guitar_nylon",
  "acoustic_guitar_steel",
  "agogo",
  "alto_sax",
  "applause",
  "bagpipe",
  "banjo",
  "baritone_sax",
  "bassoon",
  "blown_bottle",
  "brass_section",
  "bright_acoustic_piano",
  "celesta",
  "cello",
  "choir_aahs",
  "church_organ",
  "clarinet",
  "clavinet",
  "contrabass",
  "distortion_guitar",
  "drawbar_organ",
  "dulcimer",
  "electric_bass_finger",
  "electric_bass_pick",
  "electric_grand_piano",
  "electric_guitar_clean",
  "electric_guitar_jazz",
  "electric_guitar_muted",
  "electric_piano_1",
  "electric_piano_2",
  "english_horn",
  "fiddle",
  "flute",
  "french_horn",
  "fretless_bass",
  "glockenspiel",
  "guitar_harmonics",
  "harmonica",
  "harpsichord",
  "honkytonk_piano",
  "kalimba",
  "koto",
  "lead_1_square",
  "lead_2_sawtooth",
  "lead_3_calliope",
  "lead_4_chiff",
  "lead_5_charang",
  "lead_6_voice",
  "lead_8_bass__lead",
  "marimba",
  "music_box",
  "muted_trumpet",
  "oboe",
  "ocarina",
  "orchestral_harp",
  "overdriven_guitar",
  "pad_1_new_age",
  "pad_2_warm",
  "pad_3_polysynth",
  "pad_4_choir",
  "pad_5_bowed",
  "pad_6_metallic",
  "pad_7_halo",
  "pad_8_sweep",
  "pan_flute",
  "percussion",
  "percussive_organ",
  "piccolo",
  "recorder",
  "reed_organ",
  "reverse_cymbal",
  "rock_organ",
  "shamisen",
  "shanai",
  "sitar",
  "slap_bass_1",
  "slap_bass_2",
  "soprano_sax",
  "steel_drums",
  "string_ensemble_1",
  "string_ensemble_2",
  "synth_bass_1",
  "synth_bass_2",
  "synth_brass_1",
  "synth_brass_2",
  "synth_choir",
  "synth_drum",
  "synth_strings_1",
  "synth_strings_2",
  "taiko_drum",
  "tango_accordion",
  "telephone_ring",
  "tenor_sax",
  "timpani",
  "tinkle_bell",
  "tremolo_strings",
  "trombone",
  "trumpet",
  "tuba",
  "tubular_bells",
  "vibraphone",
  "viola",
  "violin",
  "voice_oohs",
  "whistle",
  "woodblock",
  "xylophone"
];