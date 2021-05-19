import request from "@/utils/request";

// http api
const urlLists = {
  /**
   * ! ---------------------- 库存 ----------------------
   */
  queryCranes: "/full-stock/query-cranes", // 查询行车下拉列表
  queryWarehouseScan: "/full-stock/query-warehouse-scan", // 查询行车开始结束区域
  pageStock: "/full-stock/page-stock", // 库存分页
  countStock: "/full-stock/count-stock", // 计算库存
};

const queryCranes = params => {
  return request.get(urlLists.queryCranes, params);
};

const queryWarehouseScan = params => {
  return request.get(urlLists.queryWarehouseScan, params);
};

const pageStock = params => {
  return request.get(urlLists.pageStock, params);
};

const countStock = params => {
  return request.get(urlLists.countStock, params);
};

export default {
  queryCranes,
  queryWarehouseScan,
  pageStock,
  countStock,
};
