<!-- home -->
<template>
  <!-- 首页 -->
  <div
    v-loading="!isConnect"
    class="app-container home-container"
    element-loading-text="正在连接中"
    element-loading-spinner="el-icon-loading"
    element-loading-background="rgba(0, 0, 0, 0.8)"
  >
    <!-- 整体状态(地面工作台) -->
    <overview
      :studio="studio"
      :center-control-studio="centerControlStudio"
      @toggleOverviewNetwork="toggleOverviewNetwork"
      @toggleCenterControlNetwork="toggleCenterControlNetwork"
    />
  </div>
</template>

<script src="./home.js"></script>
<style lang="scss" scoped>
@import "./home.scss"; // 引入scss类
</style>
