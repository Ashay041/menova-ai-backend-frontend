import json
import os
import re
from datetime import timedelta
import datetime  # keep for datetime.datetime now()
import dateparser
import asyncio

# from google_auth_oauthlib.flow import Flow, InstalledAppFlowß
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build


class AppointmentAgent:
    def __init__(self, token_file="token_demo.json", default_tz="America/New_York"):
        self.token_file = token_file
        self.SCOPES = ["https://www.googleapis.com/auth/calendar"]
        self.default_tz = default_tz

    def _get_credentials(self) -> Credentials:
        if not os.path.exists(self.token_file):
            raise FileNotFoundError("You must authenticate first and save token_demo.json")

        creds = Credentials.from_authorized_user_file(self.token_file, self.SCOPES)

        if not creds.valid and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            with open(self.token_file, "w") as f:
                f.write(creds.to_json())

        return creds

    def _parse_appointment_text(self, text: str) -> dict:
        text = text.replace("/appointment", "", 1).strip()
        appt = dict(summary="Appointment", location="", description="")

        # Time
        t_match = re.search(r"\bat\s+([0-9:]+\s*(?:am|pm)?)", text, re.I)
        time_txt = t_match.group(1) if t_match else "now"
        if t_match:
            text = text.replace(t_match.group(0), "").strip()

        # Date
        d_match = re.search(
            r"\b(today|tomorrow|mon|tue|wed|thu|fri|sat|sun|"
            r"\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*|"
            r"\d{1,2}/\d{1,2}(?:/\d{2,4})?)\b", text, re.I
        )
        date_txt = d_match.group(1) if d_match else "today"
        if d_match:
            text = text.replace(d_match.group(0), "").strip()

        dt_str = f"{date_txt} {time_txt}"
        start_dt = dateparser.parse(
            dt_str,
            settings={"TIMEZONE": self.default_tz, "RETURN_AS_TIMEZONE_AWARE": True}
        )
        if not start_dt:
            raise ValueError(f"Could not parse '{dt_str}'")

        appt["start_dt"] = start_dt
        appt["end_dt"] = start_dt + timedelta(hours=1)

        # Person
        with_match = re.search(r"\bwith\s+(.+?)(?=$|\s+at|\s+for)", text, re.I)
        if with_match:
            person = with_match.group(1).strip()
            appt["summary"] = f"Appointment with {person}"
            text = text.replace(with_match.group(0), "").strip()
            if "dr" in person.lower():
                appt["attendees"] = [{"email": f"{person.replace(' ', '').lower()}@example.com"}]

        # Location
        loc_match = re.search(r"\bat\s+(.+?)(?=$|\s+for)", text, re.I)
        if loc_match:
            appt["location"] = loc_match.group(1).strip()
            text = text.replace(loc_match.group(0), "").strip()

        appt["description"] = text.strip()
        return appt

    async def create_appointment(self, command: str) -> dict:
        try:
            data = self._parse_appointment_text(command)
            creds = self._get_credentials()
            service = build("calendar", "v3", credentials=creds)

            event_body = {
                "summary": data["summary"],
                "location": data["location"],
                "description": data["description"],
                "start": {"dateTime": data["start_dt"].isoformat(), "timeZone": self.default_tz},
                "end": {"dateTime": data["end_dt"].isoformat(), "timeZone": self.default_tz},
            }
            if "attendees" in data:
                event_body["attendees"] = data["attendees"]

            loop = asyncio.get_event_loop()
            event = await loop.run_in_executor(
                None,
                lambda: service.events().insert(calendarId="primary", body=event_body).execute()
            )

            return {"status": "success", "event_id": event["id"], "link": event["htmlLink"], "message": "Appointment created successfully!"}

        except Exception as exc:
            return {"status": "error", "message": str(exc)}


    ## Do this once if testing locally

    # SCOPES = ['https://www.googleapis.com/auth/calendar']
    # creds_file = 'credentials_desktop.json'

    # flow = InstalledAppFlow.from_client_secrets_file(creds_file, SCOPES)
    # creds = flow.run_local_server(port=8080)

    # # Save token manually
    # with open("token_demo.json", "w") as f:
    #     f.write(creds.to_json())
