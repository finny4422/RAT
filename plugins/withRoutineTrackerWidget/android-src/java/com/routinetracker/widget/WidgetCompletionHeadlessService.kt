package com.routinetracker.widget

import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

class WidgetCompletionHeadlessService : HeadlessJsTaskService() {
  companion object {
    fun start(context: Context, activityId: String) {
      val intent = Intent(context, WidgetCompletionHeadlessService::class.java).apply {
        putExtra("activityId", activityId)
      }

      ContextCompat.startForegroundService(context, intent)
    }
  }

  override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig? {
    val activityId = intent?.getStringExtra("activityId") ?: return null
    val data = Arguments.createMap().apply {
      putString("activityId", activityId)
    }

    return HeadlessJsTaskConfig(
      "RoutineTrackerWidgetCompletion",
      data,
      120_000,
      true,
    )
  }
}
