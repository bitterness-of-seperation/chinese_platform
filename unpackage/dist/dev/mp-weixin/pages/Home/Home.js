"use strict";
const common_vendor = require("../../common/vendor.js");
const utils_auth = require("../../utils/auth.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  (OrganicBackground + _easycom_uni_icons)();
}
const OrganicBackground = () => "../../components/OrganicBackground.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "Home",
  setup(__props) {
    const pageLoaded = common_vendor.ref(false);
    common_vendor.ref("home");
    const modules = [
      {
        id: "assistant",
        title: "AI Assistant",
        description: "Ask me anything",
        icon: "chatbubble",
        color: "#4ade80",
        route: "/pages/Assistant/Assistant"
      },
      {
        id: "dictionary",
        title: "Dictionary",
        description: "Look up word meanings",
        icon: "compose",
        color: "#10b981",
        route: "/pages/Dictionary/Dictionary"
      },
      {
        id: "vocabulary",
        title: "Vocabulary",
        description: "Learn new words efficiently",
        icon: "flag",
        color: "#fbbf24",
        route: "/pages/WordProgress/WordProgress"
      },
      {
        id: "exercises",
        title: "Exercises",
        description: "Reinforce what you learned",
        icon: "checkbox",
        color: "#60a5fa",
        route: "/pages/WordExercise/WordExercise"
      }
    ];
    const navigateTo = (route) => {
      common_vendor.index.navigateTo({
        url: route,
        fail: (e) => {
          console.error("navigateTo failed", e);
          common_vendor.index.redirectTo({
            url: route,
            fail: (err) => {
              console.error("redirectTo also failed", err);
            }
          });
        }
      });
    };
    common_vendor.onMounted(() => {
      setTimeout(() => {
        pageLoaded.value = true;
      }, 100);
    });
    common_vendor.onMounted(() => {
      utils_auth.handlePageAuth();
    });
    return (_ctx, _cache) => {
      return {
        a: common_vendor.p({
          color: "#31C48D",
          opacity: 0.3,
          animationSpeed: 20
        }),
        b: common_vendor.f(modules, (module, index, i0) => {
          return {
            a: "7ffebbf4-1-" + i0,
            b: common_vendor.p({
              type: module.icon,
              size: "28",
              color: "white"
            }),
            c: common_vendor.t(module.title),
            d: common_vendor.t(module.description),
            e: module.id,
            f: `${(index + 1) * 0.1}s`,
            g: `${index % 2 ? 1 : -1}deg`,
            h: module.color,
            i: common_vendor.o(($event) => navigateTo(module.route), module.id)
          };
        }),
        c: pageLoaded.value ? 1 : ""
      };
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-7ffebbf4"]]);
wx.createPage(MiniProgramPage);
