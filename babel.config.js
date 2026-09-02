module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo auto-applies react-native-worklets/plugin (Reanimated 4)
    // when the package is installed, so it must not be listed manually.
    presets: ['babel-preset-expo'],
  };
};
