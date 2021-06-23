<!-- 页面名：index -->
<template>
  <!-- 交互
    1. 没有保存之前，可以随意新增区域。但有重叠的话，矩形会高亮。且没法儿保存
    2. 点击网格或者节点，顶部可查看当前坐标，方便绘制
    3. 双击节点，可以直接拖动编辑，或者点击节点，可以在表单设置值
    4. 顶部选中哪个类型，可以绘制哪种类型的rect
    5. 可以保存，且保存前要判断是否可提交
    6. x,y坐标转换
   -->
  <div class="reservoir-config">
    <!-- 编辑类型 -->
    <div class="tools-inner d-flex">
      <div class="header d-flex j-center a-center"> 组件库 </div>
      <div class="tools d-flex j-sb a-center flex-1 mx-2">
        <el-radio-group v-model="curType" @change="handleMapTypeChange">
          <el-radio-button v-for="item in mapTypeObj" :key="item.value" :label="item.value">{{ item.label }}</el-radio-button>
        </el-radio-group>
        <el-tag>x: {{ coordinates.x }}, y: {{ coordinates.y }}</el-tag>
      </div>
    </div>

    <div class="edit-inner d-flex">
      <!-- 画布 -->
      <div class="canvas-inner">
        <div id="canvas"></div>
      </div>

      <!-- 表单编辑区 -->
      <div class="config-inner"></div>
    </div>
  </div>
</template>

<script>
// x6库
import { Graph, Shape } from "@antv/x6";
// 接口
import $reservoir from "@/api/reservoir";
// 枚举
import enums from "@/utils/enum/index";

const map = enums.mapEnum;

export default {
  name: "ReservoirConfig",
  data() {
    return {
      // NOTE: 画布相关
      graph: null, // 画布实例
      canvas: {
        width: 0,
        height: 0,
      }, // 响应式画布宽度
      isDraw: false, // 是否正在绘制
      factor: 1, // 比例系数
      coordinates: {
        x: 0,
        y: 0,
      }, // 坐标
      position: {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      }, // 位置
      rect: null, // 正在绘制的矩形
      curType: map.Inlet.value, // 当前选中的类型
      // NOTE: 库区数据
      playground: {}, // 库区数据
    };
  },
  computed: {
    // 可绘制类型选择
    mapTypeObj() {
      return this.$utils.objFilter(map, attr => attr.ext.typeShow === true);
    },
  },
  watch: {
    canvas: {
      deep: true,
      immediate: false,
      handler(newVal) {
        if (this.graph) {
          this.graph.resize(newVal.width, newVal.height);
          this.graph.centerContent();
        }
      },
    },
  },
  // 生命周期 - 挂载完成（访问DOM元素）
  async mounted() {
    await this.getPlayground();
    this.observe();
    this.init();
    this.addEvent();
  },
  methods: {
    // NOTE: 库区图绘制相关
    init() {
      const { area, input, output, wall, warehouse, maintain } = this.playground;

      // 初始化画布
      this.graph = new Graph({
        container: document.getElementById("canvas"),
        width: this.canvas.width,
        height: this.canvas.height,
        background: {
          color: "#fffbe6",
        },
        grid: {
          size: 500, // 网格大小 10px
          visible: true, // 渲染网格背景
          type: "mesh", // 'dot' | 'fixedDot' | 'mesh'
        },
        // scroller: true, // 可滚动
        panning: {
          enabled: true,
          modifiers: "shift",
        },
        mousewheel: {
          enabled: true,
          modifiers: ["ctrl", "meta"],
        }, // 背景缩放
        interacting() {
          // 禁止拖动节点
          return { nodeMovable: false };
        },
      });

      // 库区
      const warehouseRect = new Shape.Rect({
        id: map.Warehouse.value + warehouse.id,
        x: 0,
        y: 0,
        width: warehouse.length,
        height: warehouse.width,
        attrs: {
          body: {
            fill: "rgba(95,149,255,0.05)",
            stroke: "#000",
            strokeWidth: 0,
          },
        },
      });
      this.graph.addNode(warehouseRect);

      // 可抓区域
      area.forEach(item => {
        // 抓料区
        if (item.parentId === 0) {
          const rect = new Shape.Rect({
            id: map.Area.value + item.id,
            x: item.totalX,
            y: item.totalY,
            width: item.totalLength,
            height: item.totalWidth,
            attrs: {
              body: {
                fill: "rgb(0, 174, 255, .25)",
                stroke: "#000",
                strokeWidth: 0,
              },
              label: {
                text: item.name,
                fill: "#333",
                fontSize: 500 * 2,
              },
            },
          });
          this.graph.addNode(rect);
        }
      });

      this.graph.centerContent();
      this.graph.zoom(-500);
    },
    // NOTE: 网络请求
    /**
     * @description 请求库区图纸
     */
    async getPlayground() {
      const [err, data] = await $reservoir.getPlayground();
      console.log("获取库区图纸", data);
      if (err) return;
      this.playground = data;
    },

    // NOTE: 事件处理
    /**
     * @description 监听 画布 宽度的变化
     */
    observe() {
      const ro = new ResizeObserver(entries => {
        for (const entry of entries) {
          const cr = entry.contentRect;
          // this.mainWidth = cr.width;
          this.canvas.width = cr.width;
          this.canvas.height = cr.height;
        }
      });
      ro.observe(document.querySelector(".canvas-inner"));
    },
    /**
     * @description 给画布添加事件
     */
    addEvent() {
      // 鼠标移动中
      this.graph.on("blank:click", ({ _, x, y }) => {
        this.coordinates = { x, y };
      });
      // 鼠标移动中
      this.graph.on("node:click", ({ e, x, y, cell, view }) => {
        this.coordinates = { x, y };
        console.log({ e, cell, view });
      });
    },
    /**
     * @description 监听要绘制的类型
     */
    handleMapTypeChange(value) {
      this.curType = value;
    },
  },
};
</script>
<style lang="scss" scoped>
.reservoir-config {
  width: 100%;
  height: calc(100vh - 84px);

  .tools-inner {
    width: 100%;
    height: 50px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);

    .header {
      display: flex;
      flex-basis: 200px;
      width: 200px;
      font-size: 12px;
      font-weight: bolder;
      color: #1890ff;
      background: #f7f9fb;
      border-right: 1px solid rgba(0, 0, 0, 0.08);
    }
  }

  .edit-inner {
    height: calc(100vh - 84px - 51px);

    .canvas-inner {
      flex: 1;
      border-right: 1px solid rgba(0, 0, 0, 0.08);
      border-left: 1px solid rgba(0, 0, 0, 0.08);
    }

    .config-inner {
      flex-basis: 200px;
      width: 200px;
    }
  }
}
</style>
