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
  login({ commit }, userInfo) {
    const { username, password } = userInfo;
    return new Promise((resolve, reject) => {
      $user
        .login({ userName: username.trim(), password: password })
        .then(response => {
          const { token, menu } = response;

          commit("SET_TOKEN", token);
          commit("SET_USER_INFO", response);
          commit("SET_MENU", menu);
          storage.setToken(token);
          storage.setUserInfo(response);
          storage.setMenu(menu);
          resolve();
        })
        .catch(error => {
          reject(error);
        });
    });
  },

  // user logout
  logout({ commit, dispatch }) {
    return new Promise((resolve, reject) => {
      $user
        .logout()
        .then(() => {
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
          resolve();
        })
        .catch(error => {
          reject(error);
        });
    });
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
};
