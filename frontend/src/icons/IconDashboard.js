import * as React from "react";
const IconDashboard = React.forwardRef(({
  size = 24,
  title,
  titleId,
  ...props
}, ref) => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor", width: size, height: size, focusable: "false", "aria-hidden": title ? void 0 : true, role: title ? "img" : void 0, ref, "aria-labelledby": titleId, ...props }, title ? /* @__PURE__ */ React.createElement("title", { id: titleId }, title) : null, /* @__PURE__ */ React.createElement("path", { d: "M5.64 18.36a9 9 0 1 1 12.72 0 1 1 0 0 1-1.41-1.41 7 7 0 1 0-9.9 0 1 1 0 0 0-1.41 1.41" }), /* @__PURE__ */ React.createElement("rect", { width: 2, height: 2.6, x: 11, y: 3.4, rx: 1 }), /* @__PURE__ */ React.createElement("rect", { width: 2, height: 9.99, x: 11.7, y: 5.79, rx: 1, transform: "rotate(30 12.7 10.79)" }), /* @__PURE__ */ React.createElement("circle", { cx: 12, cy: 12, r: 1.6 })));
IconDashboard.displayName = "IconDashboard";
var stdin_default = IconDashboard;
export {
  stdin_default as default
};
