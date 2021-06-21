<!-- 页面名：demo -->
<template>
  <div id="x6" class="app-container x6">
    <div id="playground-wrapper" class="playground-wrapper"></div>
  </div>
</template>

<script>
import { Graph, Shape } from "@antv/x6";

import $reservoir from "@/api/reservoir";

export default {
  name: "Demo",
  data() {
    return {
      mainWidth: 0, // 可用容器宽度
      canvasW: 0,
      canvasH: 0,
      playground: {}, // 库区
      factor: 1, // 比例系数
      graph: null, // 画布
      title: "标题",
      isDraw: false, // 是在绘制
      position: {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      }, // 位置
      rect: null, // 正在绘制的矩形
    };
  },
  watch: {
    // mainWidth: {
    //   immediate: false,
    //   deep: true,
    //   handler(newValue) {
    //     if (newValue && this.playground.warehouse) {
    //       this.init();
    //       console.log("屏幕缩放重绘");
    //     }
    //   },
    // },
  },
  // 生命周期 - 挂载完成（访问DOM元素）
  async mounted() {
    // 监听容器宽度变化
    this.observe();
    await this.getPlayground();
    this.calcFactor();
    // 初始化库区
    this.initMap();
  },
  methods: {
    observe() {
      // 监听 自身容器 元素宽度的变化
      const ro = new ResizeObserver(entries => {
        for (const entry of entries) {
          const cr = entry.contentRect;
          this.mainWidth = cr.width;
        }
      });
      ro.observe(document.querySelector(".playground-wrapper"));
    },
    // 请求总库区图纸
    async getPlayground() {
      const [err, data] = await $reservoir.getPlayground();
      console.log("getPlayground 获取区域图纸", data);
      if (err) return;
      this.playground = data;
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
        container: document.getElementById("playground-wrapper"),
        width: this.canvasW,
        height: this.canvasH,
        background: {
          color: "#fffbe6", // 设置画布背景颜色
        },
        grid: {
          size: 500 / this.factor, // 网格大小 10px
          visible: true, // 渲染网格背景
        },
        interacting() {
          // 禁止拖动节点
          return { nodeMovable: false };
        },
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
