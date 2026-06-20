package com.routinetracker.widget

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule

class RoutineTrackerWidgetModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "RoutineTrackerWidget"

  @ReactMethod
  fun persistSnapshot(json: String, trigger: String, promise: Promise) {
    try {
      android.util.Log.d("RoutineTrackerWidget", "persistSnapshot trigger=$trigger bytes=${json.length}")
      WidgetSnapshotStore.save(reactContext, json, trigger)
      RoutineTrackerWidgetUpdater.updateAllWidgets(reactContext)
      notifyDataMutated(trigger)
      promise.resolve(null)
    } catch (error: Exception) {
      android.util.Log.e("RoutineTrackerWidget", "persistSnapshot failed trigger=$trigger", error)
      promise.reject("WIDGET_PERSIST_FAILED", error)
    }
  }

  @ReactMethod
  fun reloadWidgetUI(promise: Promise) {
    try {
      RoutineTrackerWidgetUpdater.updateAllWidgets(reactContext)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("WIDGET_RELOAD_FAILED", error)
    }
  }

  @ReactMethod
  fun getPersistedSnapshot(promise: Promise) {
    try {
      promise.resolve(WidgetSnapshotStore.loadJson(reactContext))
    } catch (error: Exception) {
      promise.reject("WIDGET_READ_FAILED", error)
    }
  }

  @ReactMethod
  fun scheduleBackgroundSync(promise: Promise) {
    try {
      WidgetSyncScheduler.scheduleAll(reactContext)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("WIDGET_SCHEDULE_FAILED", error)
    }
  }

  @ReactMethod
  fun getDataMutationVersion(promise: Promise) {
    try {
      promise.resolve(WidgetSnapshotStore.getMutationVersion(reactContext).toDouble())
    } catch (error: Exception) {
      promise.reject("WIDGET_VERSION_FAILED", error)
    }
  }

  @ReactMethod
  fun addListener(eventName: String) {
    // Required for NativeEventEmitter on Android.
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    // Required for NativeEventEmitter on Android.
  }

  private fun notifyDataMutated(trigger: String) {
    try {
      if (!reactContext.hasActiveReactInstance()) {
        return
      }

      val params: WritableMap = Arguments.createMap()
      params.putString("trigger", trigger)
      params.putDouble("version", WidgetSnapshotStore.getMutationVersion(reactContext).toDouble())

      reactContext
        .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
        .emit("routine-tracker:data-mutated", params)
    } catch (_: Exception) {
      // App may be backgrounded; resume polling will catch up via mutation version.
    }
  }
}
