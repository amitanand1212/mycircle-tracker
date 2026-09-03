const { withProjectBuildGradle } = require('expo/config-plugins');

const KGP = 'org.jetbrains.kotlin:kotlin-gradle-plugin';

// `expo-build-properties`' `android.kotlinVersion` only writes the
// `android.kotlinVersion` Gradle property. That feeds the `expoLibs` version
// catalog and `rootProject.ext.kotlinVersion`, but never the buildscript
// classpath: the root `build.gradle` asks for `kotlin-gradle-plugin` without a
// version, and the only version in the graph is the one
// `com.facebook.react:react-native-gradle-plugin` pins in its own catalog
// (2.1.20 for RN 0.86). So the compiler that actually builds every module stays
// at 2.1.20 no matter what the property says, and Kotlin 2.1.20 cannot read the
// 2.3.0 metadata that `play-services-ads` 25.4.0 ships.
//
// Pin the classpath entry so Gradle's highest-wins conflict resolution picks it.
const withKotlinGradlePlugin = (config, { version }) =>
  withProjectBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new Error(
        `withKotlinGradlePlugin expects a Groovy build.gradle, got ${cfg.modResults.language}`
      );
    }

    const pinned = `classpath('${KGP}:${version}')`;
    if (cfg.modResults.contents.includes(pinned)) {
      return cfg;
    }

    const versionless = [`classpath('${KGP}')`, `classpath("${KGP}")`].find((entry) =>
      cfg.modResults.contents.includes(entry)
    );
    if (!versionless) {
      throw new Error(
        `withKotlinGradlePlugin could not find a versionless ${KGP} classpath entry to pin`
      );
    }

    cfg.modResults.contents = cfg.modResults.contents.replace(versionless, pinned);
    return cfg;
  });

module.exports = withKotlinGradlePlugin;
