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

    <!-- 行车列表(卡片形式) -->
    <hc-cards
      ref="hcCards"
      :cards="hcCardsArr"
      class="pt-2"
      @toggleNetwork="toggleNetwork"
      @toggleStatus="toggleStatus"
      @toggleAutoMode="toggleAutoMode"
      @triggerReset="triggerReset"
      @triggerStop="triggerStop"
    />
  </div>
</template>

<script src="./home.js"></script>
<style lang="scss" scoped>
@import "./home.scss"; // 引入scss类
</style>
