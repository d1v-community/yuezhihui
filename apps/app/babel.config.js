// babel-preset-taro 更多选项和默认值：
// https://docs.taro.zone/docs/next/babel-config
const isWeapp = process.env.TARO_ENV === 'weapp'

module.exports = {
  presets: [
    ['taro', {
      framework: 'react',
      ts: true,
      compiler: 'webpack5',
      // The app package has an H5-oriented browserslist. Ignore it for weapp so
      // Babel fully downlevels syntax like optional chaining/nullish coalescing.
      ...(isWeapp
        ? {
            ignoreBrowserslistConfig: true,
            forceAllTransforms: true,
            targets: {
              chrome: '49',
              ios: '8'
            }
          }
        : {})
    }]
  ]
}
