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

import { getPalette } from './colors';

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
        labels: dataset.items.map(item => item['Momentti']),
        backgroundColor: getPalette(dataset.items.length),
        borderColor: 'rgb(0, 0, 0)',
        position: 'outer'
      };
    },
    centerDataset() {
      if (this.selectedInnerIndex == null) return null;

      const dataset = this.data[this.selectedInnerIndex];

      return {
        data: Object.keys(dataset).map(item => dataset[item].total).filter(item => item != null),
        labels: Object.keys(dataset).filter(item => item !== 'label' && item !== 'total'),
        backgroundColor: getPalette(Object.keys(dataset).length),
        borderColor: 'rgb(0, 0, 0)',
        position: 'center'
      }
    },
    innerDataset() {
      return {
        data: this.data.map(item => item.total).filter(item => item != null),
        labels: this.data.map(item => item.label).filter(item => item !== 'label' && item !== 'total'),
        backgroundColor: getPalette(this.data.length),
        borderColor: 'rgb(0, 0, 0)',
        hoverBorderColor: 'rgb(30, 190, 230)',
        position: 'inner'
      }
    },
    datasets() {
      return [this.outerDataset, this.centerDataset, this.innerDataset].filter(item => item != null);
    }
  },
  mounted() {
    const component = this;
    const ctx = this.$refs.canvas.getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'pie',
      data: {
        datasets: this.datasets
      },
      options: {
        onHover() {
          component.chart.update();
        },
        onClick(event, chartElements) {
          const el = chartElements[0];
          if (!el) return;

          const activeDatasets = component.chart.data.datasets;

          const clickedInner = activeDatasets.length === 1
            || (activeDatasets.length === 2 && el._datasetIndex === 1)
            || (activeDatasets.length === 3 && el._datasetIndex === 2);

          if (clickedInner) {
            component.selectedCenterIndex = null;
            const innerDataset = activeDatasets.find(set => set.position === 'inner');
            const palette = getPalette(innerDataset.data.length);

            if (el._index === component.selectedInnerIndex) {              
              innerDataset.backgroundColor = palette;
              component.selectedInnerIndex = null;
            } else {
              innerDataset.backgroundColor = innerDataset.data.map(item => 'rgb(100, 100, 100)');
              innerDataset.backgroundColor[el._index] = palette[el._index];

              component.selectedInnerIndex = el._index;
            }
          }

          const clickedCenter = (activeDatasets.length === 2 && el._datasetIndex === 0) || (activeDatasets.length === 3 && el._datasetIndex === 1);

          if (clickedCenter) {
            const targetIndex = component.chart.data.datasets[el._datasetIndex].labels[el._index]
            const centerDataset = activeDatasets.find(set => set.position === 'center');
            const palette = getPalette(centerDataset.data.length);

            if(targetIndex === component.selectedCenterIndex) {
              centerDataset.backgroundColor = palette;
              component.selectedCenterIndex = null;              
            } else {
              centerDataset.backgroundColor = centerDataset.data.map(item => 'rgb(100, 100, 100)');
              centerDataset.backgroundColor[el._index] = palette[el._index];
              component.selectedCenterIndex = targetIndex;
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
        },
        plugins: {
          labels: {
            render(args) {
              if (args.dataset.position === 'inner' && component.selectedInnerIndex != null) return '';
              if (args.dataset.position === 'center' && component.selectedCenterIndex != null) return '';              
              return `${args.percentage}%`;
            },
            fontSize: 12,
            fontColor: '#fff'
          }
        },
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
