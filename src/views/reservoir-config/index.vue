<!-- 页面名：reservoir -->
<template>
  <!-- 交互
    1. done 没有保存之前，可以随意新增区域。但有重叠的话，矩形会高亮。且没法儿保存
    2. done 点击网格或者节点，顶部可查看当前坐标，方便绘制
    3. done 双击节点，可以直接拖动编辑，或者点击节点，可以在表单设置值
    4. done 顶部选中哪个类型，可以绘制哪种类型的rect
    5. done 可以保存，且保存前要判断是否可提交
    6. done x,y坐标转换
   -->
  <div class="reservoir-config container">
    <!-- 编辑类型 -->
    <div class="tools-inner d-flex">
      <div class="header d-flex j-center a-center"> 组件库 </div>
      <div class="tools d-flex j-sb a-center flex-1 mx-2">
        <el-button-group>
          <el-button v-for="item in mapTypeFilterObj" :key="item.value" :data-type="item.value" @mousedown.native="startDrag">{{ item.label }}</el-button>
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
        <!-- 选中要编辑的rect，才显示表单 -->
        <el-form v-if="curRect" ref="ruleForm" :model="ruleForm[curRect.store.data.shape]" :rules="formRules" label-position="top" size="mini">
          <el-form-item v-for="([key, value], idx) in Object.entries(ruleForm[curRect.store.data.shape]).filter(v => v[1].show)" :key="idx" :label="value.label + '：'" :prop="key">
            <el-input v-model="value.value"></el-input>
          </el-form-item>
          <!-- 是物料类型，才可展示 -->
          <el-form-item v-show="curRect.getData().type === mapTypeObj.area.field" label="可抓区域：">
            <el-switch
              v-model="ruleForm[curRect.store.data.shape].isGrab.value"
              active-text="是"
              inactive-text="否"
              :disabled="curRect.getChildren() ? true : false"
              @change="resetParentId($event, 'isGrab')"
            ></el-switch>
          </el-form-item>
          <el-form-item v-show="curRect.getData().type === mapTypeObj.area.field" label="可放区域：">
            <el-switch
              v-model="ruleForm[curRect.store.data.shape].isPlace.value"
              active-text="是"
              inactive-text="否"
              :disabled="curRect.getChildren() ? true : false"
              @change="resetParentId($event, 'isPlace')"
            ></el-switch>
          </el-form-item>
          <!-- 是可抓可放，就展示物料区的select选择框 -->
          <el-form-item v-show="curRect.getData().rawData.isGrab || curRect.getData().rawData.isPlace" label="所属已维护物料区：">
            <el-select v-model="ruleForm[curRect.store.data.shape].parentId.value" placeholder="请选择物料区" @change="addToParentNode">
              <el-option
                v-for="item in areasNode"
                :key="item.id"
                :label="item.store.data.attrs.label.text"
                :value="item.getData().rawData.type + ',' + item.getData().rawData.typeId"
              ></el-option>
            </el-select>
          </el-form-item>
          <!-- 表单操作 -->
          <el-form-item>
            <el-button type="success" :disabled="haveCollision" @click="onSave(false)">保存</el-button>
            <!-- 没有id的，就算是新拖拽下来的 -->
            <el-button v-if="curRect.getData().rawData.groupId" type="info" @click="onReset">还原</el-button>
            <el-button v-show="curRect.getData().rawData.groupId" type="danger" @click="onDelete">删除</el-button>
          </el-form-item>
        </el-form>
        <p v-else>请点击画布中对象进行编辑</p>
      </div>
    </div>
  </div>
</template>

<script>
// x6库
import { Graph, Addon } from "@antv/x6";
import "./utils/rect";
const { Dnd } = Addon; // 拖拽插件

// 接口
import $reservoir from "@/api/reservoir";

// 枚举
import enums from "@/utils/enum/index";
const mapEnum = enums.mapEnum;

