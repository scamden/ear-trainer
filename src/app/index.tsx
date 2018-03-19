// tslint:disable-next-line:no-unused-variable
import * as React from 'react';
import { render } from 'react-dom';
import { connect, Provider, } from 'react-redux';

// import * as classnames from 'classnames';


import { IDispatchProps, IStateProps, MainComponent } from '../lib';


(async () => {

  // dispatch any initial thunks here using store.dispatch(...)
  render(
    <MainComponent />,
    document.getElementById('app')
  );
})();
