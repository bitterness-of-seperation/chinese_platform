"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_user = require("../../stores/user.js");
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
  __name: "Profile",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const isRegistering = common_vendor.ref(false);
    const isFormValid = common_vendor.ref(false);
    const formData = common_vendor.reactive({
      username: "",
      password: "",
      nickname: ""
    });
    const validateForm = () => {
      isFormValid.value = formData.username.length >= 3 && formData.password.length >= 6;
    };
    const toggleMode = () => {
      isRegistering.value = !isRegistering.value;
      formData.nickname = "";
      validateForm();
    };
    const handleSubmit = async () => {
      if (!isFormValid.value)
        return;
      try {
        if (isRegistering.value) {
          await userStore.register({
            username: formData.username,
            password: formData.password,
            nickname: formData.nickname
          });
          common_vendor.index.showToast({
            title: "注册成功",
            icon: "success"
          });
        } else {
          await userStore.login({
            username: formData.username,
            password: formData.password
          });
          common_vendor.index.showToast({
            title: "登录成功",
            icon: "success"
          });
        }
        formData.username = "";
        formData.password = "";
        formData.nickname = "";
      } catch (error) {
        common_vendor.index.showToast({
          title: error.message || "操作失败",
          icon: "error"
        });
      }
    };
    const handleLogout = () => {
      common_vendor.index.showModal({
        title: "提示",
        content: "确定要退出登录吗？",
        success: (res) => {
          if (res.confirm) {
            userStore.logout();
            common_vendor.index.showToast({
              title: "已退出登录",
              icon: "success"
            });
          }
        }
      });
    };
    const handleSettings = () => {
      common_vendor.index.showToast({
        title: "功能开发中",
        icon: "none"
      });
    };
    const handleFeedback = () => {
      common_vendor.index.showToast({
        title: "功能开发中",
        icon: "none"
      });
    };
    const handleAbout = () => {
      common_vendor.index.showToast({
        title: "功能开发中",
        icon: "none"
      });
    };
    return (_ctx, _cache) => {
      var _a, _b, _c, _d, _e, _f;
      return common_vendor.e({
        a: common_vendor.p({
          color: "#4ade80",
          opacity: 0.2,
          animationSpeed: 15
        }),
        b: !common_vendor.unref(userStore).isLoggedIn
      }, !common_vendor.unref(userStore).isLoggedIn ? common_vendor.e({
        c: common_vendor.o([($event) => formData.username = $event.detail.value, validateForm]),
        d: formData.username,
        e: common_vendor.o([($event) => formData.password = $event.detail.value, validateForm]),
        f: formData.password,
        g: isRegistering.value
      }, isRegistering.value ? {
        h: formData.nickname,
        i: common_vendor.o(($event) => formData.nickname = $event.detail.value)
      } : {}, {
        j: common_vendor.t(isRegistering.value ? "注册" : "登录"),
        k: !isFormValid.value,
        l: common_vendor.o(handleSubmit),
        m: common_vendor.t(isRegistering.value ? "已有账号？点击登录" : "没有账号？点击注册"),
        n: common_vendor.o(toggleMode)
      }) : {
        o: ((_a = common_vendor.unref(userStore).userInfo) == null ? void 0 : _a.avatar) || "/static/default-avatar.png",
        p: common_vendor.t((_b = common_vendor.unref(userStore).userInfo) == null ? void 0 : _b.nickname),
        q: common_vendor.t((_c = common_vendor.unref(userStore).userInfo) == null ? void 0 : _c.username),
        r: common_vendor.t(((_d = common_vendor.unref(userStore).userInfo) == null ? void 0 : _d.learned_words) || 0),
        s: common_vendor.t(((_e = common_vendor.unref(userStore).userInfo) == null ? void 0 : _e.streak_days) || 0),
        t: common_vendor.t(((_f = common_vendor.unref(userStore).userInfo) == null ? void 0 : _f.points) || 0),
        v: common_vendor.p({
          type: "gear",
          size: "24"
        }),
        w: common_vendor.o(handleSettings),
        x: common_vendor.p({
          type: "chat",
          size: "24"
        }),
        y: common_vendor.o(handleFeedback),
        z: common_vendor.p({
          type: "info",
          size: "24"
        }),
        A: common_vendor.o(handleAbout),
        B: common_vendor.o(handleLogout)
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-4c73b8ec"]]);
wx.createPage(MiniProgramPage);