// 通用表单
const basicForm = type => {
  return {
    groupId: {
      label: "",
      value: "",
      show: false, // 是否展示在表单上
    }, // 类型矩阵分组
    name: {
      label: "名称",
      value: mapEnum.getLabelByValue(type),
      show: true, // 是否展示在表单上
    }, // 名称
    isGrab: {
      label: "可抓区",
      value: false,
      show: false, // 是否展示在表单上
    }, // 是否为可抓区域
    isPlace: {
      label: "可放区",
      value: false,
      show: false, // 是否展示在表单上
    }, // 是否为可放区域
    type: {
      label: "类型",
      value: type,
      show: false, // 是否展示在表单上
    }, // 区分类型 0:墙 1:物料 2:进料口 3:出料口 4:维修
    typeId: {
      label: "",
      value: null,
      show: false, // 是否展示在表单上
    }, // 类型对应的id（新增时不需要传递，后端生成）
    parentId: {
      label: "",
      value: null,
      show: false, // 是否展示在表单上
    }, // 虚拟区域才有值
    typeName: {
      label: "",
      value: null,
      show: false, // 是否展示在表单上
    }, // 类型名称（新增时不需要传递，后端生成）
    xpos: {
      label: "x坐标",
      value: 0,
      show: true, // 是否展示在表单上
    }, // x轴坐标
    ypos: {
      label: "y轴坐标",
      value: 0,
      show: true, // 是否展示在表单上
    }, // y轴坐标
    xlength: {
      label: "x轴长度",
      value: 0,
      show: true, // 是否展示在表单上
    }, // x轴长度
    ylength: {
      label: "y轴长度",
      value: 0,
      show: true, // 是否展示在表单上
    }, // y轴长度
    needDelete: {
      label: "是否需要删除",
      value: false,
      show: false,
    }, // 是否需要删除
  };
};

