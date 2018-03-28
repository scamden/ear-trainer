// tslint:disable-next-line:no-unused-variable
import * as React from 'react';
import { Component } from 'react';
import toastr = require('toastr');
import 'toastr/toastr.scss';
import _map = require('lodash/map');
import _reduce = require('lodash/reduce');
import _range = require('lodash/range');

import * as classnames from 'classnames';

import { playNote, INSTRUMENTS, setInstrument, midiLoaded } from '../util/midi';

export interface IStateProps {
  className?: string;
}

export interface IDispatchProps {
}

export interface IProps extends IDispatchProps, IStateProps { }

export interface IState {
  settingsOpen?: boolean;
  statsOpen?: boolean;
  currentNotes?: number[];
  currentInterval?: number;
  currentInstruments?: string[];
  shouldPlayIntervalHarmonically?: boolean;
  stats: IStats;
  options: IOptions;
  loading: boolean;
}

export interface IStats {
  total: number;
  correct: number;
}


const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#',]
const keyTypes = ['Major', 'Minor',];
const scalePatterns: Record<string, number[]> = {
  Major: [2, 2, 1, 2, 2, 2, 1],
  Minor: [2, 1, 2, 2, 1, 2, 2,],
}

export interface IOptions {
  ascending: boolean;
  descending: boolean;
  harmonic: boolean;
  keyRoot: string;
  keyType: string;
  mix: boolean;
  instruments: string[];
}

const intervals = {
  0: 'Unison',
  1: 'Semitone',
  2: 'Tone',
  3: 'Minor 3rd',
  4: 'Major 3rd',
  5: 'Perfect 4th',
  6: 'Tritone',
  7: 'Perfect 5th',
  8: 'Minor 6th',
  9: 'Major 6th',
  10: 'Minor 7th',
  11: 'Major 7th',
  12: 'Octave',
}

const sortedIntervals: Array<keyof typeof intervals> = Object.keys(intervals).sort((a, b) => {
  return parseInt(b, 10) - parseInt(a, 10);
}) as any;

const notesByOctave: Record<string, number[]> =
  {
    0: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,],
    1: [24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,],
    2: [36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47,],
    3: [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59,],
    4: [60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71,],
    5: [72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83,],
    6: [84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95,],
    7: [96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107,],
    8: [108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119,],
  }
function getValidNotesForKey(root: string, type: string) {
  const firstIndex = keys.indexOf(root);
  if (firstIndex === -1) {
    return _range(0, 127);
  }
  let scaleDegree = 0;
  let notes = [];
  const pattern = scalePatterns[type];
  for (let note = firstIndex; note <= 127; note += pattern[scaleDegree++ % pattern.length]) {
    notes.push(note);
  }
  return notes;
}

function getKeyInOctave(octave: number, key: string) {
  const firstIndex = keys.indexOf(key);
  if (firstIndex === -1) {
    return undefined;
  }
  return notesByOctave[octave][firstIndex];
}

export class MainComponent extends Component<IProps, IState> {

  constructor(props: IProps) {
    super(props);
    const savedOpts = localStorage.getItem('ear-trainer-options');
    const options = savedOpts && JSON.parse(savedOpts) || {
      instruments: ['acoustic_grand_piano'],
      ascending: true,
      descending: true,
      harmonic: true,
      keyRoot: keys[0],
      keyType: 'Major',
      mix: false,
    };
    this.state = {
      stats: {
        total: 0,
        correct: 0,
      },
      options,
      loading: true
    };
    midiLoaded.then(() => {
      this.setState({ loading: false });
    });
  }


  getStateForNextInterval() {
    const key = this.state.options.keyRoot;
    const notes = getValidNotesForKey(key, this.state.options.keyType)
      .filter(note => note >= (getKeyInOctave(2, key) || 45) && note <= (getKeyInOctave(4, key) || 63));

    const noteIndex = Math.floor(Math.random() * notes.length);
    const note = notes[noteIndex];
    const allowedIntervals = scalePatterns[this.state.options.keyType]
      .reduce((accum, interval) => [...accum, accum[accum.length - 1] + interval], [0]);
    const secondNotes = notes.filter((n) => allowedIntervals.indexOf(Math.abs(note - n)) !== -1);
    const secondNote = secondNotes[Math.floor(Math.random() * secondNotes.length)];
    const onlyDescending = this.state.options.descending && !this.state.options.ascending;
    const onlyAscending = !this.state.options.descending && this.state.options.ascending;
    const firstInstrument = this.chooseInstrument();
    const currentInstruments = [firstInstrument, this.state.options.mix ? this.chooseInstrument() : firstInstrument];
    return {
      currentNotes: [note, secondNote].sort((a, b) => {
        if (onlyDescending) {
          return b - a;
        }
        if (onlyAscending) {
          return a - b
        }
        return 0;
      }),
      currentInterval: Math.abs(note - secondNote),
      shouldPlayIntervalHarmonically: this.shouldPlayIntervalHarmonically(),
      currentInstruments,
    };
  }

