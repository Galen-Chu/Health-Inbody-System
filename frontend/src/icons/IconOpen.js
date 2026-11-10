import * as React from "react";
const IconOpen = React.forwardRef(({
  size = 24,
  title,
  titleId,
  ...props
}, ref) => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor", width: size, height: size, focusable: "false", "aria-hidden": title ? void 0 : true, role: title ? "img" : void 0, ref, "aria-labelledby": titleId, ...props }, title ? /* @__PURE__ */ React.createElement("title", { id: titleId }, title) : null, /* @__PURE__ */ React.createElement("path", { d: "M5 9h10q2 0 2 2v8q0 2-2 2H5q-2 0-2-2v-8q0-2 2-2m0 2v8h10v-8Z" }), /* @__PURE__ */ React.createElement("rect", { width: 2, height: 15.44, x: 12.25, y: 3.03, rx: 1, transform: "rotate(-135 13.25 10.75)" }), /* @__PURE__ */ React.createElement("rect", { width: 8, height: 2, x: 12.5, y: 3.5, rx: 1 }), /* @__PURE__ */ React.createElement("rect", { width: 2, height: 8.5, x: 18.5, y: 3.5, rx: 1 })));
IconOpen.displayName = "IconOpen";
var stdin_default = IconOpen;
export {
  stdin_default as default
};