const warehouseForm = () => {
  return { ...basicForm(mapEnum.warehouse.value) }; // 总库区表单
};
const areaForm = () => {
  return { ...basicForm(mapEnum.area.value) }; // 物料表单
};
const inputForm = () => {
  return { ...basicForm(mapEnum.input.value) }; // 进料口表单
};
const outputForm = () => {
  return { ...basicForm(mapEnum.output.value) }; // 出料口表单
};
const wallForm = () => {
  return { ...basicForm(mapEnum.wall.value) }; // 墙表单
};
const maintainForm = () => {
  return { ...basicForm(mapEnum.maintain.value) }; // 检查口表单
};

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
      }, // 坐标,用来方便展示当前点击的网格坐标
      curRect: null, // 当前选中的矩形
      ruleForm: {
        [mapEnum.warehouse.field]: warehouseForm(),
        [mapEnum.area.field]: areaForm(),
        [mapEnum.input.field]: inputForm(),
        [mapEnum.output.field]: outputForm(),
        [mapEnum.wall.field]: wallForm(),
        [mapEnum.maintain.field]: maintainForm(),
      }, // 当前 form 表单
      haveCollision: true, // 整个画布是否还有碰撞的情况
      // NOTE: 库区数据
      playground: {}, // 库区数据
    };
  },
  computed: {
    // map类型选择
    mapTypeObj() {
      return mapEnum;
    },
    // 可绘制类型选择
    mapTypeFilterObj() {
      return this.$utils.objFilter(mapEnum, attr => attr.ext.typeShow === true);
    },
    // 已维护了的物料区
    areasNode() {
      const curId = this.curRect.id;
      return this.graph
        .getCells()
        .filter(v => v.store.data.shape === mapEnum.area.field && v.getData().rawData.typeId && !v.getData().rawData.isGrab && !v.getData().rawData.isPlace && v.id !== curId);
    },
    defaultArea() {
      // 当前node原始数据
      const curOriData = this.playground[this.curRect.store.data.shape].find(v => v.groupId === this.curRect.getData().rawData.groupId && (v.isGrab || v.isPlace));
      if (curOriData) {
        // 可抓可放
        return curOriData.typeId;
      } else {
        // 物料区
        return "";
      }
    },
    // 表单验证
    formRules() {
      // 检查是否为数字，且为单元格的倍数
      const checkValid = (rule, value, callback) => {
        const val = Number(value.value);
        if (val === "") {
          return callback(new Error("不能为空"));
        }
        if (!Number.isInteger(val)) {
          callback(new Error("请输入数字值"));
        } else {
          const scale = this.playground.warehouse ? this.playground.warehouse.minCarScale : 500;
          if (val % scale !== 0) {
            callback(new Error("必须是500的整数倍"));
          } else {
            callback();
          }
        }
      };
      return {
        name: [{ required: true, message: "请输入名称", trigger: "change" }],
        xpos: [{ required: true, validator: checkValid, trigger: "change" }],
        ypos: [{ required: true, validator: checkValid, trigger: "change" }],
        xlength: [{ required: true, validator: checkValid, trigger: "change" }],
        ylength: [{ required: true, validator: checkValid, trigger: "change" }],
      };
    },
  },
  watch: {
    canvas: {
      deep: true,
      immediate: false,
      handler(newVal) {
        // 画布尺寸变化，重新绘制画布大小
        if (this.graph) {
          this.graph.resize(newVal.width, newVal.height);
          this.graph.centerContent();
        }
      },
    },
    ruleForm: {
      deep: true,
      immediate: false,
      handler(newVal) {
        if (!this.curRect) return;
        // 监听当前表单对应node的数据变化
        const { xpos, ypos, xlength, ylength, name } = newVal[this.curRect.store.data.shape];
        const rawData = Object.entries(newVal[this.curRect.store.data.shape]).reduce((obj, cur) => {
          obj[cur[0]] = cur[1].value;
          return obj;
        }, {});
        // 给当前node赋值
        this.curRect
          .position(Math.floor(xpos.value), Math.floor(ypos.value))
          .resize(Math.floor(xlength.value), Math.floor(ylength.value))
          .attr({
            label: {
              text: name.value,
            },
          })
          .setData({
            rawData,
          });
      },
    },
  },
  async mounted() {
    // 获取画布数据
    await this.getPlayground();
    // 监听画布尺寸变化
    this.observe();
    // 初始化graph画布，更新画布成员
    this.initCanvas();
    // 给画布添加事件
    this.addEvent();
  },
  methods: {
    /**
     * @description 更新画布成员
     */
    async refresh() {
      await this.getPlayground();
      this.updateChildren();
    },
    // NOTE: 库区图绘制相关
    initCanvas() {
      // 初始化画布
      this.graph = new Graph({
        container: document.getElementById("canvas"),
        width: this.canvas.width,
        height: this.canvas.height,
        background: {
          color: "#fffbe6",
        },
        grid: {
          size: this.playground.warehouse.minCarScale, // 网格大小
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
        getDropNode: newNode => {
          // 拖拽结束后，检查碰撞
          setTimeout(() => {
            this.checkAllCollision();
          }, 0);
          const cloneNode = newNode.clone();
          return cloneNode;
        },
      });

      // 更新画布成员
      this.updateChildren();

      this.graph.centerContent();
      this.graph.zoom(-this.playground.warehouse.minCarScale);

      // 检测画布中是否有碰撞单位，有则不能一件保存
      this.checkAllCollision();
    },
    /**
     * @description 更新画布
     */
    updateChildren() {
      // 先清空画布
      this.graph.clearCells();

      // 获取原始数据
      const { area, input, output, wall, warehouse, maintain } = this.playground;

      // 绘制画布成员

      // 库区
      this.graph.addNode({
        shape: mapEnum.warehouse.field,
        rawData: warehouse,
      });

      // 物料区
      area.forEach(item => {
        // 物料区
        const parent = this.graph.addNode({
          shape: mapEnum.area.field,
          rawData: item,
          data: {
            disableMove: false,
          },
        });
        // 抓料区or放料区
        item.children.forEach(c => {
          const child = this.graph.addNode({
            shape: mapEnum.area.field,
            rawData: c,
            data: {
              disableMove: false,
            },
            zIndex: 100,
          });
          parent.addChild(child);
        });
      });

      // 进料口
      input.forEach(item => {
        this.graph.addNode({
          shape: mapEnum.input.field,
          rawData: item,
          data: {
            disableMove: false,
          },
        });
      });

      // 出料口
      output.forEach(item => {
        this.graph.addNode({
          shape: mapEnum.output.field,
          rawData: item,
          data: {
            disableMove: false,
          },
        });
      });

      // 墙
      wall.forEach(item => {
        this.graph.addNode({
          shape: mapEnum.wall.field,
          rawData: item,
          data: {
            disableMove: false,
          },
        });
      });

      // 检查口
      maintain.forEach(item => {
        this.graph.addNode({
          shape: mapEnum.maintain.field,
          rawData: item,
          data: {
            disableMove: false,
          },
        });
      });
    },
    /**
     * @description 检测两个 rect 是否碰撞（重叠）
     * @param {Rect} 当前rect
     * @param {Rect} 目标rect
     * @returns {Boolean} 是否碰撞
     */
    checkCollision(curRect, targetRect) {
      const isTargetChild = curRect.rawData.parentId === targetRect.rawData.type + "," + targetRect.rawData.typeId; // 当前rect是目标rect的儿子
      const isTargetParent = curRect.rawData.type + "," + curRect.rawData.typeId === targetRect.rawData.parentId; // 当前rect是目标rect的父亲
      const isSibling = curRect.rawData.parentId === targetRect.rawData.parentId && curRect.rawData.parentId !== null; // 兄弟关系

      if (isTargetChild || isTargetParent || isSibling) {
        // 父子或兄弟关系（判断是否在父容器内）
        return isTargetChild ? !this.checkContains(targetRect, curRect) : isTargetParent ? !this.checkContains(curRect, targetRect) : false;
      } else {
        // 非父子关系（判断是否重叠
        return curRect.x < targetRect.x + targetRect.width &&
          curRect.x + curRect.width > targetRect.x &&
          curRect.y < targetRect.y + targetRect.height &&
          curRect.y + curRect.height > targetRect.y
          ? true
          : false;
      }
    },
    /**
     * @description 检测两个 rect 是否包含（重叠）
     * @param {Rect} 目标rect
     * @param {Rect} 当前rect
     * @returns {Boolean} 目标rect是否包含当前rect
     */
    checkContains(targetRect, curRect) {
      return targetRect.x <= curRect.x &&
        targetRect.y <= curRect.y &&
        targetRect.x + targetRect.width >= curRect.x + curRect.width &&
        targetRect.y + targetRect.height >= curRect.y + curRect.height
        ? true
        : false;
    },
    /**
     * @description 检测当前对象和其他对象是否有碰撞
     */
    checkAllCollision() {
      const nodes = this.graph.getNodes();
      for (let i = 0; i < nodes.length; i++) {
        const curNode = nodes[i];
        // 如果当前node类型是warehouse，则忽略本次循环
        if (curNode.store.data.shape === mapEnum.warehouse.field) continue;
        const {
          position: { x, y },
          size: { width, height },
        } = curNode.store.data;

        const curRect = { x, y, width, height, rawData: curNode.getData().rawData };

        for (let j = 0; j < nodes.length; j++) {
          const inner = nodes[j];
          const {
            position: { x, y },
            size: { width, height },
          } = inner.store.data;
          const innerRect = { x, y, width, height, rawData: inner.getData().rawData };
          // 1. 如果id不同，且检测到碰撞，则设置碰撞属性为真
          // 2. 如果当前rect为可抓或者可放区域，则必须在自己所在物料区内部
          // 2.1 如果 parentId 有值，需要找到它的父容器并判断是否在其内部，在则不算碰撞，不再则算碰撞
          if (curNode.id !== inner.id && inner.store.data.shape !== mapEnum.warehouse.field && this.checkCollision(curRect, innerRect)) {
            curNode.setData({
              isCollision: true,
            });
            curNode.setAttrs({
              body: {
                fill: "rgba(255, 0, 0, 0.55)",
              },
            });
            break;
          }
          curNode.setData({
            isCollision: false,
          });
          curNode.setAttrs({
            body: {
              fill: mapEnum[curNode.store.data.shape].ext.fill,
            },
          });
        }
      }

      // 判断当前是否还有碰撞的情况
      this.haveCollision = this.graph
        .getNodes()
        .filter(node => node.store.data.shape !== mapEnum.warehouse.field)
        .some(node => node.getData().isCollision === true);
    },
    // NOTE: 网络请求
    /**
     * @description 请求画布数据
     */
    async getWareHouseInfo() {
      const [err, data] = await $reservoir.getBaseWareHouse();
      console.log("请求画布数据", data);
      if (err) return;
      return data;
    },
    /**
     * @description 请求画布内部组件数据
     */
    async getPlayground() {
      // 获取画布数据
      const [outerErr, outerData] = await $reservoir.getBaseWareHouse();
      console.log("请求画布数据", outerData);
      if (outerErr) return;
      // 获取画布内部组件数据
      const [innerErr, innerData] = await $reservoir.selectArea();
      console.log("请求画布内部组件数据", innerData);
      if (innerErr) return;

      // 组装最后父子结构的areas
      let areas = [];
      // 物料区根据parentId区分从属关系，parentId为type+typeId值之和
      for (let [key, value] of Object.entries(innerData)) {
        if (key === mapEnum.area.field) {
          const parents = value.filter(v => !v.parentId);
          let children = value.filter(v => v.parentId);
          console.log(parents, children);
          parents.forEach(p => {
            p.children = [];
            let idx = children.findIndex(v => v.parentId === p.type + "," + p.typeId);
            let target = children[idx];
            if (idx > -1) {
              p.children.push(target);
              children.splice(idx, 1);
            }
          });
          areas = parents;
        }
      }
      innerData[mapEnum.area.field] = areas || [];
      // 合并画布
      const mergeData = {
        warehouse: outerData,
        ...innerData,
      };

      this.playground = mergeData;
      console.log(this.playground);
    },
    /**
     * @description 更新数据
     */
    onSave(isPreview = true) {
      /**
       *  实时更新node和表单
       *  拖动node，更新node和表单
       *  更改表单，更新node
       *  添加重置按钮，每次重置，把原始数据覆盖到node和表单上
       *  如果是新增的node，重置时把node和form还原到初始状态
       */

      this.$refs["ruleForm"].validate(async valid => {
        if (valid && this.curRect) {
          const { xpos, ypos, xlength, ylength, name } = this.ruleForm[this.curRect.store.data.shape];
          this.curRect
            .position(Math.floor(xpos.value), Math.floor(ypos.value))
            .resize(Math.floor(xlength.value), Math.floor(ylength.value))
            .attr({
              label: {
                text: name.value,
              },
            });

          if (!isPreview) {
            console.log(
              "更新",
              Object.entries(this.ruleForm[this.curRect.store.data.shape]).reduce((obj, cur) => {
                obj[cur[0]] = cur[1].value;
                return obj;
              }, {}),
            );

            const params = this.graph
              .getCells()
              .filter(v => v.store.data.shape !== mapEnum.warehouse.field)
              .map(v => {
                return {
                  ...v.getData().rawData,
                  xpos: v.store.data.position.x,
                  ypos: v.store.data.position.y,
                  xlength: v.store.data.size.width,
                  ylength: v.store.data.size.height,
                };
              });
            const [err] = await $reservoir.save(params);
            if (!err) {
              // 重置
              this.ruleForm = {
                [mapEnum.warehouse.field]: warehouseForm(),
                [mapEnum.area.field]: areaForm(),
                [mapEnum.input.field]: inputForm(),
                [mapEnum.output.field]: outputForm(),
                [mapEnum.wall.field]: wallForm(),
                [mapEnum.maintain.field]: maintainForm(),
              };
              this.curRect = null;
              this.$message({
                message: "更新成功！",
                type: "success",
              });
              this.refresh();
            }
          }
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    },
    // 删除某个rect
    onDelete() {
      this.$confirm("此删除操作将永久删除该组件，是否继续？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        this.ruleForm[this.curRect.store.data.shape].needDelete.value = true;
        this.curRect.getData().rawData.needDelete = true;
        this.onSave(false);
        this.$message({
          type: "success",
          message: "删除成功！",
        });
      });
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
      this.graph.on("node:click", data => {
        this.setCurRectAndCurForm(data, "node:click");
      });
      // 鼠标抬起
      this.graph.on("node:mouseup", data => {
        this.setCurRectAndCurForm(data, "node:mouseup");
        this.checkAllCollision(); // 鼠标抬起和rect重设大小时，检测
      });
      // 缩放
      this.graph.on("node:resized", data => {
        this.setCurRectAndCurForm(data, "node:resized");
        this.checkAllCollision(); // 鼠标抬起和rect重设大小时，检测
      });
    },
    /**
     * @description 设置 curRect 和 curForm
     */
    setCurRectAndCurForm({ e, x, y, cell, view }, type) {
      this.coordinates = { x, y };
      if (cell.store.data.shape === mapEnum.warehouse.field) return;
      this.curRect = cell;
      console.log("addEvent - " + type, { e, cell, view, curRect: this.curRect });
      const {
        store: {
          data: { position, size },
        },
      } = this.curRect;

      for (const [key, value] of Object.entries(this.curRect.getData().rawData)) {
        // eslint-disable-next-line no-prototype-builtins
        if (this.ruleForm[this.curRect.store.data.shape].hasOwnProperty(key)) {
          this.ruleForm[this.curRect.store.data.shape][key].value = value;
        }
      }
      this.ruleForm[this.curRect.store.data.shape].xpos.value = Math.floor(position.x);
      this.ruleForm[this.curRect.store.data.shape].ypos.value = Math.floor(position.y);
      this.ruleForm[this.curRect.store.data.shape].xlength.value = Math.floor(size.width);
      this.ruleForm[this.curRect.store.data.shape].ylength.value = Math.floor(size.height);
    },
    /**
     * @description 开始拖拽
     */
    startDrag(e) {
      const target = e.currentTarget;
      const value = Number(target.getAttribute("data-type"));

      let node = null;
      switch (value) {
        case mapEnum.area.value: // 物料区
          node = this.graph.createNode({
            shape: mapEnum.area.field,
            rawData: {
              ...Object.entries(areaForm()).reduce((obj, cur) => {
                obj[cur[0]] = cur[1].value;
                return obj;
              }, {}),
              xlength: 20000,
              ylength: 10000,
            },
          });
          break;
        case mapEnum.input.value: // 进料口
          node = this.graph.createNode({
            shape: mapEnum.input.field,
            rawData: {
              ...Object.entries(inputForm()).reduce((obj, cur) => {
                obj[cur[0]] = cur[1].value;
                return obj;
              }, {}),
              xlength: 5000,
              ylength: 2500,
            },
          });
          break;
        case mapEnum.output.value: // 出料口
          node = this.graph.createNode({
            shape: mapEnum.output.field,
            rawData: {
              ...Object.entries(outputForm()).reduce((obj, cur) => {
                obj[cur[0]] = cur[1].value;
                return obj;
              }, {}),
              xlength: 5000,
              ylength: 2500,
            },
          });
          break;
        case mapEnum.wall.value: // 墙
          node = this.graph.createNode({
            shape: mapEnum.wall.field,
            rawData: {
              ...Object.entries(wallForm()).reduce((obj, cur) => {
                obj[cur[0]] = cur[1].value;
                return obj;
              }, {}),
              xlength: 500,
              ylength: 20000,
            },
          });
          break;
        case mapEnum.maintain.value: // 检查口
          node = this.graph.createNode({
            shape: mapEnum.maintain.field,
            rawData: {
              ...Object.entries(maintainForm()).reduce((obj, cur) => {
                obj[cur[0]] = cur[1].value;
                return obj;
              }, {}),
              xlength: 5000,
              ylength: 5000,
            },
          });
          break;
        default:
          break;
      }
      console.log("startDrag", { node });
      this.dnd.start(node, e);
    },
    /**
     * @description 重置当前node所依赖的父node
     * @param {Boolean} switch是否打开
     * @param {String} isGrab 还是 isPlace
     */
    resetParentId(isOpen, type) {
      this.curRect.getData().rawData[type] = isOpen;
      console.log(isOpen, this.curRect.getData().rawData.isGrab, this.curRect.getData().rawData.isPlace);
      if (!isOpen && !this.curRect.getData().rawData.isGrab && !this.curRect.getData().rawData.isPlace) {
        // 找到所选物料区并解除父子绑定
        const parentNode = this.graph
          .getCells()
          .filter(v => v.store.data.shape === mapEnum.area.field && v.getData().rawData.type + "," + v.getData().rawData.typeId === this.curRect.getData().rawData.parentId)[0];
        this.curRect.setZIndex(1);
        parentNode && parentNode.unembed(this.curRect);
        console.log("parentNode", parentNode);

        // 清空当前元素parentId
        this.curRect.getData().rawData.parentId = null;

        // 清楚form得parentId
        this.ruleForm[this.curRect.store.data.shape].parentId.value = null;
      }

      this.checkAllCollision();
    },
    /**
     * @description 添加当前区域到物料区
     * @param {string} 区域的typeId
     */
    addToParentNode(parentId) {
      // 找到所选物料区
      const parentNode = this.graph
        .getCells()
        .filter(v => v.store.data.shape === mapEnum.area.field && v.getData().rawData.type + "," + v.getData().rawData.typeId === parentId)[0];
      this.curRect.setZIndex(100);
      // 添加到目标物料区
      parentNode && parentNode.addChild(this.curRect);
      this.curRect.getData().rawData.parentId = parentId;
      this.checkAllCollision();
    },
    /**
     * @description 还原节点
     */
    onReset() {
      // 获取当前node的原始数据（groupId不会有重复）
      const originalData = this.playground[this.curRect.store.data.shape].find(v => v.groupId === this.curRect.getData().rawData.groupId);

      if (originalData) {
        // 当前重置的是已有的
        const { xpos, ypos, xlength, ylength, name } = originalData;

        this.curRect
          .position(Math.floor(xpos), Math.floor(ypos))
          .resize(Math.floor(xlength), Math.floor(ylength))
          .attr({
            label: {
              text: name,
            },
          })
          .setData({
            rawData: originalData,
          });

        this.setCurRectAndCurForm({ e: null, x: xpos, y: ypos, cell: this.curRect, view: null }, "onReset");
      }
      this.checkAllCollision();
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
    height: calc(100vh - 84px - #{$toolsH});

    .canvas-inner {
      flex: 1;
      border-right: 1px solid rgba(0, 0, 0, 0.08);
      border-left: 1px solid rgba(0, 0, 0, 0.08);
    }

    .config-inner {
      flex-basis: $configW;
      width: $configW;
      flex-shrink: 0;
      overflow-y: auto;
    }
  }
}
</style>
