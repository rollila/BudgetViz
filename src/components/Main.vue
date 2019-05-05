<template>
  <div class="main">
    <div class="introduction">
      <p>This page contains a visual representation of budget data of the Finnish government for year 2018. The visualization has been implemented for the Interactive Data Visualization course at Uni. Helsinki.
      <br>
      Currently implemented: tax income, explorable by category.
      <br>
      To be implemented: Spending.</p>      
    </div>
    <Taxes :data="taxData"/>    
  </div>
</template>

<script>
import Verotulot from '../assets/Verotulot-fi.csv';

import Taxes from './Taxes';

export default {
  components: {
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
    }
  }
}
</script>

<style lang="scss">
body {
  background-color: rgb(46, 46, 46);

  .main {
    margin: 0 auto;
    max-width: 1800px;
  }

  .introduction {
    text-align: left;
    padding: 0 20px;
    margin-bottom: 150px;
  }
}
</style>