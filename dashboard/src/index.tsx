import React from 'react';
import ReactDOM from 'react-dom';
import Root from "./Root";
import {RecoilRoot} from "recoil";

ReactDOM.render(
  <React.StrictMode>
    <RecoilRoot>
        <Root />
    </RecoilRoot>
  </React.StrictMode>,
  document.getElementById('root')
);
