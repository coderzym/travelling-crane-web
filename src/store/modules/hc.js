import Cookies from "js-cookie";

const state = {
  hcList: null, // 行车列表
};

const mutations = {
  SET_HcLIST: (state, hcList) => {
    state.hcList = hcList;
    let local = Cookies.get("hcList");
    if (local) {
      // 本地有，判断行车数量是否有变化。有则更新。否则不更新
      if (hcList.length != JSON.parse(local).length) {
        Cookies.set("hcList", hcList);
      }
    } else {
      // 本地无，需要存本地
      Cookies.set("hcList", hcList);
    }
  },
};

const actions = {};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
};
