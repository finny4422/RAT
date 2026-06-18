package com.routinetracker.widget

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters

class WidgetSyncWorker(
  context: Context,
  params: WorkerParameters,
) : CoroutineWorker(context, params) {
  override suspend fun doWork(): Result {
    val trigger = inputData.getString("trigger") ?: "periodic_sync"
    return try {
      WidgetSyncHeadlessService.start(applicationContext, trigger)
      Result.success()
    } catch (_: Exception) {
      Result.retry()
    }
  }
}
