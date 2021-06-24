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
  <div class="reservoir-config container">
    <!-- 编辑类型 -->
    <div class="tools-inner d-flex">
      <div class="header d-flex j-center a-center"> 组件库 </div>
      <div class="tools d-flex j-sb a-center flex-1 mx-2">
        <el-button-group>
          <el-button v-for="item in mapTypeObj" :key="item.value" :data-type="item.value" @mousedown.native="startDrag">{{ item.label }}</el-button>
        </el-button-group>
        <el-tag>x: {{ coordinates.x }}, y: {{ coordinates.y }}</el-tag>
      </div>
    </div>

    <div class="edit-inner d-flex">
      <!-- 画布 -->
      <div class="canvas-inner">
        <div id="canvas"></div>
      </div>

      <!-- 表单编辑区 -->
      <div class="config-inner px-2">
        <h3 class="header">组件信息</h3>
        <hr />
        <el-form v-if="curRect" ref="form" :model="curForm" :rules="rules" label-position="top" size="mini">
          <el-form-item label="名称" prop="name">
            <el-input v-model="curForm.name"></el-input>
          </el-form-item>
          <el-form-item label="x坐标" prop="x">
            <el-input v-model.number="curForm.x"></el-input>
          </el-form-item>
          <el-form-item label="y坐标" prop="y">
            <el-input v-model.number="curForm.y"></el-input>
          </el-form-item>
          <el-form-item label="宽" prop="width">
            <el-input v-model.number="curForm.width"></el-input>
          </el-form-item>
          <el-form-item label="高" prop="height">
            <el-input v-model.number="curForm.height"></el-input>
          </el-form-item>
          <!-- 是物料类型，才可展示 -->
          <el-form-item v-if="curRect.getData().type === 'area'" label="物料类型">
            <el-radio-group v-model="curForm.areaType">
              <el-radio v-for="item in areaTypeObj" :key="item.value" :label="item.value">{{ item.label }}</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onSubmit(false)">预览</el-button>
            <el-button type="primary" @click="onReset">还原</el-button>
            <el-button type="primary" @click="onSubmit(true)">更新</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script>
// x6库
import { Graph, Shape, Addon } from "@antv/x6";
const { Dnd } = Addon; // 拖拽插件
// 接口
import $reservoir from "@/api/reservoir";
// 枚举
import enums from "@/utils/enum/index";

const mapEnum = enums.mapEnum;
const areaEnum = enums.areaEnum;

