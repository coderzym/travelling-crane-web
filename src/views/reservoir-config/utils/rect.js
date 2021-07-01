// x6库
import { Shape, ObjectExt } from "@antv/x6";
// 枚举
import enums from "@/utils/enum/index";

const mapEnum = enums.mapEnum;
// const areaEnum = enums.areaEnum;

// NOTE: 总库区
Shape.Rect.define({
  shape: mapEnum.warehouse.field,
  x: 0,
  y: 0,
  attrs: {
    body: {
      fill: mapEnum.warehouse.ext.fill,
      stroke: "#000",
      strokeWidth: 0,
    },
    label: {
      fill: "#333",
      fontSize: 0,
    },
  },
  data: {
    disableMove: true, // 总库区位置不可移动
    // areaType: null, // areaType类型：null: 不是物料区 | 0: 物料区 | 1: 可抓区 | 2: 可放区
  },
  // 通过钩子将自定义选项 mapData 上的信息应用到 'attrs/text/text' 和 'data/type' 等属性上
  propHooks: {
    rawData(metadata) {
      const { rawData, ...others } = metadata;
      if (rawData) {
        ObjectExt.setByPath(others, "attrs/label/text", rawData.name);
        ObjectExt.setByPath(others, "data/type", rawData.type); // rect类型(warehouse/wall/...)
        ObjectExt.setByPath(others, "data/id", rawData.name + "-" + rawData.id);
        ObjectExt.setByPath(others, "size/width", rawData.length);
        ObjectExt.setByPath(others, "size/height", rawData.width);
        ObjectExt.setByPath(others, "data/rawData", { ...rawData, xpos: 0, ypos: 0, xlength: rawData.length, ylength: rawData.width }); // 后台数据存储在这里
      }
      return others;
    },
  },
});

// NOTE: 物料区
Shape.Rect.define({
  shape: mapEnum.area.field,
  attrs: {
    body: {
      fill: mapEnum.area.ext.fill,
      stroke: "#000",
      strokeWidth: 0,
    },
    label: {
      fill: "#333",
      fontSize: 500 * 2,
    },
  },
  data: {
    disableMove: true, // 总库区位置不可移动
    // areaType: areaEnum.Material.value,
  },
  // 通过钩子将自定义选项 mapData 上的信息应用到 'attrs/text/text' 和 'data/type' 等属性上
  propHooks: {
    // 根据 rawData 参数进行渲染
    rawData(metadata) {
      const { rawData, ...others } = metadata;
      if (rawData) {
        ObjectExt.setByPath(others, "attrs/label/text", rawData.name);
        ObjectExt.setByPath(others, "data/type", mapEnum.getFieldByValue(rawData.type)); // rect类型(warehouse/wall/...)
        // ObjectExt.setByPath(others, "data/id", rawData.name + "-" + rawData.typeId);
        // 新增的node没有typeId，所以根据 typeId 来判断要不要设置x/y。因为拖拽的node不需要设置x/y
        rawData.typeId && ObjectExt.setByPath(others, "position/x", rawData.xpos);
        rawData.typeId && ObjectExt.setByPath(others, "position/y", rawData.ypos);
        !rawData.typeId && ObjectExt.setByPath(others, "data/disableMove", false);
        ObjectExt.setByPath(others, "size/width", rawData.xlength);
        ObjectExt.setByPath(others, "size/height", rawData.ylength);
        ObjectExt.setByPath(others, "data/rawData", rawData); // 后台数据存储在这里
      }
      return others;
    },
  },
});

// NOTE: 进料口
Shape.Rect.define({
  shape: mapEnum.input.field,
  attrs: {
    body: {
      fill: mapEnum.input.ext.fill,
      stroke: "#000",
      strokeWidth: 0,
    },
    label: {
      fill: "#333",
      fontSize: 500 * 2,
    },
  },
  data: {
    disableMove: true, // 总库区位置不可移动
    // areaType: null,
  },
  // 通过钩子将自定义选项 mapData 上的信息应用到 'attrs/text/text' 和 'data/type' 等属性上
  propHooks: {
    // 根据 rawData 参数进行渲染
    rawData(metadata) {
      const { rawData, ...others } = metadata;
      if (rawData) {
        ObjectExt.setByPath(others, "attrs/label/text", rawData.name);
        ObjectExt.setByPath(others, "data/type", mapEnum.getFieldByValue(rawData.type)); // rect类型(warehouse/wall/...)
        // 新增的node没有typeId，所以根据 typeId 来判断要不要设置x/y。因为拖拽的node不需要设置x/y
        rawData.typeId && ObjectExt.setByPath(others, "position/x", rawData.xpos);
        rawData.typeId && ObjectExt.setByPath(others, "position/y", rawData.ypos);
        !rawData.typeId && ObjectExt.setByPath(others, "data/disableMove", false);
        ObjectExt.setByPath(others, "size/width", rawData.xlength);
        ObjectExt.setByPath(others, "size/height", rawData.ylength);
        ObjectExt.setByPath(others, "data/rawData", rawData); // 后台数据存储在这里
      }
      return others;
    },
  },
});

