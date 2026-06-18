package com.routinetracker.widget

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class RoutineTrackerWidgetModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "RoutineTrackerWidget"

  @ReactMethod
  fun persistSnapshot(json: String, trigger: String, promise: Promise) {
    try {
      WidgetSnapshotStore.save(reactContext, json, trigger)
      RoutineTrackerWidgetUpdater.updateAllWidgets(reactContext)
      promise.resolve(null)
    } catch (error: Exception) {
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
}
