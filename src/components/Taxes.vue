<template>
  <div class="taxes-container">
    <h1 class="taxes-heading">Tax income</h1>
    <div class="canvas-container">
      <canvas id="taxes" ref="taxes"/>
    </div>
    <div class="legend-container">
      <h4>{{ legendHeader }}</h4>
      <template v-if="activeDataset != null">
        <div v-for="i in activeDataset.labels.length" :key="i" class="legend-block">
          <div
            class="legend-colorbox"
            :class="{ 'legend-colorbox--clickable': !hasSelected }"
            :style="{ 'background-color': activeDataset.backgroundColor[i - 1] }"
            @click="onClickLegend(i - 1)"
            @mouseenter="onHoverLegend(i - 1, true)"
            @mouseleave="onHoverLegend(i - 1, false)"/>
          {{ activeDataset.labels[i - 1] }}: {{ formatCurrency(activeDataset.data[i - 1]) }}
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import Chart from 'chart.js';
/* eslint-disable-next-line */
import ChartJsPlugin from 'chartjs-plugin-labels';
import chroma from 'chroma-js';
import numeral from 'numeral';

Chart.Tooltip.positioners.custom = (elements) =>  ({x: elements[0]._chart.chartArea.right / 2, y: 0 })

import { getPalette } from './colors';

export default {
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      activeDataset: null,
      selectedIndex: null,
      highlightedIndex: null
    };    
  },
  computed: {
    legendHeader() {
      return this.hasSelected
        ? `${this.subsetDataTitle}: ${this.formatCurrency(this.subsetTotal)}`
        : `Total tax income: ${this.formatCurrency(this.totalTax)}`;
    },
    labels() {
      return Object.keys(this.data);
    },
    hasSelected() {
      return this.selectedIndex != null;
    },
    datasets() {
      return [{
        backgroundColor: getPalette(this.labels.length),
        borderColor: this.labels.map(() => 'rgb(120, 120, 120)'),
        data: this.labels.map(key => this.data[key].total),
        labels: this.labels,
        weight: 0.4,
        position: 'inner'
      }];
    },
    subsetDataTitle() {
      return this.labels[this.selectedIndex];
    },
    subsetTotal() {
      return this.data[this.labels[this.selectedIndex]].total;
    },
    totalTax() {
      return this.labels.map(key => this.data[key].total).reduce((sum, item) => sum + item, 0);
    },
    options() {
      const component = this;
      return {
        legend: {
          display: false
        },
        plugins: {
          labels: {
            render(args) {
              if (args.dataset.position === 'inner' && component.hasSelected) return '';             
              return `${args.percentage}%`;
            },
            fontSize: 12,
            fontColor: '#fff'
          }
        },
        tooltips: {
          position: 'custom',
          caretSize: 0,
          callbacks: {
            label(tooltipItem, data) {
              const title = data.datasets[tooltipItem.datasetIndex].labels[tooltipItem.index];
              const value = component.formatCurrency(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]);

              return `${title}: ${value}`;
            }
          }
        }
      }
    }
  },
  mounted() {
    const ctx = this.$refs.taxes.getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: this.labels,
        datasets: this.datasets
      },
      options: {
        onClick: this.onClick,
        ...this.options
      }
    });

    this.activeDataset = this.chart.data.datasets[0];
  },
  methods: {
    formatCurrency(amount) {
      return `${numeral(amount).format('0.00a')} €`;
    },
    resetBorderColors(datasetIndex) {
      this.chart.data.datasets[datasetIndex].borderColor[this.highlightedIndex] = 'rgb(120, 120, 120)';
    },
    onClick(event, chartElements) {
      const el = chartElements[0];
      if (!el) return;

      if (this.hasSelected) {
        if (el._datasetIndex === 0) return;

        this.chart.data.datasets.splice(0,1);
        this.chart.data.datasets[0].backgroundColor = getPalette(this.chart.data.datasets[0].data.length);
        
        if (this.selectedIndex === el._index) {
          this.activeDataset = this.chart.data.datasets[0];
          this.selectedIndex = null;          
          this.chart.update();
          return;
        }
      }
      
      this.selectedIndex = el._index;          
      const key = this.labels[el._index];

      const subsetData = {
        backgroundColor: getPalette(this.data[key].items.length),
        borderColor: this.data[key].items.map(() => 'rgb(0, 0, 0)'),
        data: this.data[key].items.map(item => Math.abs(item.Nettokertymä)),
        labels: this.data[key].items.map(item => item.Momentti),
        hoverBackgroundColor: getPalette(this.data[key].items.length)
      }

      this.activeDataset = subsetData;

      this.chart.data.datasets.splice(0, 0, subsetData);
      this.chart.data.datasets[1].backgroundColor = this.labels.map(() => 'rgb(100, 100, 100)');
      this.chart.data.datasets[1].backgroundColor[el._index] = getPalette(this.chart.data.datasets[1].data.length)[el._index];

      this.chart.update();
    },
    onClickLegend(index) {
      this.onClick(null, [{ _index: index, _datasetIndex: 0 }]);
    },
    onHoverLegend(index, hoverState) {
      if (this.hasSelected) return;
      const currentColor = this.datasets[0].backgroundColor[index];
      if (hoverState) {
        this.datasets[0].backgroundColor[index] = chroma(currentColor).saturate(1).darken(0.3);
      } else {
        this.datasets[0].backgroundColor[index] = getPalette(this.datasets[0].data.length)[index];
      }      
      this.chart.update();
    }
  }
}
</script>

<style lang="scss" scoped>
.taxes-container {
  position: relative;
  max-width: 1100px;
  
  margin: 0 auto;
  box-sizing: border-box;  

  .taxes-heading {
    height: 60px;
    
    padding-left: 20px;
    text-align: left;
    font-size: 48px;
    color: rgb(210, 190, 140);
  }

  h4 {
    margin-top: 0;
    color: #fff;
  }

  .legend-container {
    margin: 20px auto;
    max-width: 400px;

    padding: 15px;

    font-size: 15px;
    
    text-align: left;
    background-color: rgb(60, 60, 60);
    border-radius: 4px;

    .legend-block {
      margin-bottom: 3px;
    }

    .legend-colorbox {
      display: inline-block;
      vertical-align: middle;
      height: 15px;
      width: 30px;
      border: 1px solid transparent;

      &--clickable {
        cursor: pointer;
        
        &:hover {
          border: 1px solid rgb(210, 210, 210);
        }
      }
    }
  }

  .canvas-container {
    margin: 0 auto;
    max-width: 1100px;
    position: relative;
  }

}
</style>
