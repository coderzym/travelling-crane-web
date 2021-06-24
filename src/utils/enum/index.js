import { Enum } from "./Enum";

/**
 * 全局公共枚举类
 */
export default {
  // 指令类型
  commandEnum: new Enum().add("charge", "进料", 1).add("mix", "混料", 2).add("discharge", "出料", 3).add("move", "移料", 4).add("in2outMaterial", "进料口出料", 5),
  // 行车卡片状态
  hcStatusEnum: new Enum().add("disconnect", "通讯断开", 0).add("offline", "脱机", 1).add("standby", "待机", 2).add("operation", "作业", 3).add("fault", "故障", 4),
  // 行车任务状态类型
  taskStatusEnum: new Enum().add("disable", "禁用", 0).add("enable", "启用", 1).add("activated", "激活", 2).add("execute", "执行中", 3),
  mapEnum: new Enum()
    // typeShow: 是否展示在编辑页的选择添加类型上
    // show: 是否展示在库区图中
    .add("Inlet", "进料口", 0, { show: true, typeShow: true })
    .add("Outlet", "出料口", 1, { show: true, typeShow: true })
    .add("Area", "物料", 2, { show: true, typeShow: true })
    .add("GrabMaterialsArea", "抓料区", 3, { show: true, typeShow: null })
    .add("Wall", "墙", 4, { show: true, typeShow: true })
    .add("Maintain", "检查口", 5, { show: true, typeShow: true })
    .add("Mask", "遮罩", 6, { show: true, typeShow: false })
    .add("Warehouse", "库区", 7, { show: true, typeShow: false }),
  areaEnum: new Enum().add("Material", "物料区", 0).add("Seize", "可抓区", 1).add("Put", "可放区", 2),
  // // 结果枚举
  // ResultEnum: new Enum().add('SUCCESS', '操作成功', 200).add('ERROR', '操作失败', 400).add('PARAM_ERROR', '参数错误', 405).add(
  // 		'SERVER_ERROR', '服务器异常', 500)
  // 	.add('NO_PERMISSION', '没有权限', 501)
};
