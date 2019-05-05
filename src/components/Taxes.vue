<template>
  <div class="taxes-container">
    <h1 class="taxes-heading">Tax income, 2018 budget</h1>
    <div class="legend-container">
      <h4>{{ legendHeader }}</h4>
      <template v-if="activeDataset != null">
        <div v-for="i in activeDataset.labels.length" :key="i" class="legend-block">
          <div class="legend-colorbox" :style="{ 'background-color': activeDataset.backgroundColor[i - 1] }"/>
          {{ activeDataset.labels[i - 1] }}: {{ formatCurrency(activeDataset.data[i - 1]) }}
        </div>
      </template>
    </div>
    <div class="canvas-container">
      <canvas id="taxes" ref="taxes"/>
    </div>
  </div>
</template>

<script>
/* eslint-disable */

import Chart from 'chart.js';
import ChartJsPlugin from 'chartjs-plugin-labels';
import numeral from 'numeral';

// import TaxesSubcategory from './Taxes-Subcategory';

const colors = ['#003f5c',
'#58508d',
'#bc5090',
'#ff6361',
'#ffa600'];

export default {
  components: {
   //  TaxesSubcategory
  },
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
        backgroundColor: colors.concat(),
        borderColor: this.labels.map(() => 'rgb(120, 120, 120)'),
        data: this.labels.map(key => this.data[key].total),
        labels: this.labels
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
            render: 'percentage',
            fontSize: 12,
            fontColor: '#fff'
          }
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
    }
  },
  mounted() {
    const component = this;
    const ctx = this.$refs.taxes.getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.labels,
        datasets: this.datasets
      },
      options: {
        onHover(event, chartElements) {
          const el = chartElements[0];
          if (!el) {
            const innerIndex = component.hasSelected ? 1 : 0;
            component.resetBorderColors(innerIndex);
            component.chart.update();
            return;
          }
          if (component.hasSelected && el._datasetIndex === 0) {
            component.resetBorderColors(1);
            component.chart.update();
            return;
          };

          component.resetBorderColors(el._datasetIndex);
          component.highlightedIndex = el._index;
          component.chart.data.datasets[el._datasetIndex].borderColor[el._index] = 'rgb(40, 190, 230)';
          component.chart.update();
        },
        onClick(event, chartElements) {
          const el = chartElements[0];
          if (!el) return;

          if (component.hasSelected) {
            if (el._datasetIndex === 0) return;

            component.chart.data.datasets.splice(0,1);
            component.chart.data.datasets[0].backgroundColor = colors;
           
            if (component.selectedIndex === el._index) {
              component.activeDataset = this.chart.data.datasets[0];
              component.selectedIndex = null;          
              component.chart.update();
              return;
            }
          }
          
          component.selectedIndex = el._index;          
          const key = component.labels[el._index];

          const subsetData = {
            backgroundColor: colors.concat(),
            borderColor: colors.map(() => 'rgb(0, 0, 0)'),
            data: component.data[key].items.map(item => Math.abs(item.Nettokertymä)),
            labels: component.data[key].items.map(item => item.Momentti)
          }

          component.activeDataset = subsetData;

          component.chart.data.datasets.splice(0, 0, subsetData);
          component.chart.data.datasets[1].backgroundColor = component.labels.map(() => 'rgb(100, 100, 100)');
          component.chart.data.datasets[1].backgroundColor[el._index] = colors[el._index];

          component.chart.update();
        },
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
    }
  }

}
</script>

<style lang="scss" scoped>
.taxes-container {
  position: relative;
  max-width: 1800px;
  
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
    color: rgb(210, 190, 140);
  }

  .legend-container {
    position: absolute;
    left: 20px;
    top: 180px;
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
      height: 15px;
      width: 30px;
    }
  }

  .canvas-container {    
    margin: 0 auto;
    padding-left: 400px;
  }

}
</style>
