import asyncio
import json
import sys
from winsdk.windows.ui.notifications.management import UserNotificationListener
from winsdk.windows.ui.notifications import NotificationKinds

async def get_notifications():
    try:
        listener = UserNotificationListener.current
        access_status = await listener.request_access_async()
        
        if access_status != 1: # 1 is Allowed
            print(json.dumps({"type": "ERROR", "msg": "Access to notifications denied. Please enable in Windows Settings."}))
            return

        print(json.dumps({"type": "INFO", "msg": "Notification listener (Python) active. Watching for WhatsApp..."}))
        sys.stdout.flush()

        # We initialize lastID with the highest current ID to only catch NEW ones from now on
        last_notification_id = 0
        try:
            initial = await listener.get_notifications_async(NotificationKinds.TOAST)
            for n in initial:
                if n.id > last_notification_id:
                    last_notification_id = n.id
        except: pass

        while True:
            try:
                notifications = await listener.get_notifications_async(NotificationKinds.TOAST)
                for n in notifications:
                    if n.id > last_notification_id:
                        try:
                            app_name = n.app_info.display_info.display_name
                            if "WhatsApp" in app_name or "whatsapp" in app_name.lower():
                                visual = n.notification.visual
                                binding = None
                                try:
                                    # Use the bindings collection found in diagnostics
                                    for b in visual.bindings:
                                        binding = b
                                        break
                                except: pass

                                if binding:
                                    elements = binding.get_text_elements()
                                    title = elements[0].text if len(elements) > 0 else "Unknown Contact"
                                    body = elements[1].text if len(elements) > 1 else ""
                                    
                                    data = {
                                        "type": "NOTIFICATION",
                                        "app": app_name,
                                        "contact": title,
                                        "content": body,
                                        "id": n.id
                                    }
                                    print(json.dumps(data))
                                    sys.stdout.flush()
                        except: pass
                        last_notification_id = n.id
            except Exception as e:
                # print(json.dumps({"type": "ERROR", "msg": f"Loop error: {str(e)}"}))
                pass
            
            await asyncio.sleep(1)

    except Exception as e:
        print(json.dumps({"type": "ERROR", "msg": str(e)}))
        sys.stdout.flush()

if __name__ == "__main__":
    asyncio.run(get_notifications())