  shouldPlayIntervalHarmonically() {
    const num = this.state.options.harmonic ? 1 : 0;
    let denom = 1;
    denom += this.state.options.ascending ? 1 : 0;
    denom += this.state.options.descending ? 1 : 0;
    return Math.random() > 1 - num / denom;
  }

  chooseInstrument() {
    return this.state.options.instruments[Math.floor(Math.random() * this.state.options.instruments.length)];
  }

  async playFromState(state: Pick<IState, 'currentNotes' | 'shouldPlayIntervalHarmonically'>) {
    if (state.currentNotes == undefined) {
      return;
    }
    setInstrument(this.state.currentInstruments && this.state.currentInstruments[0] || 'acoustic_grand_piano');
    await playNote(state.currentNotes[0]);
    setInstrument(this.state.currentInstruments && this.state.currentInstruments[1] || 'acoustic_grand_piano');
    await playNote(state.currentNotes[1], state.shouldPlayIntervalHarmonically ? 0 : 1);
  }

  async playRandomInterval() {
    const state = this.getStateForNextInterval();
    await this.playFromState(state);
    this.setState(state);
    return state.currentInterval;
  }

  repeat = () => {
    if (!this.state.currentNotes) {
      return;
    }
    this.playFromState(this.state);
  }

  getLongTermStats(): IStats {
    const statsString = localStorage.getItem('ear-trainer-stats');
    if (statsString) {
      return JSON.parse(statsString);
    }
    return {
      total: 0,
      correct: 0,
    }
  }

  setLongTermStats(stats: IStats) {
    localStorage.setItem('ear-trainer-stats', JSON.stringify(stats));
  }

  identityInterval(interval: number) {
    toastr.remove();
    const correct = interval === this.state.currentInterval;
    if (correct) {
      toastr.success(`Correct! ${this.state.currentNotes && this.state.currentNotes.map(note => keys[note % 12]).join(' -> ') || ''}`)
    } else {
      toastr.error(`Incorrect: it was "${intervals[this.state.currentInterval as any as keyof typeof intervals]}"`)
    }
    const stats = {
      ...this.state.stats,
      total: this.state.stats.total + 1,
      correct: this.state.stats.correct + (correct ? 1 : 0),
    };
    this.setState({
      stats
    });

    const longTermStats = this.getLongTermStats();
    this.setLongTermStats({
      ...longTermStats,
      total: longTermStats.total + 1,
      correct: longTermStats.correct + (correct ? 1 : 0),
    })

    setTimeout(() => {
      this.playRandomInterval();
    }, 500)
  }

  setOptions = (partialOpts: Partial<IOptions>) => {
    const options = { ...this.state.options, ...partialOpts };
    this.setState({ options });
    localStorage.setItem('ear-trainer-options', JSON.stringify(options));
  }

  toggleSettings = () => {
    this.setState({ settingsOpen: !this.state.settingsOpen });
  }
  toggleStats = () => {
    this.setState({ statsOpen: !this.state.statsOpen });
  }

  private renderIntervals(ints: Array<keyof typeof intervals>) {
    return ints.map((intervalNumber) =>
      <button className="btn btn-lg btn-light d-block mt-2 btn-block" key={intervalNumber} onClick={() => {
        this.identityInterval(parseInt(intervalNumber, 10))
      }}>{intervals[intervalNumber]}</button>
    )
  }

