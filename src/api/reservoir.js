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
  getBaseWareHouse: "/baseWareHouse/getBaseWareHouse", // 查询总库区信息查询一条
  selectArea: "/baseArea/selectArea", // 查询库区内部信息
  save: "/baseArea/save", // 区域编辑
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
const getBaseWareHouse = params => {
  return request.get(urlLists.getBaseWareHouse, params);
};
const selectArea = params => {
  return request.post(urlLists.selectArea, params);
};
const save = params => {
  return request.post(urlLists.save, params);
};

export default {
  getReservoirList,
  getPlayground,
  get3DPlayground,
  editReservoirList,
  getBaseWareHouse,
  selectArea,
  save,
};
