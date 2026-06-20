package com.routinetracker.widget

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.facebook.react.HeadlessJsTaskService

class WidgetCompleteReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent?.action != RoutineTrackerWidgetProvider.ACTION_COMPLETE) {
      return
    }

    val activityId = intent.getStringExtra(RoutineTrackerWidgetProvider.EXTRA_ACTIVITY_ID)
    if (activityId.isNullOrBlank()) {
      return
    }

    val pendingResult = goAsync()

    try {
      HeadlessJsTaskService.acquireWakeLockNow(context)
      WidgetCompletionHeadlessService.start(context, activityId)
    } finally {
      pendingResult.finish()
    }
  }
}
