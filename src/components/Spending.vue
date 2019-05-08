<template>
  <div class="spending-container">
    <h1 class="spending-heading">Spending</h1>
    <div class="canvas-container">
      <canvas ref="canvas"/>
    </div>
    <div class="legend-container">
      <h4>{{ legendHeader }}</h4>
      <template v-if="activeDataset != null">
        <div v-for="i in activeDataset.labels.length" :key="i" class="legend-block">
          <div
            class="legend-colorbox"
            :class="{ 'legend-colorbox--clickable': selectedCenterIndex == null }"
            :style="{ 'background-color': activeDataset.backgroundColor[i - 1] }"
            @click="onClickLegend(i - 1)"
            @mouseenter="onHoverLegend(i - 1, true)"
            @mouseleave="onHoverLegend(i - 1, false)"
          />
          <span
            :title="activeDataset.labels[i - 1]"
            class="legend-label">
            {{ activeDataset.labels[i - 1] }}
          </span>
          <span class="legend-value">: {{ formatCurrency(activeDataset.data[i - 1]) }}</span>
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
    activeDataset() {
      return this.datasets[0];
    },
    outerDataset() {
      if (this.selectedInnerIndex == null || this.selectedCenterIndex == null) return null;

      const dataset = this.data[this.selectedInnerIndex][this.selectedCenterIndex];

      return {
        data: dataset.items.map(item => item['Voimassaoleva talousarvio']),
        labels: dataset.items.map(item => item['Momentti']),
        backgroundColor: getPalette(dataset.items.length),
        borderColor: 'rgb(0, 0, 0)',
        position: 'outer',
        weight: 5,
        hoverBackgroundColor: getPalette(dataset.items.length)
      };
    },
    centerDataset() {
      if (this.selectedInnerIndex == null) return null;

      const dataset = this.data[this.selectedInnerIndex];

      return {
        data: Object.keys(dataset).map(item => dataset[item].total).filter(item => item != null),
        labels: Object.keys(dataset).filter(item => item !== 'label' && item !== 'total'),
        backgroundColor: getPalette(Object.keys(dataset).filter(item => item !== 'label' && item !== 'total').length),
        borderColor: Object.keys(dataset).map(() => 'rgb(0, 0, 0)'),
        position: 'center',
        weight: 2
      }
    },
    innerDataset() {
      return {
        data: this.data.map(item => item.total).filter(item => item != null),
        labels: this.data.map(item => item.label).filter(item => item !== 'label' && item !== 'total'),
        backgroundColor: getPalette(this.data.length),
        borderColor: this.data.map(() => 'rgb(0, 0, 0)'),
        position: 'inner'
      }
    },
    datasets() {
      return [this.outerDataset, this.centerDataset, this.innerDataset].filter(item => item != null);
    },
    legendHeader() {
      if (this.selectedInnerIndex == null) {
        return `Total spending: ${this.formatCurrency(this.totalSpending)}`;
      }
      if (this.selectedCenterIndex == null) {
        return `${this.data[this.selectedInnerIndex].label}: ${this.formatCurrency(this.data[this.selectedInnerIndex].total)}`
      }
      return `${this.selectedCenterIndex}: ${this.formatCurrency(this.data[this.selectedInnerIndex][this.selectedCenterIndex].total)}`;
    },
    totalSpending() {
      return this.data.reduce((sum, item) => sum + item.total, 0);
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
        onClick(event, chartElements) {
          const el = chartElements[0];
          if (!el) return;

          const activeDatasets = component.chart.data.datasets;

          const clickedInner = activeDatasets.length === 1
            || (activeDatasets.length === 2 && el._datasetIndex === 1)
            || (activeDatasets.length === 3 && el._datasetIndex === 2);

          const clickedCenter = (activeDatasets.length === 2 && el._datasetIndex === 0) || (activeDatasets.length === 3 && el._datasetIndex === 1);

          if (clickedInner) {
            component.onSelectInnerIndex(el._index);            
          } else if (clickedCenter) {
            component.onSelectCenterIndex(el._index)
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
    },
    onClickLegend(index) {
      if (this.selectedCenterIndex == null && this.selectedInnerIndex != null) {
        this.onSelectCenterIndex(index); 
      } else if (this.selectedInnerIndex == null) {
        this.onSelectInnerIndex(index);
      }
    },
    onSelectCenterIndex(index) {
      const datasetIndex = this.datasets.findIndex(set => set.position === 'center');
      const centerDataset = this.datasets[datasetIndex];
      const targetKey = centerDataset.labels[index];
      const palette = getPalette(centerDataset.data.length);

      if(targetKey === this.selectedCenterIndex) {
        centerDataset.backgroundColor = palette;
        this.selectedCenterIndex = null;              
      } else {
        centerDataset.backgroundColor = centerDataset.data.map(() => 'rgb(100, 100, 100)');
        centerDataset.backgroundColor[index] = palette[index];
        this.selectedCenterIndex = targetKey;
      }
      
      this.chart.data.datasets = this.datasets;
      this.chart.update();
    },
    onSelectInnerIndex(index) {
      this.selectedCenterIndex = null;
      const innerDataset = this.datasets.find(set => set.position === 'inner');
      const palette = getPalette(innerDataset.data.length);

      if (index === this.selectedInnerIndex) {              
        innerDataset.backgroundColor = palette;
        this.selectedInnerIndex = null;
      } else {
        innerDataset.backgroundColor = innerDataset.data.map(() => 'rgb(100, 100, 100)');
        innerDataset.backgroundColor[index] = palette[index];

        this.selectedInnerIndex = index;
      }

      this.chart.data.datasets = this.datasets;
      this.chart.update();
    },
    onHoverLegend(index, hoverState) {
      if (this.selectedCenterIndex != null) return;
      const activeDataset = this.selectedInnerIndex == null
        ? this.datasets.find(set => set.position === 'inner')
        : this.datasets.find(set => set.position === 'center');

      const currentColor = activeDataset.backgroundColor[index];
      if (hoverState) {
        activeDataset.backgroundColor[index] = chroma(currentColor).saturate(1).darken(0.3);
        activeDataset.borderColor[index] = 'rgb(210, 210, 210)';
      } else {
        activeDataset.backgroundColor[index] = getPalette(activeDataset.data.length)[index];
        activeDataset.borderColor[index] = 'rgb(0, 0, 0)';
      }      
      this.chart.update();
    }
  }
}
</script>

<style lang="scss" scoped>
.spending-container {
  max-width: 1100px;

  h4 {
    margin-top: 0;
    color: #fff;
  }

  .spending-heading {
    height: 60px;
    
    padding-left: 20px;
    text-align: left;
    font-size: 48px;
    color: rgb(210, 190, 140);
  }

  .legend-container {
    margin: 20px auto;
    max-width: 500px;
    
    padding: 15px;

    font-size: 15px;
    
    text-align: left;
    background-color: rgb(60, 60, 60);
    border-radius: 4px;

    .legend-label {
      margin-left: 6px;
      display: inline-block;
      vertical-align: middle;
      max-width: 375px;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    .legend-value {
      display: inline-block;
      vertical-align: middle;
    }

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

}
</style>
