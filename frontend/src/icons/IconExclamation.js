import * as React from "react";
const IconExclamation = React.forwardRef(({
  size = 24,
  title,
  titleId,
  ...props
}, ref) => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor", width: size, height: size, focusable: "false", "aria-hidden": title ? void 0 : true, role: title ? "img" : void 0, ref, "aria-labelledby": titleId, ...props }, title ? /* @__PURE__ */ React.createElement("title", { id: titleId }, title) : null, /* @__PURE__ */ React.createElement("rect", { width: 2, height: 11, x: 11, y: 4, rx: 1 }), /* @__PURE__ */ React.createElement("circle", { cx: 12, cy: 19, r: 1.5 })));
IconExclamation.displayName = "IconExclamation";
var stdin_default = IconExclamation;
export {
  stdin_default as default
};
