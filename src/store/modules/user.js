import $user from "@/api/user";
import storage from "@/utils/storage/index";

const state = {
  token: storage.getToken() || "",
  userInfo: {},
  menu: [], // 侧边栏
};

const mutations = {
  SET_TOKEN: (state, token) => {
    state.token = token;
  },
  SET_USER_INFO(state, userInfo) {
    state.userInfo = userInfo;
  },
  SET_MENU: (state, menu) => {
    state.menu = menu;
  },
};

const actions = {
  // user login
  async login({ commit }, userInfo) {
    const { username, password } = userInfo;
    const [err, response] = await $user.login({ userName: username.trim(), password: password });
    if (err) {
      return Promise.resolve([err, null]);
    } else {
      const { token, menu } = response;

      commit("SET_TOKEN", token);
      commit("SET_USER_INFO", response);
      commit("SET_MENU", menu);
      storage.setToken(token);
      storage.setUserInfo(response);
      storage.setMenu(menu);
      return Promise.resolve([null, response]);
    }
  },

  // user logout
  async logout({ commit, dispatch }) {
    const [err, response] = await $user.logout();
    if (err) {
      return Promise.resolve([err, null]);
    } else {
      commit("SET_TOKEN", "");
      commit("SET_USER_INFO", {});
      // commit("SET_ROLES", []);
      commit("SET_MENU", []);
      storage.removeToken();
      storage.removeUserInfo();
      storage.removeMenu();

      // reset visited views and cached views
      // to fixed https://github.com/PanJiaChen/vue-element-admin/issues/2485
      dispatch("tagsView/delAllViews", null, { root: true });
      return Promise.resolve([null, response]);
    }
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
};
