# vue-kanji-character-sketchpad

## Usage
```
<div id="app">
  <template>
    <h3>vue-kanji-character-sketchpad example</h3>
    <div class="wrapper">
      <kanji-character-sketchpad
        svg-repository-base-url="https://d1y2ilnnh4c7kl.cloudfront.net/"
        character="下"
        @stroke="stroke"
        :show-guide="true"
        guide-stroke-color="#D0D0D0"
        stroke-color="#444"
        ref="sketchpad">
      </kanji-character-sketchpad>
      <button @click="reset">Reset</button>
    </div>
  </template>
</div>
<script>
  const Main = {
    name: 'demo',
    components: {
      'kanji-character-sketchpad': window['vue-kanji-character-sketchpad']
    },
    methods: {
      stroke: function (data) {
        console.log(data)
      },
      reset: function () {
        this.$refs.sketchpad.reset()
      }
    }
  }
  const Ctor = Vue.extend(Main)
  new Ctor().$mount('#app')
</script>
```

## Project setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn serve
```

### Compiles and minifies for production
```
yarn build
```

### Lints and fixes files
```
yarn lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
