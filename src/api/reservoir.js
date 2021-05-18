import request from "@/utils/request";

// http api
const urlLists = {
  /**
   * ! ---------------------- 库区 ----------------------
   */
  getReservoirList: "/baseWareHouse/list", // 库区列表
  getPlayground: "/baseWareHousePlan/queryWarehouse", // 库区图数据
  get3DPlayground: "/baseWareHousePlan/query3DWarehouse", // 3d库区
  editReservoirList: "/baseWareHouse/modifyWareHouse", // 修改库区
};

const getReservoirList = params => {
  return request.get(urlLists.getReservoirList, params);
};
const getPlayground = params => {
  return request.get(urlLists.getPlayground, params);
};
const get3DPlayground = params => {
  return request.get(urlLists.get3DPlayground, params);
};
const editReservoirList = params => {
  return request.post(urlLists.editReservoirList, params);
};

export default {
  getReservoirList,
  getPlayground,
  get3DPlayground,
  editReservoirList,
};
