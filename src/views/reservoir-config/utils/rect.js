// x6库
import { Shape, ObjectExt } from "@antv/x6";
// 枚举
import enums from "@/utils/enum/index";

const mapEnum = enums.mapEnum;
const areaEnum = enums.areaEnum;

const colorObj = {
  [mapEnum.warehouse.field]: {
    fill: "rgba(95,149,255,0.05)",
    activeFill: "rgba(95,149,255, 1)",
  },
  [mapEnum.area.field]: {
    fill: "rgba(5, 223, 215, .25)",
    activeFill: "rgba(5, 223, 215, 1)",
  },
  [mapEnum.input.field]: {
    fill: "rgba(163, 247, 191, 0.25)",
    activeFill: "rgba(163, 247, 191, 1)",
  },
  [mapEnum.output.field]: {
    fill: "rgba(255, 245, 145, 0.25)",
    activeFill: "rgba(255, 245, 145, 1)",
  },
  [mapEnum.wall.field]: {
    fill: "rgba(232, 211, 255, 0.25)",
    activeFill: "rgba(232, 211, 255, 1)",
  },
  [mapEnum.maintain.field]: {
    fill: "rgba(255, 150, 66, 0.25)",
    activeFill: "rgba(255, 150, 66, 1)",
  },
};

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
    areaType: null, // areaType类型：null: 不是物料区 | 0: 物料区 | 1: 可抓区 | 2: 可放区
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
    areaType: areaEnum.Material.value,
  },
  // 通过钩子将自定义选项 mapData 上的信息应用到 'attrs/text/text' 和 'data/type' 等属性上
  propHooks: {
    // 根据 rawData 参数进行渲染
    rawData(metadata) {
      const { rawData, ...others } = metadata;
      if (rawData) {
        ObjectExt.setByPath(others, "attrs/label/text", rawData.name);
        ObjectExt.setByPath(others, "data/type", rawData.type); // rect类型(warehouse/wall/...)
        ObjectExt.setByPath(others, "data/id", rawData.name + "-" + rawData.id);
        ObjectExt.setByPath(others, "position/x", rawData.totalX);
        ObjectExt.setByPath(others, "position/y", rawData.totalY);
        ObjectExt.setByPath(others, "size/width", rawData.totalLength);
        ObjectExt.setByPath(others, "size/height", rawData.totalWidth);
        // 设置是否可移动
        rawData.disableMove !== undefined && ObjectExt.setByPath(others, "data/disableMove", rawData.disableMove);
        // 设置物料区类型
        ObjectExt.setByPath(others, "data/areaType", rawData.areaType);
      }
      return others;
    },
    createData(metadata) {
      const { createData, ...others } = metadata;
      if (createData) {
        ObjectExt.setByPath(others, "attrs/label/text", createData.name || mapEnum.area.label);
        ObjectExt.setByPath(others, "data/type", mapEnum.area.field); // rect类型(warehouse/wall/...)
        ObjectExt.setByPath(others, "data/id", null); // 新创建的都没有ID，默认为null，根据这个来判断是不是自己新拖拽出来的组件
        ObjectExt.setByPath(others, "size/width", createData.width);
        ObjectExt.setByPath(others, "size/height", createData.height);
        // 设置是否可移动
        ObjectExt.setByPath(others, "data/disableMove", false);
        // 设置物料区类型
        ObjectExt.setByPath(others, "data/areaType", areaEnum.Material.value); // 默认就是物料区 | 物料区类型 (null: 非物料区，0: 物料区, 1:可抓, 2: 可放)
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
    areaType: null,
  },
  // 通过钩子将自定义选项 mapData 上的信息应用到 'attrs/text/text' 和 'data/type' 等属性上
  propHooks: {
    // 根据 rawData 参数进行渲染
    rawData(metadata) {
      const { rawData, ...others } = metadata;
      if (rawData) {
        ObjectExt.setByPath(others, "attrs/label/text", rawData.name);
        ObjectExt.setByPath(others, "data/type", rawData.type); // rect类型(warehouse/wall/...)
        ObjectExt.setByPath(others, "data/id", rawData.name + "-" + rawData.id);
        ObjectExt.setByPath(others, "position/x", rawData.maxCar);
        ObjectExt.setByPath(others, "position/y", rawData.minCar);
        ObjectExt.setByPath(others, "size/width", rawData.length);
        ObjectExt.setByPath(others, "size/height", rawData.width);
        // 设置是否可移动
        rawData.disableMove !== undefined && ObjectExt.setByPath(others, "data/disableMove", rawData.disableMove);
      }
      return others;
    },
    createData(metadata) {
      const { createData, ...others } = metadata;
      if (createData) {
        ObjectExt.setByPath(others, "attrs/label/text", createData.name || mapEnum.input.label);
        ObjectExt.setByPath(others, "data/type", mapEnum.input.field); // rect类型(warehouse/wall/...)
        ObjectExt.setByPath(others, "data/id", null); // 新创建的都没有ID，默认为null，根据这个来判断是不是自己新拖拽出来的组件
        ObjectExt.setByPath(others, "size/width", createData.width);
        ObjectExt.setByPath(others, "size/height", createData.height);
        // 设置是否可移动
        ObjectExt.setByPath(others, "data/disableMove", false);
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
    areaType: null,
  },
  // 通过钩子将自定义选项 mapData 上的信息应用到 'attrs/text/text' 和 'data/type' 等属性上
  propHooks: {
    // 根据 rawData 参数进行渲染
    rawData(metadata) {
      const { rawData, ...others } = metadata;
      if (rawData) {
        ObjectExt.setByPath(others, "attrs/label/text", rawData.name);
        ObjectExt.setByPath(others, "data/type", rawData.type); // rect类型(warehouse/wall/...)
        ObjectExt.setByPath(others, "data/id", rawData.name + "-" + rawData.id);
        ObjectExt.setByPath(others, "position/x", rawData.maxCar);
        ObjectExt.setByPath(others, "position/y", rawData.minCar);
        ObjectExt.setByPath(others, "size/width", rawData.length);
        ObjectExt.setByPath(others, "size/height", rawData.width);
        // 设置是否可移动
        rawData.disableMove !== undefined && ObjectExt.setByPath(others, "data/disableMove", rawData.disableMove);
      }
      return others;
    },
    createData(metadata) {
      const { createData, ...others } = metadata;
      if (createData) {
        ObjectExt.setByPath(others, "attrs/label/text", createData.name || mapEnum.output.label);
        ObjectExt.setByPath(others, "data/type", mapEnum.output.field); // rect类型(warehouse/wall/...)
        ObjectExt.setByPath(others, "data/id", null); // 新创建的都没有ID，默认为null，根据这个来判断是不是自己新拖拽出来的组件
        ObjectExt.setByPath(others, "size/width", createData.width);
        ObjectExt.setByPath(others, "size/height", createData.height);
        // 设置是否可移动
        ObjectExt.setByPath(others, "data/disableMove", false);
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
    areaType: null,
  },
  // 通过钩子将自定义选项 mapData 上的信息应用到 'attrs/text/text' 和 'data/type' 等属性上
  propHooks: {
    // 根据 rawData 参数进行渲染
    rawData(metadata) {
      const { rawData, ...others } = metadata;
      if (rawData) {
        ObjectExt.setByPath(others, "attrs/label/text", rawData.name);
        ObjectExt.setByPath(others, "data/type", rawData.type); // rect类型(warehouse/wall/...)
        ObjectExt.setByPath(others, "data/id", rawData.name + "-" + rawData.id);
        ObjectExt.setByPath(others, "position/x", rawData.maxCar);
        ObjectExt.setByPath(others, "position/y", rawData.minCar);
        ObjectExt.setByPath(others, "size/width", rawData.length);
        ObjectExt.setByPath(others, "size/height", rawData.width);
        // 设置是否可移动
        rawData.disableMove !== undefined && ObjectExt.setByPath(others, "data/disableMove", rawData.disableMove);
      }
      return others;
    },
    createData(metadata) {
      const { createData, ...others } = metadata;
      if (createData) {
        ObjectExt.setByPath(others, "attrs/label/text", createData.name || mapEnum.wall.label);
        ObjectExt.setByPath(others, "data/type", mapEnum.wall.field); // rect类型(warehouse/wall/...)
        ObjectExt.setByPath(others, "data/id", null); // 新创建的都没有ID，默认为null，根据这个来判断是不是自己新拖拽出来的组件
        ObjectExt.setByPath(others, "size/width", createData.width);
        ObjectExt.setByPath(others, "size/height", createData.height);
        // 设置是否可移动
        ObjectExt.setByPath(others, "data/disableMove", false);
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
    areaType: null,
  },
  // 通过钩子将自定义选项 mapData 上的信息应用到 'attrs/text/text' 和 'data/type' 等属性上
  propHooks: {
    // 根据 rawData 参数进行渲染
    rawData(metadata) {
      const { rawData, ...others } = metadata;
      if (rawData) {
        ObjectExt.setByPath(others, "attrs/label/text", rawData.name);
        ObjectExt.setByPath(others, "data/type", rawData.type); // rect类型(warehouse/wall/...)
        ObjectExt.setByPath(others, "data/id", rawData.name + "-" + rawData.id);
        ObjectExt.setByPath(others, "position/x", rawData.maxCar);
        ObjectExt.setByPath(others, "position/y", rawData.minCar);
        ObjectExt.setByPath(others, "size/width", rawData.length);
        ObjectExt.setByPath(others, "size/height", rawData.width);
        // 设置是否可移动
        rawData.disableMove !== undefined && ObjectExt.setByPath(others, "data/disableMove", rawData.disableMove);
      }
      return others;
    },
    createData(metadata) {
      const { createData, ...others } = metadata;
      if (createData) {
        ObjectExt.setByPath(others, "attrs/label/text", createData.name || mapEnum.maintain.label);
        ObjectExt.setByPath(others, "data/type", mapEnum.maintain.field); // rect类型(warehouse/wall/...)
        ObjectExt.setByPath(others, "data/id", null); // 新创建的都没有ID，默认为null，根据这个来判断是不是自己新拖拽出来的组件
        ObjectExt.setByPath(others, "size/width", createData.width);
        ObjectExt.setByPath(others, "size/height", createData.height);
        // 设置是否可移动
        ObjectExt.setByPath(others, "data/disableMove", false);
      }
      return others;
    },
  },
});
