const { withAppBuildGradle, withGradleProperties } = require('expo/config-plugins');

// Google Play reports "Optimisation isn't enabled" even though
// `enableMinifyInReleaseBuilds` is on. Minification is genuinely enabled -- what
// is off is R8's *optimiser*, and the Expo bare template turns it off itself:
//
//   proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
//
// AGP ships two default rule files. `proguard-android.txt` still carries
// `-dontoptimize` (and `-dontpreverify`) from the Dalvik era, when running dex
// through the optimiser was considered unsafe. R8 honours it, so it shrinks and
// obfuscates but never optimises. `proguard-android-optimize.txt` is the same
// file with those two lines dropped. Play reads the R8 marker embedded in the
// DEX of the uploaded bundle, sees the optimiser did not run, and raises the
// recommendation. Swapping the file is the whole fix.
const DEFAULT_RULES = 'getDefaultProguardFile("proguard-android.txt")';
const OPTIMIZING_RULES = 'getDefaultProguardFile("proguard-android-optimize.txt")';

const withOptimizingProguardRules = (config) =>
  withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new Error(
        `withR8Optimization expects a Groovy app/build.gradle, got ${cfg.modResults.language}`
      );
    }

    if (cfg.modResults.contents.includes(OPTIMIZING_RULES)) {
      return cfg;
    }
    if (!cfg.modResults.contents.includes(DEFAULT_RULES)) {
      throw new Error(
        `withR8Optimization could not find ${DEFAULT_RULES} in app/build.gradle to swap`
      );
    }

    cfg.modResults.contents = cfg.modResults.contents.replace(DEFAULT_RULES, OPTIMIZING_RULES);
    return cfg;
  });

// Play's second item, "Optimised resource shrinking isn't enabled".
// `enableShrinkResourcesInReleaseBuilds` gives us AGP's standalone resource
// shrinker, which runs beside R8 and can only reason about the unoptimised code
// graph. The optimised shrinker folds that work into R8 itself, so it sees which
// code actually survived optimisation and can drop the resources that code no
// longer reaches. It is opt-in on AGP 8.12 (what RN 0.86 pins) and becomes the
// default in AGP 9.0 whenever `shrinkResources` is on.
const GRADLE_PROPERTIES = {
  'android.r8.optimizedResourceShrinking': 'true',
};

const withOptimizedResourceShrinking = (config) =>
  withGradleProperties(config, (cfg) => {
    for (const [key, value] of Object.entries(GRADLE_PROPERTIES)) {
      const existing = cfg.modResults.find(
        (item) => item.type === 'property' && item.key === key
      );
      if (existing) {
        existing.value = value;
      } else {
        cfg.modResults.push({ type: 'property', key, value });
      }
    }
    return cfg;
  });

// Play's third item, "upgrade your Android Gradle plug-in to version 9.0 or
// higher", is not actionable here: React Native 0.86 pins AGP 8.12.0 through its
// own version catalog, and AGP 9.0 drops APIs that react-native-gradle-plugin
// still uses. It resolves when Expo ships an SDK built against AGP 9.
const withR8Optimization = (config) =>
  withOptimizedResourceShrinking(withOptimizingProguardRules(config));

module.exports = withR8Optimization;
