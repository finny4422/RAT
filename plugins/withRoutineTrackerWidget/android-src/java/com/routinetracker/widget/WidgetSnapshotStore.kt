package com.routinetracker.widget

import android.content.Context
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject

object WidgetSnapshotStore {
  private const val TAG = "WidgetSnapshotStore"
  private const val PREFS_NAME = "routine_tracker_widget"
  private const val KEY_SNAPSHOT = "widget_snapshot_json"
  private const val KEY_TRIGGER = "widget_snapshot_trigger"
  private const val KEY_MUTATION_VERSION = "data_mutation_version"

  fun save(context: Context, snapshotJson: String, trigger: String) {
    Log.d(TAG, "save snapshot trigger=$trigger length=${snapshotJson.length}")

    // commit() writes synchronously so RoutineTrackerWidgetUpdater reads the new
    // snapshot immediately after persistSnapshot returns. apply() is async and can
    // leave the widget rendering stale JSON on the next APPWIDGET_UPDATE broadcast.
    val saved = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .edit()
      .putString(KEY_SNAPSHOT, snapshotJson)
      .putString(KEY_TRIGGER, trigger)
      .putLong(KEY_MUTATION_VERSION, getMutationVersion(context) + 1L)
      .commit()

    if (!saved) {
      throw IllegalStateException("Failed to persist widget snapshot to SharedPreferences.")
    }

    logSnapshotSummary(context)
  }

  fun loadJson(context: Context): String? {
    return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .getString(KEY_SNAPSHOT, null)
  }

  fun getMutationVersion(context: Context): Long {
    return context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .getLong(KEY_MUTATION_VERSION, 0L)
  }

  fun loadActivities(context: Context): JSONArray {
    val raw = loadJson(context) ?: return JSONArray()

    return try {
      val activities = JSONObject(raw).optJSONArray("activities") ?: JSONArray()
      Log.d(TAG, "loaded ${activities.length()} activities from snapshot")
      activities
    } catch (error: Exception) {
      Log.e(TAG, "failed to parse snapshot activities", error)
      JSONArray()
    }
  }

  private fun logSnapshotSummary(context: Context) {
    try {
      val activities = loadActivities(context)
      val summary = mutableListOf<String>()
      for (index in 0 until activities.length()) {
        val item = activities.optJSONObject(index)
        if (item != null) {
          summary.add("${item.optString("id")}:${item.optString("title")}")
        }
      }
      Log.d(TAG, "snapshot summary activities=$summary")
    } catch (error: Exception) {
      Log.w(TAG, "snapshot summary failed", error)
    }
  }
}
