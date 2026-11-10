import * as React from "react";
const IconDiary = React.forwardRef(({
  size = 24,
  title,
  titleId,
  ...props
}, ref) => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor", width: size, height: size, focusable: "false", "aria-hidden": title ? void 0 : true, role: title ? "img" : void 0, ref, "aria-labelledby": titleId, ...props }, title ? /* @__PURE__ */ React.createElement("title", { id: titleId }, title) : null, /* @__PURE__ */ React.createElement("path", { d: "M6 4h12q2 0 2 2v12q0 2-2 2H6q-2 0-2-2V6q0-2 2-2m0 2v12h12V6Z" }), /* @__PURE__ */ React.createElement("rect", { width: 2.5, height: 6, x: 14, y: 2.5, rx: 1.25 }), /* @__PURE__ */ React.createElement("rect", { width: 8, height: 1.8, x: 8, y: 9, rx: 0.9 }), /* @__PURE__ */ React.createElement("rect", { width: 8, height: 1.8, x: 8, y: 13, rx: 0.9 })));
IconDiary.displayName = "IconDiary";
var stdin_default = IconDiary;
export {
  stdin_default as default
};
