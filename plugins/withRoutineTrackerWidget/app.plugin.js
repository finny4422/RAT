const fs = require('fs');
const path = require('path');

const {
  AndroidConfig,
  withAndroidManifest,
  withAppBuildGradle,
  withDangerousMod,
  withMainApplication,
} = require('expo/config-plugins');

const PACKAGE = 'com.routinetracker.app';
const WIDGET_PACKAGE = 'com.routinetracker.widget';
const PLUGIN_ANDROID_SRC = path.join(__dirname, 'android-src');

function copyAndroidSources(projectRoot) {
  const targetRoot = path.join(projectRoot, 'android', 'app', 'src', 'main');
  const sourceRoot = PLUGIN_ANDROID_SRC;

  if (!fs.existsSync(sourceRoot)) {
    throw new Error('withRoutineTrackerWidget: android-src folder is missing.');
  }

  fs.mkdirSync(targetRoot, { recursive: true });
  fs.cpSync(sourceRoot, targetRoot, { recursive: true, force: true });
}

function addWorkManagerDependency(buildGradle) {
  if (buildGradle.includes('androidx.work:work-runtime-ktx')) {
    return buildGradle;
  }

  if (!buildGradle.includes('dependencies {')) {
    throw new Error('withRoutineTrackerWidget: Could not find dependencies block in app/build.gradle.');
  }

  return buildGradle.replace(
    /dependencies\s*\{/,
    `dependencies {
    implementation "androidx.work:work-runtime-ktx:2.9.1"`,
  );
}

function ensureMainApplication(mainApplication) {
  if (mainApplication.includes('RoutineTrackerWidgetPackage')) {
    return mainApplication;
  }

  const kotlinAdd = `packages.add(${WIDGET_PACKAGE}.RoutineTrackerWidgetPackage())`;
  const javaAdd = `packages.add(new ${WIDGET_PACKAGE}.RoutineTrackerWidgetPackage())`;

  if (mainApplication.includes('= PackageList(this).packages')) {
    return mainApplication.replace(
      '= PackageList(this).packages',
      `= PackageList(this).packages.apply {\n              add(${WIDGET_PACKAGE}.RoutineTrackerWidgetPackage())\n            }`,
    );
  }

  const kotlinPackagesLine = 'val packages = PackageList(this).packages';
  if (mainApplication.includes(kotlinPackagesLine)) {
    return mainApplication.replace(
      kotlinPackagesLine,
      `${kotlinPackagesLine}\n            ${kotlinAdd}`,
    );
  }

  if (mainApplication.includes('.packages.apply {')) {
    return mainApplication.replace(
      /\.packages\.apply\s*\{/,
      `.packages.apply {\n              add(${WIDGET_PACKAGE}.RoutineTrackerWidgetPackage())`,
    );
  }

  const javaMatch = mainApplication.match(/packages\.add\(new\s+[^)]+\)\s*;/);
  if (javaMatch) {
    return mainApplication.replace(
      javaMatch[0],
      `${javaMatch[0]}\n            ${javaAdd}`,
    );
  }

  if (mainApplication.includes('return packages')) {
    return mainApplication.replace(/return packages/, `${kotlinAdd}\n            return packages`);
  }

  throw new Error(
    'withRoutineTrackerWidget: Could not inject RoutineTrackerWidgetPackage into MainApplication.',
  );
}

function withWidgetManifest(androidManifest) {
  const application = AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifest);
  application.receiver = application.receiver ?? [];
  application.service = application.service ?? [];

  const receivers = [
    {
      $: {
        'android:name': `${WIDGET_PACKAGE}.RoutineTrackerWidgetProvider`,
        'android:exported': 'true',
        'android:label': '@string/widget_name',
      },
      'intent-filter': [
        {
          action: [{ $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } }],
        },
      ],
      'meta-data': [
        {
          $: {
            'android:name': 'android.appwidget.provider',
            'android:resource': '@xml/routine_tracker_widget_info',
          },
        },
      ],
    },
    {
      $: {
        'android:name': `${WIDGET_PACKAGE}.WidgetCompleteReceiver`,
        'android:exported': 'false',
      },
      'intent-filter': [
        {
          action: [{ $: { 'android:name': `${PACKAGE}.widget.COMPLETE` } }],
        },
      ],
    },
    {
      $: {
        'android:name': `${WIDGET_PACKAGE}.WidgetBootReceiver`,
        'android:exported': 'true',
      },
      'intent-filter': [
        {
          action: [{ $: { 'android:name': 'android.intent.action.BOOT_COMPLETED' } }],
        },
      ],
    },
  ];

  const services = [
    {
      $: {
        'android:name': `${WIDGET_PACKAGE}.WidgetSyncHeadlessService`,
        'android:exported': 'false',
      },
    },
    {
      $: {
        'android:name': `${WIDGET_PACKAGE}.WidgetCompletionHeadlessService`,
        'android:exported': 'false',
      },
    },
  ];

  for (const receiver of receivers) {
    const exists = application.receiver.some(
      (item) => item.$?.['android:name'] === receiver.$['android:name'],
    );
    if (!exists) {
      application.receiver.push(receiver);
    }
  }

  for (const service of services) {
    const exists = application.service.some(
      (item) => item.$?.['android:name'] === service.$['android:name'],
    );
    if (!exists) {
      application.service.push(service);
    }
  }

  AndroidConfig.Manifest.addUsesPermission(
    androidManifest,
    'android.permission.RECEIVE_BOOT_COMPLETED',
  );
  AndroidConfig.Manifest.addUsesPermission(androidManifest, 'android.permission.WAKE_LOCK');

  return androidManifest;
}

/** @type {import('expo/config-plugins').ConfigPlugin} */
const withRoutineTrackerWidget = (config) => {
  config = withDangerousMod(config, [
    'android',
    async (modConfig) => {
      copyAndroidSources(modConfig.modRequest.projectRoot);
      return modConfig;
    },
  ]);

  config = withAppBuildGradle(config, (modConfig) => {
    modConfig.modResults.contents = addWorkManagerDependency(modConfig.modResults.contents);
    return modConfig;
  });

  config = withMainApplication(config, (modConfig) => {
    modConfig.modResults.contents = ensureMainApplication(modConfig.modResults.contents);
    return modConfig;
  });

  config = withAndroidManifest(config, (modConfig) => {
    modConfig.modResults.manifest = withWidgetManifest(modConfig.modResults.manifest);
    return modConfig;
  });

  return config;
};

module.exports = withRoutineTrackerWidget;
