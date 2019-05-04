<template>
  <div>
    <Taxes :data="taxData"/>
  </div>
</template>

<script>
// import * as _ from 'lodash';

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
  background-color: rgb(46, 46, 46)
}
</style>