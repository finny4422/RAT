package com.routinetracker.widget

import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

class WidgetSyncHeadlessService : HeadlessJsTaskService() {
  companion object {
    fun start(context: Context, trigger: String) {
      val intent = Intent(context, WidgetSyncHeadlessService::class.java).apply {
        putExtra("trigger", trigger)
      }

      ContextCompat.startForegroundService(context, intent)
    }
  }

  override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig? {
    val trigger = intent?.getStringExtra("trigger") ?: "periodic_sync"
    val data = Arguments.createMap().apply {
      putString("trigger", trigger)
    }

    return HeadlessJsTaskConfig(
      "RoutineTrackerWidgetSync",
      data,
      120_000,
      true,
    )
  }
}
