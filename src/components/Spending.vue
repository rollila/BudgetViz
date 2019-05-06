<template>
  <div class="spending-container">
    <h1 class="spending-heading">Spending</h1>
    <div class="canvas-container">
      <canvas ref="canvas"/>
    </div>
  </div>
</template>

<script>
/* eslint-disable */

import Chart from 'chart.js';
import ChartJsPlugin from 'chartjs-plugin-labels';
import numeral from 'numeral';

export default {
  props: {
    data: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      selectedCenterIndex: null,
      selectedInnerIndex: null      
    };    
  },
  computed: {
    outerDataset() {
      if (this.selectedInnerIndex == null || this.selectedCenterIndex == null) return null;

      const dataset = this.data[this.selectedInnerIndex][this.selectedCenterIndex];

      return {
        data: dataset.items.map(item => item['Voimassaoleva talousarvio']),
        labels: dataset.items.map(item => item['Momentti'])
      };
    },
    centerDataset() {
      if (this.selectedInnerIndex == null) return null;

      const dataset = this.data[this.selectedInnerIndex];

      return {
        data: Object.keys(dataset).map(item => dataset[item].total).filter(item => item != null),
        labels: Object.keys(dataset).filter(item => item !== 'label' && item !== 'total')
      }
    },
    innerDataset() {
      return {
        data: this.data.map(item => item.total).filter(item => item != null),
        labels: this.data.map(item => item.label).filter(item => item !== 'label' && item !== 'total')
      }
    },
    datasets() {
      return [this.outerDataset, this.centerDataset, this.innerDataset].filter(item => item != null);
    }
  },
  mounted() {
    const component = this;
    console.log(this.data);
    const ctx = this.$refs.canvas.getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        datasets: this.datasets
      },
      options: {
        onClick(event, chartElements) {
          const el = chartElements[0];
          if (!el) return;

          const activeDatasets = component.chart.data.datasets;

          if (activeDatasets.length === 1) {
            component.selectedInnerIndex = el._index;
          }

          if (activeDatasets.length === 2) {
            if (el._datasetIndex === 0) {
              component.selectedCenterIndex = component.chart.data.datasets[el._datasetIndex].labels[el._index];
            }
            if (el._datasetIndex === 1) {
              component.selectedInnerIndex = el._index;
              component.selectedCenterIndex = null;
            }
          }

          component.chart.data.datasets = component.datasets;
          component.chart.update();
        },
        tooltips: {
          callbacks: {
            label(tooltipItem, data) {
              const title = data.datasets[tooltipItem.datasetIndex].labels[tooltipItem.index];
              const value = component.formatCurrency(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]);

              return `${title}: ${value}`;
            }
          }
        }
      }
    })
  },
  methods: {
    formatCurrency(amount) {
      return `${numeral(amount).format('0.00a')} €`;
    }
  }
}
</script>

<style lang="scss" scoped>
.spending-container {
  max-width: 1100px;

  .spending-heading {
    height: 60px;
    
    padding-left: 20px;
    text-align: left;
    font-size: 48px;
    color: rgb(210, 190, 140);
  }

}
</style>
