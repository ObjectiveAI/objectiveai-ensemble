import { render } from "ink";
import React from "react";
import { App } from "./tui/App";

render(React.createElement(App), {
  alternateBuffer: true,
  incrementalRendering: true,
  patchConsole: false,
});
