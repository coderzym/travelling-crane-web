<!-- 页面名：demo -->
<template>
  <!-- 交互
    1. 没有保存之前，可以随意新增区域。但有重叠的话，矩形会高亮。且没法儿保存
    2. 点击网格或者节点，顶部可查看当前坐标，方便绘制
    3. 双击节点，可以直接拖动编辑，或者点击节点，可以在表单设置值
    4. 顶部选中哪个类型，可以绘制哪种类型的rect
    5. 可以保存，且保存前要判断是否可提交
    6. x,y坐标转换
   -->
  <div id="x6" class="app-container x6">
    <!-- 工具栏 -->
    <div class="tools mb-2 d-flex j-sb">
      <el-radio-group v-model="curType" @change="handleMapTypeChange">
        <el-radio-button v-for="item in mapTypeObj" :key="item.value" :label="item.value">{{ item.label }}</el-radio-button>
      </el-radio-group>
      <el-tag>x: {{ coordinates.x }}, y: {{ coordinates.y }}</el-tag>
    </div>
    <!-- 库区图绘制区域 -->
    <div class="canvas-inner">
      <div id="canvas"></div>
    </div>
    <!-- 表单提交 -->
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
  name: "X6",
  data() {
    return {
      // NOTE: 画布相关
      graph: null, // 画布实例
      mainWidth: 0, // 响应式画布宽度
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
    mainWidth: {
      immediate: false,
      handler(newVal) {
        if (this.graph) {
          this.graph.resize(newVal);
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
        width: this.mainWidth,
        height: 400,
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
          this.mainWidth = cr.width;
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

    // 计算比例
    calcFactor() {
      const { warehouse } = this.playground;
      const width = warehouse.length; // 实际宽
      const height = warehouse.width; // 实际高
      let w = 0; // px宽
      let h = 0; // px高
      const ww = this.mainWidth; // 测量px宽
      let c = 0; // 系数
      if (width % ww !== 0) {
        // 不能被整除
        for (let i = Math.floor(ww); i > 0; i--) {
          if (width % i === 0) {
            c = width / i;
            w = i;
            h = height / c;
            break;
          }
        }
      } else {
        c = width / ww;
        w = ww;
        h = height / c;
      }
      console.log(w, h, c);
      this.factor = c;
      this.canvasW = w;
      this.canvasH = h;
    },
    initMap() {
      const { area, input, output, wall, warehouse, maintain } = this.playground;
      const graph = new Graph({
        container: document.getElementById("canvas"),
        height: 400,
        background: {
          color: "#fffbe6", // 设置画布背景颜色
        },
        grid: {
          size: 10, // 网格大小 10px
          visible: true, // 渲染网格背景
        },
        interacting() {
          // 禁止拖动节点
          return { nodeMovable: false };
        },
        autoResize: true,
      });
      this.graph = graph;
      const polygon = graph.addNode({
        // shape: "polygon",
        shape: "rect",
        x: 1000,
        y: 1000,
        width: 5000,
        height: 5000,
        label: "rect",
        // 使用 points 属性指定多边形的顶点数组
        // points: [
        //   { x: 100, y: 0 },
        //   { x: 200, y: 0 },
        //   { x: 200, y: 60 },
        //   { x: 300, y: 60 },
        //   { x: 300, y: 120 },
        //   { x: 0, y: 120 },
        //   { x: 0, y: 60 },
        //   { x: 100, y: 60 },
        //   { x: 100, y: 0 },
        // ],
        attrs: {
          body: {
            fill: "#efdbff",
            stroke: "#9254de",
          },
        },
        ports: {
          groups: {
            // 输入链接桩群组定义
            in: {
              position: "top",
              attrs: {
                circle: {
                  r: 6,
                  magnet: true,
                  stroke: "#31d0c6",
                  strokeWidth: 2,
                  fill: "#fff",
                },
              },
            },
            // 输出链接桩群组定义
            out: {
              position: "bottom",
              attrs: {
                circle: {
                  r: 6,
                  magnet: true,
                  stroke: "#31d0c6",
                  strokeWidth: 2,
                  fill: "#fff",
                },
              },
            },
          },
          items: [
            {
              id: "port1",
              group: "in",
            },
            {
              id: "port4",
              group: "out",
            },
          ],
        },
      });
      const child1 = graph.addNode({
        x: 163000,
        y: 8000,
        width: length,
        height: 6000,
        label: "Child\n(inside)",
        zIndex: 10,
        attrs: {
          body: {
            stroke: "none",
            fill: "#3199FF",
          },
          label: {
            fill: "#fff",
            fontSize: 12,
          },
        },
      });
      polygon.addChild(child1);

      // 鼠标按下时
      graph.on("blank:mousedown", ({ e, x, y }) => {
        console.log(e, x, y);
        this.isDraw = true;
        // 每次先创建节点
        this.rect = new Shape.Rect();
        console.log(this.rect);
        // 计算起始坐标
        this.position = { ...this.position, x, y };
      });
      // 鼠标移动中
      graph.on("blank:mousemove", ({ e, x, y }) => {
        console.log(e, x, y);
        // 不在绘制状态，直接返回
        if (!this.isDraw) return;
        this.graph.addNode(this.rect);

        // 获取起始值
        const { x: oldX, y: oldY } = this.position;
        this.rect
          // 设置节点位置
          .position(Math.min(oldX, x), Math.min(oldY, y))
          // 设置节点大小
          .resize(oldX < x ? x - oldX : oldX - x, oldY < y ? y - oldY : oldY - y)
          // 设置节点样式
          .attr({
            body: {
              fill: "blue",
            },
            label: {
              text: "Hello",
              fill: "white",
            },
          });
      });
      // 鼠标抬起时
      graph.on("blank:mouseup", ({ e, x, y }) => {
        console.log(e, x, y);
        const { x: oldX, y: oldY } = this.position;
        // 如果宽高有一个为0，删除这个节点
        if (x - oldX === 0 || y - oldY === 0) {
          this.graph.removeNode(this.rect.id);
        }
        this.isDraw = false;
        this.rect = null;
        this.position = { x: 0, y: 0, width: 0, height: 0 };
        console.log(this.graph.toJSON());
      });

      // graph.scale(1 / this.factor);
      // graph.zoom(1 / this.factor);
    },
  },
};
</script>
<style lang="scss" scoped></style>
