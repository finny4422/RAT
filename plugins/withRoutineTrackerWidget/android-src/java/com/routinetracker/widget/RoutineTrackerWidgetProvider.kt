package com.routinetracker.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.util.Log
import android.view.View
import android.widget.RemoteViews
import com.routinetracker.app.R

class RoutineTrackerWidgetProvider : AppWidgetProvider() {
  override fun onEnabled(context: Context) {
    WidgetSyncScheduler.scheduleAll(context)
    WidgetSyncScheduler.enqueueSync(context, "widget_added")
  }

  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
    for (appWidgetId in appWidgetIds) {
      try {
        appWidgetManager.updateAppWidget(appWidgetId, buildRemoteViews(context))
      } catch (error: Exception) {
        Log.e(TAG, "onUpdate failed for widget $appWidgetId", error)
        try {
          appWidgetManager.updateAppWidget(appWidgetId, buildFallbackRemoteViews(context))
        } catch (fallbackError: Exception) {
          Log.e(TAG, "fallback widget update failed for widget $appWidgetId", fallbackError)
        }
      }
    }
  }

  companion object {
    private const val TAG = "RoutineTrackerWidget"

    const val ACTION_COMPLETE = "com.routinetracker.app.widget.COMPLETE"
    const val EXTRA_ACTIVITY_ID = "activityId"

    fun buildRemoteViews(context: Context): RemoteViews {
      return try {
        buildRemoteViewsInternal(context)
      } catch (error: Exception) {
        Log.e(TAG, "buildRemoteViews failed", error)
        buildFallbackRemoteViews(context)
      }
    }

    private fun buildRemoteViewsInternal(context: Context): RemoteViews {
      val views = RemoteViews(context.packageName, R.layout.widget_routine_tracker)
      val activities = WidgetSnapshotStore.loadActivities(context)

      Log.d(TAG, "render widget with ${activities.length()} activities")

      bindSlot(
        context,
        views,
        activities,
        0,
        R.id.widget_slot_1,
        R.id.widget_title_1,
        R.id.widget_due_1,
        R.id.widget_check_1,
        R.id.widget_status_1,
      )
      bindSlot(
        context,
        views,
        activities,
        1,
        R.id.widget_slot_2,
        R.id.widget_title_2,
        R.id.widget_due_2,
        R.id.widget_check_2,
        R.id.widget_status_2,
      )

      if (activities.length() == 0) {
        views.setViewVisibility(R.id.widget_empty, View.VISIBLE)
        views.setViewVisibility(R.id.widget_header, View.VISIBLE)
      } else {
        views.setViewVisibility(R.id.widget_empty, View.GONE)
        views.setViewVisibility(R.id.widget_header, View.VISIBLE)
      }

      return views
    }

    private fun buildFallbackRemoteViews(context: Context): RemoteViews {
      return try {
        val views = RemoteViews(context.packageName, R.layout.widget_routine_tracker)
        views.setViewVisibility(R.id.widget_slot_1, View.GONE)
        views.setViewVisibility(R.id.widget_slot_2, View.GONE)
        views.setViewVisibility(R.id.widget_header, View.VISIBLE)
        views.setViewVisibility(R.id.widget_empty, View.VISIBLE)
        views.setTextViewText(R.id.widget_empty, context.getString(R.string.widget_empty))
        views
      } catch (_: Exception) {
        RemoteViews(context.packageName, android.R.layout.simple_list_item_1).apply {
          setTextViewText(android.R.id.text1, context.getString(R.string.widget_empty))
        }
      }
    }

    private fun bindSlot(
      context: Context,
      views: RemoteViews,
      activities: org.json.JSONArray,
      index: Int,
      slotId: Int,
      titleId: Int,
      dueId: Int,
      checkId: Int,
      statusId: Int,
    ) {
      if (index >= activities.length()) {
        views.setViewVisibility(slotId, View.GONE)
        return
      }

      val item = activities.optJSONObject(index)
      if (item == null) {
        Log.w(TAG, "skipping non-object activity at index $index")
        views.setViewVisibility(slotId, View.GONE)
        return
      }

      val activityId = item.optString("id", "")
      val title = item.optString("title", "Untitled activity")
      val dueTime = item.optString("dueTime", "")
      val status = item.optString("status", "pending")

      views.setViewVisibility(slotId, View.VISIBLE)
      views.setTextViewText(titleId, title)

      if (dueTime.isBlank()) {
        views.setViewVisibility(dueId, View.GONE)
      } else {
        views.setViewVisibility(dueId, View.VISIBLE)
        views.setTextViewText(dueId, dueTime)
      }

      views.setInt(statusId, "setBackgroundColor", statusAccentColor(status))

      if (activityId.isBlank()) {
        views.setOnClickPendingIntent(checkId, null)
        return
      }

      val completeIntent = Intent(context, WidgetCompleteReceiver::class.java).apply {
        action = ACTION_COMPLETE
        putExtra(EXTRA_ACTIVITY_ID, activityId)
      }
      val pendingIntent = PendingIntent.getBroadcast(
        context,
        activityId.hashCode(),
        completeIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
      views.setOnClickPendingIntent(checkId, pendingIntent)
    }

    private fun statusAccentColor(status: String): Int {
      return when (status) {
        "missed" -> 0xFFFF453A.toInt()
        "due_soon" -> 0xFFFFD60A.toInt()
        else -> 0xFF3A3A3C.toInt()
      }
    }
  }
}
