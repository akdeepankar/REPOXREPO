import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Card, CardContent } from './ui/card';

export default function NotificationPanel({ notifications = [] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-80">
      <Card className="shadow-lg">
        <CardContent>
          <div className="font-semibold text-lg mb-2">Notifications</div>
          {notifications.length === 0 ? (
            <div className="text-sm text-gray-500">No new notifications.</div>
          ) : (
            <ul className="space-y-3">
              {notifications.map((note, i) => (
                <li key={i} className="bg-[#f8f6ff] rounded-md p-3 text-sm text-gray-700 border border-[#e0d7ff]">
                  {note}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
