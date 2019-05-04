<template>
  <canvas ref="canvas"/>
</template>

<script>
import Chart from 'chart.js';
/* eslint-disable-next-line */
import ChartJsPlugin from 'chartjs-plugin-labels';

export default {
  props: {
    data: {
      type: Object,
      required: true
    },
    options: {
      type: Object,
      required: true
    }    
  },
  mounted() {
    const component = this;
    const ctx = this.$refs.canvas.getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: component.data,
      options: component.options
    });
  },
  watch: {
    data() {
      this.chart.data = this.data;
      this.chart.update();
    }
  }
}
</script>