// NOTE: 出料口
Shape.Rect.define({
  shape: mapEnum.output.field,
  attrs: {
    body: {
      fill: mapEnum.output.ext.fill,
      stroke: "#000",
      strokeWidth: 0,
    },
    label: {
      fill: "#333",
      fontSize: 500 * 2,
    },
  },
  data: {
    disableMove: true, // 总库区位置不可移动
    // areaType: null,
  },
  // 通过钩子将自定义选项 mapData 上的信息应用到 'attrs/text/text' 和 'data/type' 等属性上
  propHooks: {
    // 根据 rawData 参数进行渲染
    rawData(metadata) {
      const { rawData, ...others } = metadata;
      if (rawData) {
        ObjectExt.setByPath(others, "attrs/label/text", rawData.name);
        ObjectExt.setByPath(others, "data/type", mapEnum.getFieldByValue(rawData.type)); // rect类型(warehouse/wall/...)
        // 新增的node没有typeId，所以根据 typeId 来判断要不要设置x/y。因为拖拽的node不需要设置x/y
        rawData.typeId && ObjectExt.setByPath(others, "position/x", rawData.xpos);
        rawData.typeId && ObjectExt.setByPath(others, "position/y", rawData.ypos);
        !rawData.typeId && ObjectExt.setByPath(others, "data/disableMove", false);
        ObjectExt.setByPath(others, "size/width", rawData.xlength);
        ObjectExt.setByPath(others, "size/height", rawData.ylength);
        ObjectExt.setByPath(others, "data/rawData", rawData); // 后台数据存储在这里
      }
      return others;
    },
  },
});

// NOTE: 墙
Shape.Rect.define({
  shape: mapEnum.wall.field,
  attrs: {
    body: {
      fill: mapEnum.wall.ext.fill,
      stroke: "#000",
      strokeWidth: 0,
    },
    label: {
      fill: "#333",
      fontSize: 500 * 2,
    },
  },
  data: {
    disableMove: true, // 总库区位置不可移动
    // areaType: null,
  },
  // 通过钩子将自定义选项 mapData 上的信息应用到 'attrs/text/text' 和 'data/type' 等属性上
  propHooks: {
    // 根据 rawData 参数进行渲染
    rawData(metadata) {
      const { rawData, ...others } = metadata;
      if (rawData) {
        ObjectExt.setByPath(others, "attrs/label/text", rawData.name);
        ObjectExt.setByPath(others, "data/type", mapEnum.getFieldByValue(rawData.type)); // rect类型(warehouse/wall/...)
        // 新增的node没有typeId，所以根据 typeId 来判断要不要设置x/y。因为拖拽的node不需要设置x/y
        rawData.typeId && ObjectExt.setByPath(others, "position/x", rawData.xpos);
        rawData.typeId && ObjectExt.setByPath(others, "position/y", rawData.ypos);
        !rawData.typeId && ObjectExt.setByPath(others, "data/disableMove", false);
        ObjectExt.setByPath(others, "size/width", rawData.xlength);
        ObjectExt.setByPath(others, "size/height", rawData.ylength);
        ObjectExt.setByPath(others, "data/rawData", rawData); // 后台数据存储在这里
      }
      return others;
    },
  },
});

// NOTE: 检查口
Shape.Rect.define({
  shape: mapEnum.maintain.field,
  attrs: {
    body: {
      fill: mapEnum.maintain.ext.fill,
      stroke: "#000",
      strokeWidth: 0,
    },
    label: {
      fill: "#333",
      fontSize: 500 * 2,
    },
  },
  data: {
    disableMove: true, // 总库区位置不可移动
    // areaType: null,
  },
  // 通过钩子将自定义选项 mapData 上的信息应用到 'attrs/text/text' 和 'data/type' 等属性上
  propHooks: {
    // 根据 rawData 参数进行渲染
    rawData(metadata) {
      const { rawData, ...others } = metadata;
      if (rawData) {
        ObjectExt.setByPath(others, "attrs/label/text", rawData.name);
        ObjectExt.setByPath(others, "data/type", mapEnum.getFieldByValue(rawData.type)); // rect类型(warehouse/wall/...)
        // 新增的node没有typeId，所以根据 typeId 来判断要不要设置x/y。因为拖拽的node不需要设置x/y
        rawData.typeId && ObjectExt.setByPath(others, "position/x", rawData.xpos);
        rawData.typeId && ObjectExt.setByPath(others, "position/y", rawData.ypos);
        !rawData.typeId && ObjectExt.setByPath(others, "data/disableMove", false);
        ObjectExt.setByPath(others, "size/width", rawData.xlength);
        ObjectExt.setByPath(others, "size/height", rawData.ylength);
        ObjectExt.setByPath(others, "data/rawData", rawData); // 后台数据存储在这里
      }
      return others;
    },
  },
});
