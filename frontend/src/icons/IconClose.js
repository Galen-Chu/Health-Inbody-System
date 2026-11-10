import * as React from "react";
const IconClose = React.forwardRef(({
  size = 24,
  title,
  titleId,
  ...props
}, ref) => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor", width: size, height: size, focusable: "false", "aria-hidden": title ? void 0 : true, role: title ? "img" : void 0, ref, "aria-labelledby": titleId, ...props }, title ? /* @__PURE__ */ React.createElement("title", { id: titleId }, title) : null, /* @__PURE__ */ React.createElement("rect", { width: 2, height: 18, x: 11, y: 3, rx: 1, transform: "rotate(45 12 12)" }), /* @__PURE__ */ React.createElement("rect", { width: 2, height: 18, x: 11, y: 3, rx: 1, transform: "rotate(-45 12 12)" })));
IconClose.displayName = "IconClose";
var stdin_default = IconClose;
export {
  stdin_default as default
};
