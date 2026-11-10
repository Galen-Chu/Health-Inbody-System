import * as React from "react";
const BrandLogoMark = React.forwardRef(({
  size = 24,
  title,
  titleId,
  ...props
}, ref) => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 32 32", width: size, height: size, focusable: "false", "aria-hidden": title ? void 0 : true, role: title ? "img" : void 0, ref, "aria-labelledby": titleId, ...props }, title ? /* @__PURE__ */ React.createElement("title", { id: titleId }, title) : null, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("clipPath", { id: "uc-logo-mark-a" }, /* @__PURE__ */ React.createElement("rect", { width: 32, height: 32, rx: 8 }))), /* @__PURE__ */ React.createElement("g", { clipPath: "url(#uc-logo-mark-a)" }, /* @__PURE__ */ React.createElement("path", { fill: "#167839", d: "M0 0h32v32H0z" }), /* @__PURE__ */ React.createElement("circle", { cx: 22, cy: 10, r: 10, fill: "#009CAD" }), /* @__PURE__ */ React.createElement("path", { stroke: "#FFF", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 3, d: "M21.2 11.3a7.3 7.3 0 1 0 2.1 5.2H17" }), /* @__PURE__ */ React.createElement("circle", { cx: 25, cy: 25, r: 2.5, fill: "#E7D24E" }))));
BrandLogoMark.displayName = "BrandLogoMark";
var stdin_default = BrandLogoMark;
export {
  stdin_default as default
};
