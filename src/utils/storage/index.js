import Storage from "./Storage.js";

const prefix = "HX.";

const storage = {
  // token
  setToken(token, timeout) {
    Storage.set(prefix + "Token", token, timeout);
  },
  getToken() {
    return Storage.get(prefix + "Token");
  },
  removeToken() {
    Storage.remove(prefix + "Token");
  },

  // 用户信息
  setUserInfo(userInfo) {
    return Storage.set(prefix + "UserInfo", userInfo);
  },
  getUserInfo() {
    return Storage.get(prefix + "UserInfo");
  },
  removeUserInfo() {
    Storage.remove(prefix + "UserInfo");
  },

  // 菜单
  setMenu(menu) {
    return Storage.set(prefix + "Menu", menu);
  },
  getMenu() {
    return Storage.get(prefix + "Menu");
  },
  removeMenu() {
    Storage.remove(prefix + "Menu");
  },
};

export default storage;
