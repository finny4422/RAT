package com.routinetracker.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context

object RoutineTrackerWidgetUpdater {
  fun updateAllWidgets(context: Context) {
    val manager = AppWidgetManager.getInstance(context)
    val component = ComponentName(context, RoutineTrackerWidgetProvider::class.java)
    val ids = manager.getAppWidgetIds(component)
    if (ids.isEmpty()) {
      return
    }

    val intent = android.content.Intent(context, RoutineTrackerWidgetProvider::class.java).apply {
      action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
      putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
    }
    context.sendBroadcast(intent)
  }
}
