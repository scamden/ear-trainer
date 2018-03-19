// This file is custom package setup only. This is not the place for global utilities

import 'raf/polyfill';

import {
  configure
} from 'enzyme';
import Adapter = require('enzyme-adapter-react-16');

configure({
  adapter: new Adapter()
});