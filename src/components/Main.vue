<template>
  <div class="main">
    <div class="introduction">
      <p>This page contains a visual representation of budget data of the Finnish government for year 2018. The visualization has been implemented for the Interactive Data Visualization course at Uni. Helsinki.
      <br>
      Currently implemented: tax income, explorable by category.
      <br>
      To be implemented: Spending.</p>      
    </div>
    <Taxes :data="taxData" class="taxes"/>
    <Spending :data="spendingData"/>
  </div>
</template>

<script>
import * as _ from 'lodash';

import Talousarvio from '../assets/Talousarvio-fi.csv';
import Verotulot from '../assets/Verotulot-fi.csv';

import Spending from './Spending';
import Taxes from './Taxes';

export default {
  components: {
    Spending,
    Taxes
  },
  data() {
    return {
      verotulot: Verotulot
    }
  },
  computed: {
    taxData() {
      return Verotulot.reduce((acc, item) => {
        if (acc[item.Luku] == null) {
          acc[item.Luku] = {
            total: Math.abs(item.Nettokertymä),
            items: [item]
          }        
        } else {
          acc[item.Luku].total += Math.abs(item.Nettokertymä);
          acc[item.Luku].items.push(item);
        }
        return acc;
      }, {})
    },
    spendingData() {
      const HEAD_KEY = 'Paaluokka/Osasto';
      const SUBCATEGORY_KEY = 'Luku';
      const VAL_KEY = 'Voimassaoleva talousarvio';

      const byCategory = _.groupBy(Talousarvio, HEAD_KEY);

      return Object.keys(byCategory).map(category => ({
        label: category,
        total: byCategory[category].reduce((sum, item) => sum + item[VAL_KEY], 0),
        ...byCategory[category].reduce((acc, item) => {
          if (acc[item[SUBCATEGORY_KEY]] == null) {
            acc[item[SUBCATEGORY_KEY]] = {
              total: item[VAL_KEY],
              items: [item]
            };
          } else {
            acc[item[SUBCATEGORY_KEY]].total += item[VAL_KEY];
            acc[item[SUBCATEGORY_KEY]].items.push(item);
          }
          return acc;
        }, {})
      }));
/*
      return Talousarvio.reduce((acc, item) => {
        const headkey = item[HEAD_KEY];
        if (acc[headkey] == null) {
          acc[headkey] = {
            total: item[VAL_KEY],
            items: [item]
          };
        } else {
          acc[headkey].items.push(item);
          acc[headkey].total += item[VAL_KEY];
        }
        return acc;
      }, {});      */
    }
  }
}
</script>

<style lang="scss">
body {
  background-color: rgb(46, 46, 46);

  .main {
    margin: 0 auto;
    max-width: 1100px;
    min-height: 2000px;
  }

  .introduction {
    text-align: left;
    padding: 0 20px;
    margin-bottom: 50px;
  }

  .taxes {
    min-height: 950px;
  }
}
</style>
