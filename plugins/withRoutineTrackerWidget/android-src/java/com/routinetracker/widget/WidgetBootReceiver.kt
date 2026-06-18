package com.routinetracker.widget

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class WidgetBootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent?) {
    if (intent?.action != Intent.ACTION_BOOT_COMPLETED) {
      return
    }

    WidgetSyncScheduler.scheduleAll(context)
    WidgetSyncScheduler.enqueueSync(context, "phone_reboot")
  }
}
