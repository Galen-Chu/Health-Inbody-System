import * as React from "react";
const IconSearch = React.forwardRef(({
  size = 24,
  title,
  titleId,
  ...props
}, ref) => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor", width: size, height: size, focusable: "false", "aria-hidden": title ? void 0 : true, role: title ? "img" : void 0, ref, "aria-labelledby": titleId, ...props }, title ? /* @__PURE__ */ React.createElement("title", { id: titleId }, title) : null, /* @__PURE__ */ React.createElement("path", { d: "M10.5 3a7.5 7.5 0 1 1 0 15 7.5 7.5 0 1 1 0-15m0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 1 0 0-11" }), /* @__PURE__ */ React.createElement("path", { d: "m15.707 14.293 5 5a1 1 0 0 1-1.414 1.414l-5-5a1 1 0 0 1 1.414-1.414" })));
IconSearch.displayName = "IconSearch";
var stdin_default = IconSearch;
export {
  stdin_default as default
};
