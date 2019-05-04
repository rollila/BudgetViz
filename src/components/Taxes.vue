<template>
  <div class="taxes-container">
    <div class="main">
      <canvas id="taxes" ref="taxes"/>
      <p>Total tax income: {{ formatCurrency(totalTax) }}</p>
    </div>
    <div class="sub">
      <template v-if="subsetData">
        <taxes-subcategory :data="subsetData" :options="options"/>
        <p>{{ subsetDataTitle }}: {{ formatCurrency(subsetTotal) }}</p>
      </template>
    </div>
  </div>
</template>

<script>
import Chart from 'chart.js';
/* eslint-disable-next-line */
import ChartJsPlugin from 'chartjs-plugin-labels';
import numeral from 'numeral';

import TaxesSubcategory from './Taxes-Subcategory';

const colors = ['#003f5c',
'#58508d',
'#bc5090',
'#ff6361',
'#ffa600'];

export default {
  components: {
    TaxesSubcategory
  },
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      subsetData: null,
      selectedIndex: null
    };    
  },
  computed: {
    labels() {
      return Object.keys(this.data);
    },
    datasets() {
      return [{
        backgroundColor: colors.concat(),
        borderColor: this.labels.map(() => 'rgb(120, 120, 120)'),
        data: this.labels.map(key => this.data[key].total)
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
      return {
        legend: {
          display: false
        },
        plugins: {
          labels: {
            render(args) {
              return `${args.label}\n\n${args.percentage}%`;
            },
            fontSize: 12,
            fontColor: '#fff'
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
        onClick(event, chartElements) {
          const el = chartElements[0];
          if (!el) return;

          if (component.selectedIndex != null) {
            component.chart.data.datasets[0].borderColor[component.selectedIndex] = 'rgb(120, 120, 120)';
          }
          if (component.selectedIndex === el._index) {
            component.chart.data.datasets[0].borderColor[component.selectedIndex] = 'rgb(120, 120, 120)';
            component.subsetData = null;
            component.selectedIndex = null;
            component.chart.update();
            return;
          }
          
          component.selectedIndex = el._index;
          component.chart.data.datasets[0].borderColor[el._index] = 'rgb(40, 190, 230)';

          const key = component.labels[el._index];

          component.subsetData = {
            labels: component.data[key].items.map(item => item.Momentti),
            datasets: [
              {
                backgroundColor: colors.concat(),
                borderColor: 'rgb(0, 0, 0)',
                data: component.data[key].items.map(item => Math.abs(item.Nettokertymä))
            }]
          };

          component.chart.update();
        },
        ...this.options
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
.taxes-container {
  display: flex;

  .main {
    flex-basis: 50%;
    height: 600px;
    
  }
  .sub {
    flex-basis: 50%;
  }
}
</style>