export default {
  name: "ReservoirConfig",
  data() {
    return {
      // NOTE: 画布相关
      graph: null, // 画布实例
      dnd: null, // 拖拽实例
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
      curRect: null, // 当前选中的矩形
      curForm: {
        name: "", // 对象名称
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        areaType: areaEnum.Material.value, // 物料区类型 (null: 非物料区，0: 物料区, 1:可抓, 2: 可放)
      }, // 当前 form 表单
      // NOTE: 库区数据
      playground: {}, // 库区数据
    };
  },
  computed: {
    // 可绘制类型选择
    mapTypeObj() {
      return this.$utils.objFilter(mapEnum, attr => attr.ext.typeShow === true);
    },
    // 抓料区放料区还是物料区
    areaTypeObj() {
      return areaEnum;
    },
    // 校验
    rules() {
      // 检查是否碰撞
      const checkCollision = (rule, value, callback) => {
        if (value === "") {
          return callback(new Error("不能为空"));
        }
        if (!Number.isInteger(value)) {
          callback(new Error("请输入数字值"));
        } else {
          if (value % 500 !== 0) {
            callback(new Error("必须是500的整数倍"));
          } else {
            callback();
          }
        }
      };
      return {
        name: [{ required: true, message: "请输入名称", trigger: "change" }],
        x: [{ required: true, validator: checkCollision, trigger: "change" }],
        y: [{ required: true, validator: checkCollision, trigger: "change" }],
        width: [{ required: true, validator: checkCollision, trigger: "change" }],
        height: [{ required: true, validator: checkCollision, trigger: "change" }],
      };
    },
  },
  watch: {
    canvas: {
      deep: true,
      immediate: false,
      handler(newVal) {
        if (this.graph) {
          console.log(newVal);
          this.graph.resize(newVal.width, newVal.height);
          this.graph.centerContent();
        }
      },
    },
  },
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
        interacting: function (cellView) {
          // 设置当前节点能否移动
          if (cellView.cell.getData().disableMove) {
            return { nodeMovable: false };
          }
          return true;
        },
        resizing: {
          enabled: function (Node) {
            if (!Node.getData().disableMove) {
              return true;
            }
            return false;
          },
        },
      });

      // 实例化拖拽插件
      this.dnd = new Dnd({
        target: this.graph,
        scaled: true,
        animation: true,
      });

      // 库区
      const warehouseRect = new Shape.Rect({
        id: warehouse.name + "-" + warehouse.id,
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
          label: {
            text: warehouse.name,
            fill: "#333",
            fontSize: 0,
          },
        },
        data: {
          // 自定义属性
          disableMove: true,
          areaType: null,
          type: warehouse.type, // rect类型(warehouse/wall/...)
        },
      });
      this.graph.addNode(warehouseRect);

      // 物料区
      area.forEach(item => {
        // 抓料区
        if (item.parentId === 0) {
          const rect = new Shape.Rect({
            id: item.name + "-" + item.id,
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
            data: {
              disableMove: false,
              areaType: areaEnum.Material.value, // 物料区，可抓区，可放区
              type: item.type,
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

      for (const [key, value] of Object.entries(data)) {
        if (!Array.isArray(value)) {
          // 库区
          value.type = key;
        } else {
          // 其他对象
          value.forEach(v => {
            v.type = key;
          });
        }
      }
      this.playground = data;
      console.log(this.playground);
    },

    // NOTE: 事件处理
    /**
     * @description 监听 画布 宽度的变化
     */
    observe() {
      const container = document.querySelector(".reservoir-config");
      const toolsRect = document.querySelector(".tools-inner").getBoundingClientRect();
      const configRect = document.querySelector(".config-inner").getBoundingClientRect();
      const ro = new ResizeObserver(entries => {
        for (const entry of entries) {
          const cr = entry.contentRect;
          this.canvas.width = cr.width - configRect.width;
          this.canvas.height = cr.height - toolsRect.height - 1;
        }
      });
      ro.observe(container);
    },
    /**
     * @description 给画布添加事件
     */
    addEvent() {
      // 鼠标点击
      this.graph.on("node:click", ({ e, x, y, cell, view }) => {
        this.coordinates = { x, y };
        console.log({ e, cell, view });
        this.curRect = cell;
        const {
          store: {
            data: { attrs, position, size, data: selfData },
          },
        } = this.curRect;
        this.curForm = {
          name: attrs.label.text,
          x: position.x,
          y: position.y,
          width: size.width,
          height: size.height,
          areaType: selfData.areaType,
        };
        console.log(this.curRect);
      });
      // 鼠标抬起
      this.graph.on("node:mouseup", ({ e, x, y, cell, view }) => {
        this.coordinates = { x, y };
        console.log({ e, cell, view });
        this.curRect = cell;
        const {
          store: {
            data: { attrs, position, size, data: selfData },
          },
        } = this.curRect;
        this.curForm = {
          name: attrs.label.text,
          x: position.x,
          y: position.y,
          width: size.width,
          height: size.height,
          areaType: selfData.areaType,
        };
        console.log(this.curRect);
      });
      // 缩放
      this.graph.on("node:resized", ({ e, x, y, cell, view }) => {
        this.coordinates = { x, y };
        console.log({ e, cell, view });
        this.curRect = cell;
        const {
          store: {
            data: { attrs, position, size, data: selfData },
          },
        } = this.curRect;
        this.curForm = {
          name: attrs.label.text,
          x: Math.floor(position.x),
          y: Math.floor(position.y),
          width: size.width,
          height: size.height,
          areaType: selfData.areaType,
        };
        console.log(this.curRect);
      });
    },
    /**
     * @description 开始拖拽
     */
    startDrag(e) {
      const target = e.currentTarget;
      const type = Number(target.getAttribute("data-type"));
      console.log({ type, label: mapEnum.getLabelByValue(type) });
      const node = this.graph.createNode({
        width: 20000,
        height: 5000,
        attrs: {
          body: {
            fill: "rgb(0, 174, 255, .25)",
            stroke: "#000",
            strokeWidth: 0,
          },
          label: {
            text: mapEnum.getLabelByValue(type),
            fill: "#333",
            fontSize: 500 * 2,
          },
        },
        data: {
          disableMove: false,
          areaType: type === mapEnum.area.value ? areaEnum.Material.value : null, // 物料区，可抓区，可放区
          type: mapEnum.getFieldByValue(type),
        },
      });
      this.dnd.start(node, e);
    },
    /**
     * @description 更新数据
     */
    onSubmit(isPreview = false) {
      this.$refs["form"].validate(valid => {
        if (valid && this.curRect) {
          const { x, y, width, height, name, areaType } = this.curForm;
          this.curRect
            .position(x, y)
            .resize(width, height)
            .attr({
              label: {
                text: name,
              },
            })
            .setData({
              areaType, // 是物料类型，才有区域类型，否则为null
            });

          if (isPreview) {
            console.log("更新");
          }
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    },
    /**
     * @description 还原节点
     */
    onReset() {
      const key = this.curRect.getData().type;
      const origRectData = key === "warehouse" ? this.playground[key] : this.playground[key].find(v => v.name + "-" + v.id === this.curRect.id);
      console.log(origRectData);
      this.curRect
        .position(origRectData.totalX, origRectData.totalY)
        .resize(origRectData.totalLength, origRectData.totalWidth)
        .attr({
          label: {
            text: origRectData.name,
          },
        })
        .setData({
          areaType: origRectData.type === "area" ? origRectData.isVirtual : null, // 是物料类型，才有区域类型，否则为null
        });

      const {
        store: {
          data: { attrs, position, size, data: selfData },
        },
      } = this.curRect;
      this.curForm = {
        name: attrs.label.text,
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
        areaType: selfData.areaType,
      };
    },
  },
};
</script>
<style lang="scss" scoped>
// 侧边栏宽度
$configW: 300px;
// 顶部工具栏高度（带下边框1px）
$toolsH: 51px;

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
      font-size: 14px;
      font-weight: bolder;
      color: #1890ff;
      background: #f7f9fb;
      border-right: 1px solid rgba(0, 0, 0, 0.08);
    }
  }

  .edit-inner {
    width: 100%;
    height: calc(100vh - 84px - $toolsH);

    .canvas-inner {
      flex: 1;
      border-right: 1px solid rgba(0, 0, 0, 0.08);
      border-left: 1px solid rgba(0, 0, 0, 0.08);
    }

    .config-inner {
      flex-basis: $configW;
      width: $configW;
      flex-shrink: 0;
    }
  }
}
</style>
