"use strict";
const common_vendor = require("../common/vendor.js");
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "OrganicBackground",
  props: {
    color: {
      type: String,
      default: "#31C48D"
    },
    opacity: {
      type: Number,
      default: 0.3
    },
    animationSpeed: {
      type: Number,
      default: 20
    }
  },
  setup(__props) {
    return (_ctx, _cache) => {
      return {
        a: `${__props.color}4d`,
        b: `${__props.animationSpeed + 5}s`,
        c: `${__props.color}33`,
        d: `${__props.animationSpeed}s`,
        e: `${__props.color}26`,
        f: `${__props.animationSpeed + 10}s`,
        g: `${__props.color}1a`,
        h: `${__props.animationSpeed + 15}s`
      };
    };
  }
});
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-b9f10b13"]]);
wx.createComponent(Component);
