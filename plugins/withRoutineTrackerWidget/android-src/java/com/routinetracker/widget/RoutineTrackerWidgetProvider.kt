package com.routinetracker.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.view.View
import android.widget.RemoteViews
import com.routinetracker.app.R
import org.json.JSONObject

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
      appWidgetManager.updateAppWidget(appWidgetId, buildRemoteViews(context))
    }
  }

  companion object {
    const val ACTION_COMPLETE = "com.routinetracker.app.widget.COMPLETE"
    const val EXTRA_ACTIVITY_ID = "activityId"

    fun buildRemoteViews(context: Context): RemoteViews {
      val views = RemoteViews(context.packageName, R.layout.widget_routine_tracker)
      val activities = WidgetSnapshotStore.loadActivities(context)

      bindSlot(context, views, activities, 0, R.id.widget_slot_1, R.id.widget_title_1, R.id.widget_due_1, R.id.widget_check_1, R.id.widget_row_1)
      bindSlot(context, views, activities, 1, R.id.widget_slot_2, R.id.widget_title_2, R.id.widget_due_2, R.id.widget_check_2, R.id.widget_row_2)

      if (activities.length() == 0) {
        views.setViewVisibility(R.id.widget_empty, View.VISIBLE)
      } else {
        views.setViewVisibility(R.id.widget_empty, View.GONE)
      }

      return views
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
      rowId: Int,
    ) {
      if (index >= activities.length()) {
        views.setViewVisibility(slotId, View.GONE)
        return
      }

      val item = activities.getJSONObject(index)
      val activityId = item.optString("id", "")
      val title = item.optString("title", "")
      val dueTime = item.optString("dueTime", "")
      val status = item.optString("status", "pending")

      views.setViewVisibility(slotId, View.VISIBLE)
      views.setTextViewText(titleId, title)
      views.setTextViewText(dueId, dueTime)
      views.setInt(rowId, "setBackgroundColor", statusColor(status))

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

    private fun statusColor(status: String): Int {
      return when (status) {
        "missed" -> 0xFFF44336.toInt()
        "due_soon" -> 0xFFFFEB3B.toInt()
        else -> 0xFFFFFFFF.toInt()
      }
    }
  }
}
