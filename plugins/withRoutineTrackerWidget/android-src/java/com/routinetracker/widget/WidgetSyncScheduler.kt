package com.routinetracker.widget

import android.content.Context
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.workDataOf
import java.util.Calendar
import java.util.concurrent.TimeUnit

object WidgetSyncScheduler {
  private const val PERIODIC_WORK = "routine_tracker_widget_periodic_sync"
  private const val ONE_SHOT_WORK = "routine_tracker_widget_one_shot_sync"

  fun scheduleAll(context: Context) {
    schedulePeriodicSync(context)
    scheduleMidnightSync(context)
  }

  fun enqueueSync(context: Context, trigger: String) {
    val request = OneTimeWorkRequestBuilder<WidgetSyncWorker>()
      .setInputData(workDataOf("trigger" to trigger))
      .build()

    WorkManager.getInstance(context)
      .enqueueUniqueWork(
        "$ONE_SHOT_WORK-$trigger-${System.currentTimeMillis()}",
        androidx.work.ExistingWorkPolicy.APPEND,
        request,
      )
  }

  private fun schedulePeriodicSync(context: Context) {
    val request = PeriodicWorkRequestBuilder<WidgetSyncWorker>(15, TimeUnit.MINUTES)
      .setInputData(workDataOf("trigger" to "periodic_sync"))
      .build()

    WorkManager.getInstance(context).enqueueUniquePeriodicWork(
      PERIODIC_WORK,
      ExistingPeriodicWorkPolicy.UPDATE,
      request,
    )
  }

  private fun scheduleMidnightSync(context: Context) {
    val now = Calendar.getInstance()
    val nextMidnight = Calendar.getInstance().apply {
      add(Calendar.DAY_OF_YEAR, 1)
      set(Calendar.HOUR_OF_DAY, 0)
      set(Calendar.MINUTE, 0)
      set(Calendar.SECOND, 0)
      set(Calendar.MILLISECOND, 0)
    }

    val delayMs = nextMidnight.timeInMillis - now.timeInMillis
    val request = OneTimeWorkRequestBuilder<WidgetSyncWorker>()
      .setInitialDelay(delayMs, TimeUnit.MILLISECONDS)
      .setInputData(workDataOf("trigger" to "date_changed"))
      .build()

    WorkManager.getInstance(context)
      .enqueueUniqueWork(
        "routine_tracker_widget_midnight_sync",
        androidx.work.ExistingWorkPolicy.REPLACE,
        request,
      )
  }
}
