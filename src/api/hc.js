import request from "@/utils/request";

// http api
const urlLists = {
  /**
   * ! ---------------------- 行车 ----------------------
   */
  toggleConnect: "/monitor/crane/networking/connect", // 连接网络-断开网络
  toggleOnline: "/monitor/crane/online", // 设备状态 脱机 待机
  toggleAutoMode: "/monitor/automatic-mode", // 自动-手动模式切换
  triggerReset: "/monitor/error-reset", // 故障复位
  triggerStop: "/monitor/emergency-stop", // 紧急停止
  testFault: "/test/test-fault", // 模拟故障生成
  toggleGroundConnect: "/monitor/ground-station-network", // 地面工作台网络连接
  toggleGroundStatus: "/monitor/ground-station-status", // 地面工作台设备连接
  getHcList: "/baseCrane/list", // 获取行车列表
  toggleCenterControlConnect: "/monitor/central-control-network",
};

const toggleConnect = params => {
  return request.get(urlLists.toggleConnect, params);
};
const toggleOnline = params => {
  return request.get(urlLists.toggleOnline, params);
};
const toggleAutoMode = params => {
  return request.get(urlLists.toggleAutoMode, params);
};
const triggerReset = params => {
  return request.get(urlLists.triggerReset, params);
};
const triggerStop = params => {
  return request.get(urlLists.triggerStop, params);
};

const testFault = params => {
  return request.get(urlLists.testFault, params);
};

const toggleGroundConnect = params => {
  return request.get(urlLists.toggleGroundConnect, params);
};
const toggleGroundStatus = params => {
  return request.get(urlLists.toggleGroundStatus, params);
};

const getHcList = params => {
  return request.get(urlLists.getHcList, params);
};

const toggleCenterControlConnect = params => {
  return request.get(urlLists.toggleCenterControlConnect, params);
};

export default {
  toggleConnect,
  toggleOnline,
  toggleAutoMode,
  triggerReset,
  triggerStop,
  testFault,
  toggleGroundConnect,
  toggleGroundStatus,
  getHcList,
  toggleCenterControlConnect,
};
