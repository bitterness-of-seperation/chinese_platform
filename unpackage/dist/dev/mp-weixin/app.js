"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const common_vendor = require("./common/vendor.js");
const stores_user = require("./stores/user.js");
if (!Math) {
  "./pages/Blank/Blank.js";
  "./pages/Home/Home.js";
  "./pages/Profile/Profile.js";
  "./pages/Assistant/Assistant.js";
  "./pages/Dictionary/Dictionary.js";
  "./pages/WordExercise/WordExercise.js";
  "./pages/WordProgress/WordProgress.js";
  "./pages/WordLearning/WordLearning.js";
}
const _sfc_main$1 = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "Layout",
  setup(__props) {
    return (_ctx, _cache) => {
      return {};
    };
  }
});
const Layout = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main$1, [["__scopeId", "data-v-9cab4b4c"]]);
const _sfc_main = {
  components: {
    Layout
  },
  onLaunch: async function() {
    console.log("App Launch");
    const userStore = stores_user.useUserStore();
    try {
      const isValid = await userStore.validateToken();
      if (!isValid) {
        common_vendor.index.reLaunch({
          url: "/pages/Profile/Profile"
        });
      } else {
        common_vendor.index.switchTab({
          url: "/pages/Home/Home"
        });
      }
    } catch (error) {
      console.error("启动时验证token失败：", error);
      userStore.logout();
      common_vendor.index.reLaunch({
        url: "/pages/Profile/Profile"
      });
    }
  },
  onShow: function() {
    console.log("App Show");
  },
  onHide: function() {
    console.log("App Hide");
  }
};
if (!Array) {
  const _component_Layout = common_vendor.resolveComponent("Layout");
  _component_Layout();
}
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {};
}
const App = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render]]);
function createApp() {
  const app = common_vendor.createSSRApp(App);
  const pinia = common_vendor.createPinia();
  app.use(pinia);
  return {
    app
  };
}
createApp().app.mount("#app");
exports.createApp = createApp;
