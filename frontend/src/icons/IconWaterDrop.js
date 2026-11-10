import * as React from "react";
const IconWaterDrop = React.forwardRef(({
  size = 24,
  title,
  titleId,
  ...props
}, ref) => /* @__PURE__ */ React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "currentColor", width: size, height: size, focusable: "false", "aria-hidden": title ? void 0 : true, role: title ? "img" : void 0, ref, "aria-labelledby": titleId, ...props }, title ? /* @__PURE__ */ React.createElement("title", { id: titleId }, title) : null, /* @__PURE__ */ React.createElement("path", { d: "M12 3.5C15 7 18.5 10 18.5 14c0 3.5-2.9 6.5-6.5 6.5s-6.5-3-6.5-6.5C5.5 10 9 7 12 3.5M12 7c-2 2.7-4.5 4.7-4.5 7 0 2.6 2 4.5 4.5 4.5s4.5-1.9 4.5-4.5c0-2.3-2.5-4.3-4.5-7" })));
IconWaterDrop.displayName = "IconWaterDrop";
var stdin_default = IconWaterDrop;
export {
  stdin_default as default
};
