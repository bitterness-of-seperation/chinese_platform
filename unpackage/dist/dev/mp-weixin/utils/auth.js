"use strict";
const common_vendor = require("../common/vendor.js");
const stores_user = require("../stores/user.js");
const authPages = [
  "/pages/Home/Home",
  "/pages/WordLearning/WordLearning",
  "/pages/WordProgress/WordProgress",
  "/pages/WordExercise/WordExercise",
  "/pages/Dictionary/Dictionary",
  "/pages/Assistant/Assistant",
  "/pages/Blank/Blank"
];
const publicPages = [
  "/pages/login/login",
  "/pages/register/register",
  "/pages/reset-password/reset-password"
];
function needAuth(url) {
  const path = url.split("?")[0];
  return authPages.includes(path);
}
function isPublicPage(url) {
  const path = url.split("?")[0];
  return publicPages.includes(path);
}
function checkLogin() {
  const userStore = stores_user.useUserStore();
  return userStore.isLoggedIn;
}
function redirectToLogin(fromUrl) {
  const redirectUrl = fromUrl ? encodeURIComponent(fromUrl) : "";
  common_vendor.index.redirectTo({
    url: `/pages/login/login${redirectUrl ? "?redirect=" + redirectUrl : ""}`
  });
}
function handlePageAuth() {
  const pages = getCurrentPages();
  if (!pages.length) {
    return true;
  }
  const currentPage = pages[pages.length - 1];
  const currentUrl = `/${currentPage.route}`;
  if (needAuth(currentUrl) && !checkLogin()) {
    redirectToLogin(currentUrl);
    return false;
  }
  if (checkLogin() && isPublicPage(currentUrl)) {
    common_vendor.index.switchTab({
      url: "/pages/Home/Home"
    });
    return false;
  }
  return true;
}
exports.handlePageAuth = handlePageAuth;
