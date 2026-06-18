package com.routinetracker.widget

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

object WidgetSnapshotStore {
  private const val PREFS_NAME = "routine_tracker_widget"
  private const val KEY_SNAPSHOT = "widget_snapshot_json"
  private const val KEY_TRIGGER = "widget_snapshot_trigger"

  fun save(context: Context, snapshotJson: String, trigger: String) {
    // commit() writes synchronously so RoutineTrackerWidgetUpdater reads the new
    // snapshot immediately after persistSnapshot returns. apply() is async and can
    // leave the widget rendering stale JSON on the next APPWIDGET_UPDATE broadcast.
    val saved = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .edit()
      .putString(KEY_SNAPSHOT, snapshotJson)
      .putString(KEY_TRIGGER, trigger)
      .commit()

    if (!saved) {
      throw IllegalStateException("Failed to persist widget snapshot to SharedPreferences.")
    }
  }

  fun loadJson(context: Context): String? {
    return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .getString(KEY_SNAPSHOT, null)
  }

  fun loadActivities(context: Context): JSONArray {
    val raw = loadJson(context) ?: return JSONArray()
    return try {
      JSONObject(raw).optJSONArray("activities") ?: JSONArray()
    } catch (_: Exception) {
      JSONArray()
    }
  }
}