  render() {
    const { className } = this.props;
    const longStats = this.getLongTermStats();
    return (
      <div className={classnames(className, 'p-3 d-flex flex-column')}>
        <div>
          <h1 className="ml-3">Ear Trainer</h1>
          <div className={classnames('ml-3 collapse', { 'show': this.state.statsOpen })}>
            <div>{this.state.stats.correct} out of {this.state.stats.total} correct</div>
            <div>Avg Correct: {((this.state.stats.correct / (this.state.stats.total || 1)) * 100).toFixed(2)}%</div>
            <div>{longStats.correct} out of {longStats.total} correct long term</div>
            <div>Avg Correct Long Term: {((longStats.correct / (longStats.total || 1)) * 100).toFixed(2)}%</div>
          </div>
        </div>
        <div className="btn-toolbar" role="toolbar" aria-label="Toolbar with button groups">
          <div className="btn-group ml-3 mt-2" role="group" aria-label="Basic example">
            <button className="btn btn-md btn-primary" disabled={this.state.loading} onClick={() => {
              const interval = this.playRandomInterval();
            }}>{this.state.loading && 'Loading...' || 'Begin'}</button>
            <button className="btn btn-md btn-primary" onClick={this.repeat}>Repeat</button>
          </div>
          <div className="btn-group btn-group-toggle ml-3 mt-2" role="group" aria-label="Basic example">
            <button onClick={this.toggleSettings} className={classnames("btn btn-md btn-light", { 'active': this.state.settingsOpen })}>Settings</button>
            <button onClick={this.toggleStats} className={classnames("btn btn-md btn-light", { 'active': this.state.statsOpen })}>Stats</button>
          </div>
          <div className={classnames('collapse', { 'show': this.state.settingsOpen })}>
            <div className="btn-group btn-group-toggle ml-3 mt-2" role="group" aria-label="Basic example">
              <button type="button" onClick={
                () => { this.setOptions({ ascending: !this.state.options.ascending }) }
              } className={classnames({ 'active': this.state.options.ascending }, "btn btn-light")}>Ascending</button>
              <button type="button" onClick={
                () => { this.setOptions({ descending: !this.state.options.descending }) }
              } className={classnames({ 'active': this.state.options.descending }, "btn btn-light")}>Descending</button>
              <button type="button" onClick={
                () => { this.setOptions({ harmonic: !this.state.options.harmonic }) }
              } className={classnames({ 'active': this.state.options.harmonic }, "btn btn-light")}>Harmonic</button>
            </div>
            <div className="btn-group ml-3 mt-2" role="group" aria-label="Basic example">
              <div className="input-group">
                <div className="input-group-prepend">
                  <span className="input-group-text" id="inputGroup-sizing-default">Constrain to key: </span>
                </div>
                <select
                  className="custom-select"
                  value={this.state.options.keyRoot}
                  onChange={(e) => { this.setOptions({ keyRoot: e.target.value }) }}
                >
                  <option value="">-</option>
                  {keys.map((keyRoot) => <option key={keyRoot} value={keyRoot}>{keyRoot}</option>)}
                </select>
              </div>
            </div>
            <div className="btn-group ml-3 mt-2" role="group" aria-label="Basic example">
              <div className="input-group">
                <div className="input-group-prepend">
                  <span className="input-group-text" id="inputGroup-sizing-default">Select instruments: </span>
                </div>
                <select
                  className="custom-select"
                  multiple={true}
                  defaultValue={this.state.options.instruments}
                  onChange={(e) => {
                    const instruments = Array.from(e.target.selectedOptions).map(o => o.value);
                    this.setOptions({ instruments });
                  }}
                >
                  {INSTRUMENTS.map((instrument) => <option key={instrument} value={instrument} >{instrument}</option>)}
                </select>
              </div>
            </div>
            <div className="btn-group btn-group-toggle ml-3 mt-2" role="group" aria-label="Basic example">
              <button type="button" onClick={
                () => { this.setOptions({ mix: !this.state.options.mix }) }
              } className={classnames({ 'active': this.state.options.mix }, 'btn btn-light')}>Mix Instruments</button>

            </div>
          </div>
        </div>

        {
          this.state.currentInterval != null &&
          <div className="flex-row d-flex">

            <div className="mt-3 w-50 mr-1">
              The interval was
              {this.renderIntervals(sortedIntervals.filter((int, i) => i < 6))}
            </div>
            <div className="mt-3 w-50 ml-1">
              {this.renderIntervals(sortedIntervals.filter((int, i) => i >= 6))}
            </div>
          </div>
        }
      </div>
    );
  }
}
